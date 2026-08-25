import browser from 'webextension-polyfill';
const CONFIG_KEY = 'immo_boussole_config';
export async function getStoredConfig() {
    try {
        const data = await browser.storage.local.get(CONFIG_KEY);
        const cfg = data[CONFIG_KEY];
        return {
            serverUrl: '',
            apiKey: '',
            username: '',
            password: '',
            activeTab: 'userpass',
            openTabAfterImport: true,
            ...cfg
        };
    }
    catch {
        return { serverUrl: '', apiKey: '', username: '', password: '', activeTab: 'userpass', openTabAfterImport: true };
    }
}
export async function saveStoredConfig(config) {
    try {
        const current = await getStoredConfig();
        const serverUrl = config.serverUrl !== undefined ? config.serverUrl : current.serverUrl;
        const updated = {
            ...current,
            ...config,
            serverUrl: serverUrl ? serverUrl.replace(/\/+$/, '') : ''
        };
        await browser.storage.local.set({ [CONFIG_KEY]: updated });
    }
    catch (e) {
        console.error('Failed to save config to storage:', e);
    }
}
