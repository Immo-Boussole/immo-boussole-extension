import browser from 'webextension-polyfill';
import { getStoredConfig } from '../storage';
import { ExternalListingPayload, AddListingResponse } from '../types';
import { t } from '../i18n';

browser.runtime.onMessage.addListener(async (message: any, sender: any): Promise<AddListingResponse> => {
  if (message.type === 'ADD_LISTING') {
    return await handleAddListing(message.payload);
  }
  return { success: false, message: t('unknownMessageType') };
});

async function handleAddListing(payload: ExternalListingPayload): Promise<AddListingResponse> {
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
        browser.tabs.create({ url: cleanServerUrl });
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
      if (data.message === 'Scraping task started in background.') {
        localizedMsg = t('scrapingStarted');
      }

      let listingId: number | undefined = undefined;
      let immoBoussoleUrl: string | undefined = undefined;

      if (data.data && data.data.listing_id) {
        listingId = data.data.listing_id;
        immoBoussoleUrl = `${cleanServerUrl}/listing/${listingId}`;
      } else if (data.data && data.data.immo_boussole_url) {
        immoBoussoleUrl = `${cleanServerUrl}${data.data.immo_boussole_url}`;
      }

      // Auto-open new tab if option is enabled (enabled by default)
      if (config.openTabAfterImport !== false && immoBoussoleUrl) {
        try {
          browser.tabs.create({ url: immoBoussoleUrl });
        } catch (e) {
          console.warn('Could not auto-open listing tab:', e);
        }
      }

      return {
        success: true,
        message: localizedMsg || t('addSuccess'),
        listingId,
        immoBoussoleUrl
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
