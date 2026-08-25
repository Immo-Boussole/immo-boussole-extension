import browser from 'webextension-polyfill';
import { getStoredConfig } from '../storage';
import { ExternalListingPayload, AddListingResponse, CheckListingResponse, isListingUrl } from '../types';
import { t } from '../i18n';

// Cache of listing check statuses by tabId
const tabListingStatusCache: Record<number, CheckListingResponse> = {};

// Configure SidePanel on action click for Chrome / Edge if supported
try {
  if (typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome?.sidePanel?.setPanelBehavior) {
    (globalThis as any).chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
} catch (e) {
  // ignore
}

browser.runtime.onMessage.addListener(async (message: any, sender: any): Promise<any> => {
  if (message.type === 'CHECK_LISTING_EXISTS') {
    const tabId = sender?.tab?.id;
    return await handleCheckListingExists(message.url, tabId);
  }
  if (message.type === 'GET_TAB_LISTING_STATUS') {
    const tabId = message.tabId;
    if (tabId && tabListingStatusCache[tabId]) {
      return tabListingStatusCache[tabId];
    }
    return { exists: false };
  }
  if (message.type === 'ADD_LISTING') {
    const tabId = sender?.tab?.id;
    return await handleAddListing(message.payload, tabId);
  }
  return { success: false, message: t('unknownMessageType') };
});

// Clean up cache when tabs are closed
browser.tabs.onRemoved.addListener((tabId: number) => {
  delete tabListingStatusCache[tabId];
});

// Automatically check active tab when switched or loaded
browser.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await browser.tabs.get(activeInfo.tabId).catch(() => null);
    if (tab && tab.url && isListingUrl(tab.url)) {
      await handleCheckListingExists(tab.url, activeInfo.tabId);
    } else if (tab) {
      await clearBadge(activeInfo.tabId);
    }
  } catch (e) {
    // ignore
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  try {
    if (changeInfo.status === 'complete' && tab && tab.url) {
      if (isListingUrl(tab.url)) {
        await handleCheckListingExists(tab.url, tabId);
      } else {
        await clearBadge(tabId);
      }
    }
  } catch (e) {
    // ignore
  }
});

function isListingPage(url: string): boolean {
  return isListingUrl(url);
}

async function setCheckBadge(tabId?: number) {
  if (!tabId) return;
  try {
    await browser.action.setBadgeText({ tabId, text: '✔' }).catch(() => {});
    await browser.action.setBadgeBackgroundColor({ tabId, color: '#10b981' }).catch(() => {});
  } catch (e) {
    // ignore
  }
}

async function clearBadge(tabId?: number) {
  if (!tabId) return;
  try {
    await browser.action.setBadgeText({ tabId, text: '' }).catch(() => {});
  } catch (e) {
    // ignore
  }
}

async function handleCheckListingExists(url: string, tabId?: number): Promise<CheckListingResponse> {
  try {
    const config = await getStoredConfig();
    if (!config.serverUrl || !config.apiKey) {
      return { exists: false };
    }

    const cleanServerUrl = config.serverUrl.replace(/\/+$/, '');
    const checkEndpoint = `${cleanServerUrl}/api/v1/actions/check-listing?url=${encodeURIComponent(url)}`;

    const response = await fetch(checkEndpoint, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.exists) {
        const fullUrl = `${cleanServerUrl}${data.immo_boussole_url || (`/listings/${data.listing_id}`)}`;
        const result: CheckListingResponse = {
          exists: true,
          listingId: data.listing_id,
          immoBoussoleUrl: fullUrl,
          title: data.title
        };
        if (tabId) {
          tabListingStatusCache[tabId] = result;
          await setCheckBadge(tabId);
        }
        return result;
      }
    }
    
    if (tabId) {
      tabListingStatusCache[tabId] = { exists: false };
      await clearBadge(tabId);
    }
    return { exists: false };
  } catch (err) {
    if (tabId) await clearBadge(tabId);
    return { exists: false };
  }
}

async function handleAddListing(payload: ExternalListingPayload, tabId?: number): Promise<AddListingResponse> {
  try {
    const config = await getStoredConfig();
    if (!config.serverUrl || !config.apiKey) {
      return {
        success: false,
        message: t('notConfigured')
      };
    }

    const cleanServerUrl = config.serverUrl.replace(/\/+$/, '');
    
    // Choose endpoint: if metadata present, use submit-external-listing, else submit-url
    const hasMetadata = payload.title || payload.price || payload.area;
    const endpoint = hasMetadata 
      ? `${cleanServerUrl}/api/v1/actions/submit-external-listing`
      : `${cleanServerUrl}/api/v1/actions/submit-url`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const bodyText = await response.text();

    // Check Cloudflare interception
    if (
      response.redirected && (response.url.includes('cloudflareaccess.com') || response.url.includes('cloudflare.com')) ||
      bodyText.includes('cloudflare') ||
      bodyText.includes('challenge-platform') ||
      bodyText.includes('cf-chl')
    ) {
      // Open server URL to let user complete Cloudflare validation
      try {
        await browser.tabs.create({ url: cleanServerUrl, active: true }).catch(() => {});
      } catch (e) {
        // ignore
      }
      return {
        success: false,
        message: t('cloudflareDetected')
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `${t('serverError')} (${response.status}): ${bodyText || response.statusText}`
      };
    }

    try {
      const data = JSON.parse(bodyText);
      let localizedMsg = data.message;
      const isAlreadyExists = data.data?.already_exists || (typeof data.message === 'string' && data.message.toLowerCase().includes('déjà'));

      if (isAlreadyExists) {
        localizedMsg = t('listingAlreadyExists');
      } else if (data.message === 'Scraping task started in background.') {
        localizedMsg = t('scrapingStarted');
      }

      let listingId: number | undefined = undefined;

      if (data.data && data.data.listing_id) {
        listingId = data.data.listing_id;
      }

      // If not present in response, check via check-listing endpoint
      if (!listingId) {
        const checkRes = await handleCheckListingExists(payload.url, tabId);
        if (checkRes.exists && checkRes.listingId) {
          listingId = checkRes.listingId;
        }
      }

      const immoBoussoleUrl: string = listingId
        ? `${cleanServerUrl}/listings/${listingId}`
        : `${cleanServerUrl}/`;

      // Update badge to green checkmark on success
      if (tabId) {
        await setCheckBadge(tabId);
        tabListingStatusCache[tabId] = {
          exists: true,
          listingId,
          immoBoussoleUrl,
          title: payload.title
        };
      }

      // Auto-open new tab if option is enabled (default is true)
      if (config.openTabAfterImport !== false && immoBoussoleUrl && listingId) {
        try {
          await browser.tabs.create({ url: immoBoussoleUrl, active: true }).catch(() => {});
        } catch (e) {
          console.warn('Could not auto-open listing tab:', e);
        }
      }

      return {
        success: true,
        message: localizedMsg || t('addSuccess'),
        listingId,
        immoBoussoleUrl,
        alreadyExists: isAlreadyExists
      };
    } catch {
      return {
        success: false,
        message: t('invalidJsonResponse')
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `${t('connectionError')}: ${error.message || t('serverUnreachable')}`
    };
  }
}
