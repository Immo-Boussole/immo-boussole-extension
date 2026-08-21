import browser from 'webextension-polyfill';
import { getStoredConfig, saveStoredConfig } from '../storage';
import { t, localizeDocument } from '../i18n';
document.addEventListener('DOMContentLoaded', async () => {
    // Localize static UI elements
    localizeDocument();
    const serverUrlInput = document.getElementById('server-url');
    const apiKeyInput = document.getElementById('api-key');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const apikeyForm = document.getElementById('apikey-form');
    const userpassForm = document.getElementById('userpass-form');
    const btnTest = document.getElementById('btn-test');
    const btnAddCurrent = document.getElementById('btn-add-current');
    const btnAddManual = document.getElementById('btn-add-manual');
    const manualUrlInput = document.getElementById('manual-url');
    const statusMsg = document.getElementById('status-message');
    const addStatusMsg = document.getElementById('add-status-message');
    const badge = document.getElementById('connection-badge');
    const cloudflareBanner = document.getElementById('cloudflare-banner');
    const btnRetryCf = document.getElementById('btn-retry-cf');
    // Tabs
    const tabBtnApiKey = document.getElementById('tab-btn-apikey');
    const tabBtnUserPass = document.getElementById('tab-btn-userpass');
    const tabPaneApiKey = document.getElementById('tab-pane-apikey');
    const tabPaneUserPass = document.getElementById('tab-pane-userpass');
    tabBtnApiKey.addEventListener('click', () => switchTab('apikey'));
    tabBtnUserPass.addEventListener('click', () => switchTab('userpass'));
    function switchTab(tab) {
        if (tab === 'apikey') {
            tabBtnApiKey.classList.add('active');
            tabBtnUserPass.classList.remove('active');
            tabPaneApiKey.style.display = 'block';
            tabPaneUserPass.style.display = 'none';
        }
        else {
            tabBtnUserPass.classList.add('active');
            tabBtnApiKey.classList.remove('active');
            tabPaneUserPass.style.display = 'block';
            tabPaneApiKey.style.display = 'none';
        }
    }
    // Load existing config
    const config = await getStoredConfig();
    if (config.serverUrl)
        serverUrlInput.value = config.serverUrl;
    if (config.apiKey)
        apiKeyInput.value = config.apiKey;
    if (config.username)
        usernameInput.value = config.username;
    if (config.apiKey && config.serverUrl) {
        checkConnection(config.serverUrl, config.apiKey);
    }
    // Save API Key config
    apikeyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        if (!serverUrl || !apiKey) {
            statusMsg.className = 'status-msg error';
            statusMsg.textContent = t('missingCredentials');
            return;
        }
        await saveStoredConfig({ serverUrl, apiKey, username: config.username });
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
        if (!serverUrl || !username || !password) {
            statusMsg.className = 'status-msg error';
            statusMsg.textContent = t('missingLoginFields');
            return;
        }
        statusMsg.className = 'status-msg';
        statusMsg.textContent = t('sending');
        try {
            const cleanUrl = serverUrl.replace(/\/+$/, '');
            const resp = await fetch(`${cleanUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const bodyText = await resp.text();
            // Check Cloudflare
            if (isCloudflareResponse(resp.status, bodyText)) {
                handleCloudflareChallenge(cleanUrl);
                return;
            }
            if (resp.ok) {
                const data = JSON.parse(bodyText);
                const apiKey = data.api_key;
                apiKeyInput.value = apiKey;
                await saveStoredConfig({ serverUrl: cleanUrl, apiKey, username });
                statusMsg.className = 'status-msg success';
                statusMsg.textContent = t('loginSuccess');
                hideCloudflareBanner();
                badge.className = 'badge badge-connected';
                badge.textContent = t('statusConnected');
                switchTab('apikey');
            }
            else {
                statusMsg.className = 'status-msg error';
                statusMsg.textContent = t('loginFailed');
            }
        }
        catch (err) {
            // Check if network error is related to Cloudflare challenge
            if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
                handleCloudflareChallenge(serverUrl);
            }
            else {
                statusMsg.className = 'status-msg error';
                statusMsg.textContent = `${t('statusOffline')}: ${err.message}`;
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
        }
        else if (serverUrl) {
            switchTab('userpass');
            statusMsg.textContent = 'Veuillez vous reconnecter.';
        }
    });
    // Add current tab
    btnAddCurrent.addEventListener('click', async () => {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0] && tabs[0].url) {
                await sendUrlToBackend(tabs[0].url);
            }
            else {
                addStatusMsg.className = 'status-msg error';
                addStatusMsg.textContent = t('activeTabError');
            }
        }
        catch (err) {
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
        await sendUrlToBackend(url);
    });
    function isCloudflareResponse(status, text) {
        if (status === 403 || status === 503 || status === 429) {
            const lower = text.toLowerCase();
            if (lower.includes('cloudflare') ||
                lower.includes('cf-chl') ||
                lower.includes('challenge-platform') ||
                lower.includes('just a moment...') ||
                lower.includes('ray id')) {
                return true;
            }
        }
        return false;
    }
    function handleCloudflareChallenge(serverUrl) {
        cloudflareBanner.style.display = 'flex';
        badge.className = 'badge badge-cloudflare';
        badge.textContent = t('statusCloudflare');
        statusMsg.className = 'status-msg error';
        statusMsg.textContent = t('cloudflareDetected');
        // Automatically open a new tab pointing to the server instance
        try {
            browser.tabs.create({ url: serverUrl });
        }
        catch (e) {
            console.warn('Could not open Cloudflare tab:', e);
        }
    }
    function hideCloudflareBanner() {
        cloudflareBanner.style.display = 'none';
    }
    async function checkConnection(serverUrl, apiKey, showMsg = false) {
        try {
            const cleanUrl = serverUrl.replace(/\/+$/, '');
            const resp = await fetch(`${cleanUrl}/api/v1/listings/?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            const bodyText = await resp.text();
            if (isCloudflareResponse(resp.status, bodyText)) {
                handleCloudflareChallenge(cleanUrl);
                return;
            }
            if (resp.ok) {
                hideCloudflareBanner();
                badge.className = 'badge badge-connected';
                badge.textContent = t('statusConnected');
                if (showMsg) {
                    statusMsg.className = 'status-msg success';
                    statusMsg.textContent = t('connectionSuccess');
                }
            }
            else {
                hideCloudflareBanner();
                badge.className = 'badge badge-disconnected';
                badge.textContent = t('statusAuthError');
                if (showMsg) {
                    statusMsg.className = 'status-msg error';
                    statusMsg.textContent = `Error (${resp.status}): ${t('missingCredentials')}`;
                }
            }
        }
        catch (err) {
            if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
                handleCloudflareChallenge(serverUrl);
            }
            else {
                hideCloudflareBanner();
                badge.className = 'badge badge-disconnected';
                badge.textContent = t('statusOffline');
                if (showMsg) {
                    statusMsg.className = 'status-msg error';
                    statusMsg.textContent = `${t('statusOffline')}: ${err.message}`;
                }
            }
        }
    }
    async function sendUrlToBackend(url) {
        addStatusMsg.className = 'status-msg';
        addStatusMsg.textContent = t('sending');
        const cfg = await getStoredConfig();
        if (!cfg.serverUrl || !cfg.apiKey) {
            addStatusMsg.className = 'status-msg error';
            addStatusMsg.textContent = t('notConfigured');
            return;
        }
        try {
            const resp = await browser.runtime.sendMessage({
                type: 'ADD_LISTING',
                payload: { url }
            });
            if (resp && resp.success) {
                addStatusMsg.className = 'status-msg success';
                addStatusMsg.textContent = resp.message || t('addSuccess');
            }
            else {
                addStatusMsg.className = 'status-msg error';
                addStatusMsg.textContent = resp?.message || t('addError');
            }
        }
        catch (err) {
            addStatusMsg.className = 'status-msg error';
            addStatusMsg.textContent = err.message || t('networkError');
        }
    }
});
