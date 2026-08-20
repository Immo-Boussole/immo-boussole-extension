import browser from 'webextension-polyfill';
const CONFIG_KEY = 'immo_boussole_config';
export async function getStoredConfig() {
    const data = await browser.storage.local.get(CONFIG_KEY);
    const cfg = data[CONFIG_KEY];
    return cfg || { serverUrl: 'http://localhost:8000', apiKey: '' };
}
export async function saveStoredConfig(config) {
    // Ensure trailing slash is removed from serverUrl
    const cleanConfig = {
        ...config,
        serverUrl: config.serverUrl.replace(/\/+$/, '')
    };
    await browser.storage.local.set({ [CONFIG_KEY]: cleanConfig });
}
