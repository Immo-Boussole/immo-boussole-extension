import browser from 'webextension-polyfill';
import { getStoredConfig, saveStoredConfig } from '../storage';
import { t, localizeDocument } from '../i18n';

document.addEventListener('DOMContentLoaded', async () => {
  // Localize static UI elements
  localizeDocument();

  const serverUrlInput = document.getElementById('server-url') as HTMLInputElement;
  const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  const configForm = document.getElementById('config-form') as HTMLFormElement;
  const btnTest = document.getElementById('btn-test') as HTMLButtonElement;
  const btnAddCurrent = document.getElementById('btn-add-current') as HTMLButtonElement;
  const btnAddManual = document.getElementById('btn-add-manual') as HTMLButtonElement;
  const manualUrlInput = document.getElementById('manual-url') as HTMLInputElement;
  
  const statusMsg = document.getElementById('status-message') as HTMLDivElement;
  const addStatusMsg = document.getElementById('add-status-message') as HTMLDivElement;
  const badge = document.getElementById('connection-badge') as HTMLSpanElement;

  // Load existing config
  const config = await getStoredConfig();
  if (config.serverUrl) serverUrlInput.value = config.serverUrl;
  if (config.apiKey) apiKeyInput.value = config.apiKey;

  if (config.apiKey && config.serverUrl) {
    checkConnection(config.serverUrl, config.apiKey);
  }

  // Save config
  configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const serverUrl = serverUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    await saveStoredConfig({ serverUrl, apiKey });
    statusMsg.className = 'status-msg success';
    statusMsg.textContent = t('configSaved');
    checkConnection(serverUrl, apiKey);
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

  // Add current tab
  btnAddCurrent.addEventListener('click', async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].url) {
        await sendUrlToBackend(tabs[0].url);
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
    await sendUrlToBackend(url);
  });

  async function checkConnection(serverUrl: string, apiKey: string, showMsg = false) {
    try {
      const cleanUrl = serverUrl.replace(/\/+$/, '');
      const resp = await fetch(`${cleanUrl}/api/v1/listings/?limit=1`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (resp.ok) {
        badge.className = 'badge badge-connected';
        badge.textContent = t('statusConnected');
        if (showMsg) {
          statusMsg.className = 'status-msg success';
          statusMsg.textContent = t('connectionSuccess');
        }
      } else {
        badge.className = 'badge badge-disconnected';
        badge.textContent = t('statusAuthError');
        if (showMsg) {
          statusMsg.className = 'status-msg error';
          statusMsg.textContent = `Error (${resp.status}): ${t('missingCredentials')}`;
        }
      }
    } catch (err: any) {
      badge.className = 'badge badge-disconnected';
      badge.textContent = t('statusOffline');
      if (showMsg) {
        statusMsg.className = 'status-msg error';
        statusMsg.textContent = `${t('statusOffline')}: ${err.message}`;
      }
    }
  }

  async function sendUrlToBackend(url: string) {
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
