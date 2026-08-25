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
  const prevTitle = document.getElementById('prev-title') as HTMLInputElement;
  const prevPrice = document.getElementById('prev-price') as HTMLInputElement;
  const prevArea = document.getElementById('prev-area') as HTMLInputElement;
  const prevLand = document.getElementById('prev-land') as HTMLInputElement;
  const prevRooms = document.getElementById('prev-rooms') as HTMLInputElement;
  const prevBedrooms = document.getElementById('prev-bedrooms') as HTMLInputElement;
  const prevBaths = document.getElementById('prev-baths') as HTMLInputElement;
  const prevLocation = document.getElementById('prev-location') as HTMLInputElement;
  const prevDpe = document.getElementById('prev-dpe') as HTMLSelectElement;
  const prevGes = document.getElementById('prev-ges') as HTMLSelectElement;
  const prevTax = document.getElementById('prev-tax') as HTMLInputElement;
  const prevDesc = document.getElementById('prev-description') as HTMLTextAreaElement;

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

  // Detached Pop-out window button
  const btnPopout = document.getElementById('btn-popout') as HTMLButtonElement;
  if (btnPopout) {
    btnPopout.addEventListener('click', async () => {
      try {
        const popupUrl = browser.runtime.getURL('src/popup/popup.html');
        await browser.windows.create({
          url: popupUrl,
          type: 'popup',
          width: 400,
          height: 650
        });
        window.close();
      } catch (e) {
        console.warn('Failed to open detached window:', e);
      }
    });
  }

  async function getActiveWebTab(): Promise<browser.Tabs.Tab | null> {
    try {
      const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs[0] && tabs[0].url && !tabs[0].url.startsWith('chrome-extension://') && !tabs[0].url.startsWith('moz-extension://')) {
        return tabs[0];
      }
      const allTabs = await browser.tabs.query({ active: true });
      const valid = allTabs.find((t) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('moz-extension://'));
      return valid || tabs[0] || null;
    } catch {
      return null;
    }
  }

  // Load existing config
  const config = await getStoredConfig();
  if (config.serverUrl) serverUrlInput.value = config.serverUrl;
  if (config.apiKey) apiKeyInput.value = config.apiKey;
  if (config.username) usernameInput.value = config.username;
  if (config.password) passwordInput.value = config.password;

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

  passwordInput.addEventListener('input', () => {
    saveStoredConfig({ password: passwordInput.value });
  });

  // Automatically test connection and check Cloudflare on popup opening
  if (config.serverUrl) {
    checkConnection(config.serverUrl, config.apiKey || '');
  }

  // Check if current tab is a listing already saved in Immo-Boussole
  const alreadySavedCard = document.getElementById('already-saved-card') as HTMLDivElement;
  const btnOpenExistingTab = document.getElementById('btn-open-existing-tab') as HTMLButtonElement;

  try {
    const tab = await getActiveWebTab();
    if (tab && tab.url) {
      const tabUrl = tab.url;
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
          const btnUpdateExistingTab = document.getElementById('btn-update-existing-tab') as HTMLButtonElement;
          if (btnUpdateExistingTab) {
            btnUpdateExistingTab.onclick = async () => {
              const originalText = btnUpdateExistingTab.innerHTML;
              btnUpdateExistingTab.innerHTML = t('btnUpdating');
              btnUpdateExistingTab.disabled = true;
              try {
                let payload: any = { url: tabUrl };
                if (tab.id) {
                  try {
                    const extracted = await Promise.race([
                      browser.tabs.sendMessage(tab.id, { type: 'EXTRACT_LISTING' }),
                      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
                    ]);
                    if (extracted && typeof extracted === 'object' && extracted.url) {
                      payload = extracted;
                    }
                  } catch (e) {
                    // fallback
                  }
                }
                if (parsedPreviewCard && parsedPreviewCard.style.display !== 'none') {
                  payload = collectEditedPayload(payload);
                }
                await sendPayloadToBackend(payload);
              } catch (err: any) {
                addStatusMsg.className = 'status-msg error';
                addStatusMsg.textContent = err.message || t('addError');
              } finally {
                btnUpdateExistingTab.innerHTML = originalText;
                btnUpdateExistingTab.disabled = false;
              }
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

    // Immediately persist serverUrl, username, and password before network call
    await saveStoredConfig({ serverUrl, username, password, activeTab: 'userpass' });

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

        await saveStoredConfig({ serverUrl: cleanUrl, apiKey, username, password, activeTab: 'apikey' });
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
    if (cfCountdownTimer) {
      clearInterval(cfCountdownTimer);
      cfCountdownTimer = null;
    }
    const cfTextEl = document.getElementById('cf-text');
    if (cfTextEl) {
      cfTextEl.textContent = t('cloudflareDetected');
    }
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

  function collectEditedPayload(basePayload?: any): any {
    const payload = basePayload ? { ...basePayload } : {};

    if (prevTitle && prevTitle.value.trim()) payload.title = prevTitle.value.trim();
    if (prevPrice && prevPrice.value) {
      const p = parseFloat(prevPrice.value);
      if (!isNaN(p)) payload.price = p;
    }
    if (prevArea && prevArea.value) {
      const a = parseFloat(prevArea.value);
      if (!isNaN(a)) payload.area = a;
    }
    if (prevLand && prevLand.value) {
      const l = parseFloat(prevLand.value);
      if (!isNaN(l)) payload.land_area = l;
    }
    if (prevRooms && prevRooms.value) {
      const r = parseInt(prevRooms.value, 10);
      if (!isNaN(r)) payload.rooms = r;
    }
    if (prevBedrooms && prevBedrooms.value) {
      const b = parseInt(prevBedrooms.value, 10);
      if (!isNaN(b)) payload.bedrooms = b;
    }
    if (prevBaths && prevBaths.value) {
      const bt = parseInt(prevBaths.value, 10);
      if (!isNaN(bt)) payload.bathroom_count = bt;
    }
    if (prevLocation && prevLocation.value.trim()) {
      payload.location = prevLocation.value.trim();
    }
    if (prevDpe && prevDpe.value) payload.dpe_rating = prevDpe.value;
    if (prevGes && prevGes.value) payload.ges_rating = prevGes.value;
    if (prevTax && prevTax.value) {
      const tx = parseFloat(prevTax.value);
      if (!isNaN(tx)) payload.land_tax = tx;
    }
    if (prevDesc && prevDesc.value.trim()) {
      payload.description = prevDesc.value.trim();
    }

    return payload;
  }

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

    // Editable Inputs
    if (prevTitle) prevTitle.value = payload.title || '';
    if (prevPrice) prevPrice.value = payload.price !== undefined ? String(payload.price) : '';
    if (prevArea) prevArea.value = payload.area !== undefined ? String(payload.area) : '';
    if (prevLand) prevLand.value = payload.land_area !== undefined ? String(payload.land_area) : '';
    if (prevRooms) prevRooms.value = payload.rooms !== undefined ? String(payload.rooms) : '';
    if (prevBedrooms) prevBedrooms.value = payload.bedrooms !== undefined ? String(payload.bedrooms) : '';
    if (prevBaths) prevBaths.value = payload.bathroom_count !== undefined ? String(payload.bathroom_count) : '';
    if (prevLocation) prevLocation.value = payload.location || payload.city || '';
    if (prevDpe) prevDpe.value = (payload.dpe_rating || '').toUpperCase();
    if (prevGes) prevGes.value = (payload.ges_rating || '').toUpperCase();
    if (prevTax) prevTax.value = payload.land_tax !== undefined ? String(payload.land_tax) : '';
    if (prevDesc) prevDesc.value = payload.description || '';

    parsedPreviewCard.style.display = 'block';
  }

  // Parse & Preview listing handler
  btnParse.addEventListener('click', async () => {
    const originalText = btnParse.innerHTML;
    btnParse.innerHTML = t('btnParsing');
    btnParse.disabled = true;

    try {
      const tab = await getActiveWebTab();
      if (tab && tab.url) {
        let extracted: any = null;
        if (tab.id) {
          try {
            extracted = await Promise.race([
              browser.tabs.sendMessage(tab.id, { type: 'EXTRACT_LISTING' }),
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
          renderParsedPreview({ url: tab.url, title: tab.title || 'Page active' });
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

  // Add current tab with rich DOM pre-extraction & live edits
  btnAddCurrent.addEventListener('click', async () => {
    try {
      const tab = await getActiveWebTab();
      if (tab && tab.url) {
        let payload: any = { url: tab.url };

        // If user wants pre-parsed data, attempt extraction or use cached/edited
        if (usePreparsedCheckbox.checked) {
          if (cachedParsedPayload && cachedParsedPayload.url === tab.url) {
            payload = collectEditedPayload(cachedParsedPayload);
          } else if (tab.id) {
            try {
              const extracted = await Promise.race([
                browser.tabs.sendMessage(tab.id, { type: 'EXTRACT_LISTING' }),
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
          if (parsedPreviewCard.style.display !== 'none') {
            payload = collectEditedPayload(payload);
          }
        } else {
          // Explicitly send only URL if unchecked
          payload = { url: tab.url };
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
    let payload: any = { url };
    if (usePreparsedCheckbox.checked && cachedParsedPayload && cachedParsedPayload.url === url) {
      payload = collectEditedPayload(cachedParsedPayload);
    }
    await sendPayloadToBackend(payload);
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

  let cfCountdownTimer: any = null;

  function handleCloudflareChallenge(serverUrl: string) {
    configCard.classList.remove('collapsed');
    cloudflareBanner.style.display = 'flex';
    badge.className = 'badge badge-cloudflare';
    badge.textContent = t('statusCloudflare');
    statusMsg.className = 'status-msg error';

    const cleanUrl = serverUrl.replace(/\/+$/, '');

    if (cfCountdownTimer) {
      clearInterval(cfCountdownTimer);
      cfCountdownTimer = null;
    }

    let secondsLeft = 5;
    const cfTextEl = document.getElementById('cf-text');
    const updateCfCountdown = () => {
      if (cfTextEl) {
        cfTextEl.textContent = `${t('cloudflareDetected')} (${t('openingTabCountdown', [String(secondsLeft)]) || `Ouverture dans ${secondsLeft}s...`})`;
      }
    };
    updateCfCountdown();

    cfCountdownTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        updateCfCountdown();
      } else {
        clearInterval(cfCountdownTimer);
        cfCountdownTimer = null;
        if (cfTextEl) {
          cfTextEl.textContent = t('cloudflareDetected');
        }
        try {
          browser.tabs.create({ url: cleanUrl, active: true });
        } catch (e) {
          console.warn('Could not open Cloudflare tab:', e);
        }
      }
    }, 1000);
  }

  function hideCloudflareBanner() {
    if (cfCountdownTimer) {
      clearInterval(cfCountdownTimer);
      cfCountdownTimer = null;
    }
    cloudflareBanner.style.display = 'none';
    const cfTextEl = document.getElementById('cf-text');
    if (cfTextEl) {
      cfTextEl.textContent = t('cloudflareDetected');
    }
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
