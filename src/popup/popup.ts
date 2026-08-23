import browser from 'webextension-polyfill';
import { getStoredConfig, saveStoredConfig } from '../storage';
import { isListingUrl } from '../types';
import { t, localizeDocument } from '../i18n';

document.addEventListener('DOMContentLoaded', async () => {
  // Localize static UI elements
  localizeDocument();

  // Display manifest extension version
  try {
    const manifest = browser.runtime.getManifest();
    const versionEl = document.getElementById('ext-version');
    if (versionEl && manifest && manifest.version) {
      versionEl.textContent = `v${manifest.version}`;
    }
  } catch (e) {
    // ignore
  }

  const serverUrlInput = document.getElementById('server-url') as HTMLInputElement;
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;

  const apikeyForm = document.getElementById('apikey-form') as HTMLFormElement;
  const userpassForm = document.getElementById('userpass-form') as HTMLFormElement;
  const btnTest = document.getElementById('btn-test') as HTMLButtonElement;
  const btnAddCurrent = document.getElementById('btn-add-current') as HTMLButtonElement;
  const btnAddManual = document.getElementById('btn-add-manual') as HTMLButtonElement;
  const manualUrlInput = document.getElementById('manual-url') as HTMLInputElement;
  
  const statusMsg = document.getElementById('status-message') as HTMLDivElement;
  const addStatusMsg = document.getElementById('add-status-message') as HTMLDivElement;
  const badge = document.getElementById('connection-badge') as HTMLSpanElement;

  const cloudflareBanner = document.getElementById('cloudflare-banner') as HTMLDivElement;
  const btnRetryCf = document.getElementById('btn-retry-cf') as HTMLButtonElement;

  // Collapsible configuration card
  const configCard = document.getElementById('config-card') as HTMLDivElement;
  const configToggleHeader = document.getElementById('config-toggle-header') as HTMLDivElement;

  configToggleHeader.addEventListener('click', () => {
    configCard.classList.toggle('collapsed');
  });

  // New tab & pre-parse options
  const openTabCheckbox = document.getElementById('open-tab-checkbox') as HTMLInputElement;
  const usePreparsedCheckbox = document.getElementById('use-preparsed-checkbox') as HTMLInputElement;
  const btnViewListing = document.getElementById('btn-view-listing') as HTMLButtonElement;
  const btnParse = document.getElementById('btn-parse') as HTMLButtonElement;

  // Pre-parsed Preview Card Elements
  const parsedPreviewCard = document.getElementById('parsed-preview-card') as HTMLDivElement;
  const previewThumbnails = document.getElementById('preview-thumbnails') as HTMLDivElement;
  const previewPhotosBadge = document.getElementById('preview-photos-badge') as HTMLSpanElement;
  const previewPlansBadge = document.getElementById('preview-plans-badge') as HTMLSpanElement;
  const prevTitle = document.getElementById('prev-title') as HTMLSpanElement;
  const prevPrice = document.getElementById('prev-price') as HTMLSpanElement;
  const prevArea = document.getElementById('prev-area') as HTMLSpanElement;
  const prevLand = document.getElementById('prev-land') as HTMLSpanElement;
  const prevRooms = document.getElementById('prev-rooms') as HTMLSpanElement;
  const prevBaths = document.getElementById('prev-baths') as HTMLSpanElement;
  const prevLocation = document.getElementById('prev-location') as HTMLSpanElement;
  const prevDpe = document.getElementById('prev-dpe') as HTMLSpanElement;
  const prevTax = document.getElementById('prev-tax') as HTMLSpanElement;
  const prevDesc = document.getElementById('prev-description') as HTMLDivElement;

  let cachedParsedPayload: any = null;

  // Tabs
  const tabBtnApiKey = document.getElementById('tab-btn-apikey') as HTMLButtonElement;
  const tabBtnUserPass = document.getElementById('tab-btn-userpass') as HTMLButtonElement;
  const tabPaneApiKey = document.getElementById('tab-pane-apikey') as HTMLDivElement;
  const tabPaneUserPass = document.getElementById('tab-pane-userpass') as HTMLDivElement;

  tabBtnApiKey.addEventListener('click', () => switchTab('apikey', true));
  tabBtnUserPass.addEventListener('click', () => switchTab('userpass', true));

  function switchTab(tab: 'apikey' | 'userpass', persist = false) {
    if (tab === 'apikey') {
      tabBtnApiKey.classList.add('active');
      tabBtnUserPass.classList.remove('active');
      tabPaneApiKey.style.display = 'block';
      tabPaneUserPass.style.display = 'none';
    } else {
      tabBtnUserPass.classList.add('active');
      tabBtnApiKey.classList.remove('active');
      tabPaneUserPass.style.display = 'block';
      tabPaneApiKey.style.display = 'none';
    }
    if (persist) {
      saveStoredConfig({ activeTab: tab });
    }
  }

  // Load existing config
  const config = await getStoredConfig();
  if (config.serverUrl) serverUrlInput.value = config.serverUrl;
  if (config.apiKey) apiKeyInput.value = config.apiKey;
  if (config.username) usernameInput.value = config.username;

  // Checkboxes state
  openTabCheckbox.checked = config.openTabAfterImport !== false;
  openTabCheckbox.addEventListener('change', () => {
    saveStoredConfig({ openTabAfterImport: openTabCheckbox.checked });
  });

  usePreparsedCheckbox.checked = config.usePreparsedData !== false;
  usePreparsedCheckbox.addEventListener('change', () => {
    saveStoredConfig({ usePreparsedData: usePreparsedCheckbox.checked });
  });

  // Restore active tab
  if (config.activeTab) {
    switchTab(config.activeTab);
  } else if (config.apiKey) {
    switchTab('apikey');
  } else {
    switchTab('userpass');
  }

  // Live auto-save on typing for all configuration fields
  serverUrlInput.addEventListener('input', () => {
    saveStoredConfig({ serverUrl: serverUrlInput.value.trim() });
  });

  apiKeyInput.addEventListener('input', () => {
    saveStoredConfig({ apiKey: apiKeyInput.value.trim() });
  });

  usernameInput.addEventListener('input', () => {
    saveStoredConfig({ username: usernameInput.value.trim() });
  });

  // Automatically test connection and check Cloudflare on popup opening
  if (config.serverUrl) {
    checkConnection(config.serverUrl, config.apiKey || '');
  }

  // Check if current tab is a listing already saved in Immo-Boussole
  const alreadySavedCard = document.getElementById('already-saved-card') as HTMLDivElement;
  const btnOpenExistingTab = document.getElementById('btn-open-existing-tab') as HTMLButtonElement;

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url) {
      const tabUrl = tabs[0].url;
      if (isListingUrl(tabUrl)) {
        const check = await browser.runtime.sendMessage({
          type: 'CHECK_LISTING_EXISTS',
          url: tabUrl
        });
        if (check && check.exists && check.immoBoussoleUrl) {
          if (alreadySavedCard) alreadySavedCard.style.display = 'flex';
          if (btnOpenExistingTab) {
            btnOpenExistingTab.onclick = () => {
              browser.tabs.create({ url: check.immoBoussoleUrl, active: true });
            };
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  // Save API Key config explicitly
  apikeyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverUrl = serverUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!serverUrl || !apiKey) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = t('missingCredentials');
      configCard.classList.remove('collapsed');
      return;
    }

    await saveStoredConfig({ serverUrl, apiKey, activeTab: 'apikey' });
    statusMsg.className = 'status-msg success';
    statusMsg.textContent = t('configSaved');
    checkConnection(serverUrl, apiKey);
  });

  // Login with Username and Password
  userpassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverUrl = serverUrlInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    // Immediately persist serverUrl and username before network call
    await saveStoredConfig({ serverUrl, username, activeTab: 'userpass' });

    if (!serverUrl || !username || !password) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = t('missingLoginFields');
      configCard.classList.remove('collapsed');
      return;
    }

    statusMsg.className = 'status-msg';
    statusMsg.textContent = t('sending');

    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const resp = await fetch(`${cleanUrl}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const bodyText = await resp.text();

      // Check Cloudflare / WAF
      if (isCloudflareResponse(resp, bodyText)) {
        handleCloudflareChallenge(cleanUrl);
        return;
      }

      if (resp.status === 404) {
        statusMsg.className = 'status-msg error';
        statusMsg.textContent = t('loginEndpointNotFound');
        configCard.classList.remove('collapsed');
        return;
      }

      let data: any = null;
      try {
        data = JSON.parse(bodyText);
      } catch {
        if (bodyText.includes('<html') || bodyText.includes('<!DOCTYPE')) {
          statusMsg.className = 'status-msg error';
          statusMsg.textContent = 'Le serveur a renvoyé une page HTML. Vérifiez l\'URL ou la protection d\'accès de votre instance.';
        } else {
          statusMsg.className = 'status-msg error';
          statusMsg.textContent = `Erreur (${resp.status}): Réponse invalide du serveur.`;
        }
        configCard.classList.remove('collapsed');
        return;
      }

      if (resp.ok && data && data.api_key) {
        const apiKey = data.api_key;
        apiKeyInput.value = apiKey;

        await saveStoredConfig({ serverUrl: cleanUrl, apiKey, username, activeTab: 'apikey' });
        statusMsg.className = 'status-msg success';
        statusMsg.textContent = t('loginSuccess');
        hideCloudflareBanner();
        badge.className = 'badge badge-connected';
        badge.textContent = t('statusConnected');
        configCard.classList.add('collapsed');
        switchTab('apikey', true);
      } else {
        statusMsg.className = 'status-msg error';
        statusMsg.textContent = (data && data.detail) ? data.detail : t('loginFailed');
        configCard.classList.remove('collapsed');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        handleCloudflareChallenge(serverUrl);
      } else {
        statusMsg.className = 'status-msg error';
        statusMsg.textContent = `${t('statusOffline')}: ${err.message}`;
        configCard.classList.remove('collapsed');
      }
    }
  });

  // Test connection
  btnTest.addEventListener('click', async () => {
    const serverUrl = serverUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (!serverUrl || !apiKey) {
      statusMsg.className = 'status-msg error';
      statusMsg.textContent = t('missingCredentials');
      configCard.classList.remove('collapsed');
      return;
    }
    await checkConnection(serverUrl, apiKey, true);
  });

  // Retry Cloudflare
  btnRetryCf.addEventListener('click', async () => {
    const serverUrl = serverUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (serverUrl && apiKey) {
      await checkConnection(serverUrl, apiKey, true);
    } else if (serverUrl) {
      switchTab('userpass', true);
      statusMsg.textContent = 'Veuillez vous reconnecter.';
      configCard.classList.remove('collapsed');
    }
  });

  function renderParsedPreview(payload: any) {
    if (!payload) return;
    cachedParsedPayload = payload;

    // Photos
    previewThumbnails.innerHTML = '';
    if (payload.photos && Array.isArray(payload.photos) && payload.photos.length > 0) {
      previewPhotosBadge.style.display = 'inline-block';
      previewPhotosBadge.textContent = `📸 ${payload.photos.length}`;
      payload.photos.slice(0, 8).forEach((src: string) => {
        const img = document.createElement('img');
        img.className = 'preview-thumb';
        img.src = src;
        img.alt = 'Photo';
        img.onerror = () => img.remove();
        previewThumbnails.appendChild(img);
      });
      previewThumbnails.style.display = 'flex';
    } else {
      previewPhotosBadge.style.display = 'none';
      previewThumbnails.style.display = 'none';
    }

    // Plans (Floorplans)
    if (payload.floorplans && Array.isArray(payload.floorplans) && payload.floorplans.length > 0) {
      previewPlansBadge.style.display = 'inline-block';
      previewPlansBadge.textContent = `📐 Plans (${payload.floorplans.length})`;
    } else {
      previewPlansBadge.style.display = 'none';
    }

    // Title
    prevTitle.textContent = payload.title || '-';

    // Price
    if (typeof payload.price === 'number' && payload.price > 0) {
      try {
        prevPrice.textContent = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(payload.price);
      } catch (e) {
        prevPrice.textContent = `${payload.price} €`;
      }
    } else {
      prevPrice.textContent = '-';
    }

    // Surfaces
    prevArea.textContent = payload.area ? `${payload.area} m²` : '-';
    prevLand.textContent = payload.land_area ? `${payload.land_area} m²` : '-';

    // Rooms & Bedrooms
    if (payload.rooms || payload.bedrooms) {
      const parts: string[] = [];
      if (payload.rooms) parts.push(`${payload.rooms} p.`);
      if (payload.bedrooms) parts.push(`${payload.bedrooms} ch.`);
      prevRooms.textContent = parts.join(' / ') || '-';
    } else {
      prevRooms.textContent = '-';
    }

    // Bathrooms
    prevBaths.textContent = payload.bathroom_count ? `${payload.bathroom_count}` : '-';

    // Location
    prevLocation.textContent = payload.location || payload.city || '-';

    // DPE / GES
    const dpeParts: string[] = [];
    if (payload.dpe_rating) dpeParts.push(`DPE: ${payload.dpe_rating}`);
    if (payload.ges_rating) dpeParts.push(`GES: ${payload.ges_rating}`);
    prevDpe.textContent = dpeParts.join(' / ') || '-';

    // Taxes
    prevTax.textContent = payload.land_tax ? `${payload.land_tax} €` : '-';

    // Description
    prevDesc.textContent = payload.description || '-';

    parsedPreviewCard.style.display = 'block';
  }

  // Parse & Preview listing handler
  btnParse.addEventListener('click', async () => {
    const originalText = btnParse.innerHTML;
    btnParse.innerHTML = t('btnParsing');
    btnParse.disabled = true;

    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url) {
        let extracted: any = null;
        if (tabs[0].id) {
          try {
            extracted = await Promise.race([
              browser.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_LISTING' }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
            ]);
          } catch (e) {
            // ignore
          }
        }

        if (extracted && typeof extracted === 'object' && (extracted.title || extracted.price || extracted.area || extracted.photos)) {
          renderParsedPreview(extracted);
          addStatusMsg.className = 'status-msg success';
          addStatusMsg.textContent = t('preparsedTitle');
        } else {
          renderParsedPreview({ url: tabs[0].url, title: tabs[0].title || 'Page active' });
          addStatusMsg.className = 'status-msg';
          addStatusMsg.textContent = t('noDataDetected');
        }
      } else {
        addStatusMsg.className = 'status-msg error';
        addStatusMsg.textContent = t('activeTabError');
      }
    } catch (err: any) {
      addStatusMsg.className = 'status-msg error';
      addStatusMsg.textContent = err.message || t('addError');
    } finally {
      btnParse.innerHTML = originalText;
      btnParse.disabled = false;
    }
  });

  // Add current tab with rich DOM pre-extraction
  btnAddCurrent.addEventListener('click', async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url) {
        let payload: any = { url: tabs[0].url };

        // If user wants pre-parsed data, attempt extraction or use cached
        if (usePreparsedCheckbox.checked) {
          if (cachedParsedPayload && cachedParsedPayload.url === tabs[0].url) {
            payload = cachedParsedPayload;
          } else if (tabs[0].id) {
            try {
              const extracted = await Promise.race([
                browser.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_LISTING' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
              ]);
              if (extracted && typeof extracted === 'object' && extracted.url) {
                payload = extracted;
                renderParsedPreview(payload);
              }
            } catch (e) {
              // fallback to basic URL payload
            }
          }
        } else {
          // Explicitly send only URL if unchecked
          payload = { url: tabs[0].url };
        }

        await sendPayloadToBackend(payload);
      } else {
        addStatusMsg.className = 'status-msg error';
        addStatusMsg.textContent = t('activeTabError');
      }
    } catch (err: any) {
      addStatusMsg.className = 'status-msg error';
      addStatusMsg.textContent = err.message || t('addError');
    }
  });

  // Add manual URL
  btnAddManual.addEventListener('click', async () => {
    const url = manualUrlInput.value.trim();
    if (!url) {
      addStatusMsg.className = 'status-msg error';
      addStatusMsg.textContent = t('invalidUrl');
      return;
    }
    const payload: any = { url };
    if (usePreparsedCheckbox.checked && cachedParsedPayload && cachedParsedPayload.url === url) {
      await sendPayloadToBackend(cachedParsedPayload);
    } else {
      await sendPayloadToBackend(payload);
    }
  });

  function isCloudflareResponse(resp: Response, text: string): boolean {
    if (resp.redirected && (resp.url.includes('cloudflareaccess.com') || resp.url.includes('cloudflare.com'))) {
      return true;
    }
    const lower = text.toLowerCase();
    if (
      lower.includes('cloudflareaccess.com') ||
      lower.includes('cloudflare-access') ||
      lower.includes('cf-access') ||
      lower.includes('cf-chl') ||
      lower.includes('challenge-platform') ||
      lower.includes('just a moment...') ||
      lower.includes('ray id') ||
      lower.includes('<center>cloudflare</center>')
    ) {
      return true;
    }
    if (resp.status === 403 || resp.status === 503 || resp.status === 429) {
      return true;
    }
    return false;
  }

  function handleCloudflareChallenge(serverUrl: string) {
    configCard.classList.remove('collapsed');
    cloudflareBanner.style.display = 'flex';
    badge.className = 'badge badge-cloudflare';
    badge.textContent = t('statusCloudflare');
    statusMsg.className = 'status-msg error';
    statusMsg.textContent = t('cloudflareDetected');

    // Automatically open a new tab pointing to the server instance
    try {
      browser.tabs.create({ url: serverUrl, active: true });
    } catch (e) {
      console.warn('Could not open Cloudflare tab:', e);
    }
  }

  function hideCloudflareBanner() {
    cloudflareBanner.style.display = 'none';
  }

  async function checkConnection(serverUrl: string, apiKey: string, showMsg = false) {
    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const resp = await fetch(`${cleanUrl}/api/v1/listings/?limit=1`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const bodyText = await resp.text();

      if (isCloudflareResponse(resp, bodyText)) {
        handleCloudflareChallenge(cleanUrl);
        return;
      }

      if (resp.ok) {
        hideCloudflareBanner();
        badge.className = 'badge badge-connected';
        badge.textContent = t('statusConnected');
        configCard.classList.add('collapsed');
        if (showMsg) {
          statusMsg.className = 'status-msg success';
          statusMsg.textContent = t('connectionSuccess');
        }
      } else {
        hideCloudflareBanner();
        badge.className = 'badge badge-disconnected';
        badge.textContent = t('statusAuthError');
        configCard.classList.remove('collapsed');
        if (showMsg) {
          statusMsg.className = 'status-msg error';
          statusMsg.textContent = `Error (${resp.status}): ${t('missingCredentials')}`;
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        handleCloudflareChallenge(serverUrl);
      } else {
        hideCloudflareBanner();
        badge.className = 'badge badge-disconnected';
        badge.textContent = t('statusOffline');
        configCard.classList.remove('collapsed');
        if (showMsg) {
          statusMsg.className = 'status-msg error';
          statusMsg.textContent = `${t('statusOffline')}: ${err.message}`;
        }
      }
    }
  }

  async function sendPayloadToBackend(payload: any) {
    addStatusMsg.className = 'status-msg';
    addStatusMsg.textContent = t('sending');
    btnViewListing.style.display = 'none';

    const cfg = await getStoredConfig();
    if (!cfg.serverUrl || !cfg.apiKey) {
      addStatusMsg.className = 'status-msg error';
      addStatusMsg.textContent = t('notConfigured');
      configCard.classList.remove('collapsed');
      return;
    }

    try {
      const resp = await browser.runtime.sendMessage({
        type: 'ADD_LISTING',
        payload
      });

      if (resp && resp.success) {
        addStatusMsg.className = 'status-msg success';
        addStatusMsg.textContent = resp.message || t('addSuccess');

        const cleanServer = cfg.serverUrl.replace(/\/+$/, '');
        const targetUrl = resp.immoBoussoleUrl || (cleanServer ? `${cleanServer}/` : undefined);
        if (targetUrl) {
          btnViewListing.style.display = 'block';
          btnViewListing.onclick = () => {
            browser.tabs.create({ url: targetUrl, active: true });
          };
        }
      } else {
        addStatusMsg.className = 'status-msg error';
        addStatusMsg.textContent = resp?.message || t('addError');
      }
    } catch (err: any) {
      addStatusMsg.className = 'status-msg error';
      addStatusMsg.textContent = err.message || t('networkError');
    }
  }
});
