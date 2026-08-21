import browser from 'webextension-polyfill';
import { ExtensionConfig } from './types';

const CONFIG_KEY = 'immo_boussole_config';

export async function getStoredConfig(): Promise<ExtensionConfig> {
  try {
    const data = await browser.storage.local.get(CONFIG_KEY);
    const cfg = data[CONFIG_KEY] as ExtensionConfig | undefined;
    return cfg || { serverUrl: '', apiKey: '', username: '', activeTab: 'userpass' };
  } catch {
    return { serverUrl: '', apiKey: '', username: '', activeTab: 'userpass' };
  }
}

export async function saveStoredConfig(config: Partial<ExtensionConfig>): Promise<void> {
  try {
    const current = await getStoredConfig();
    const serverUrl = config.serverUrl !== undefined ? config.serverUrl : current.serverUrl;
    const updated: ExtensionConfig = {
      ...current,
      ...config,
      serverUrl: serverUrl ? serverUrl.replace(/\/+$/, '') : ''
    };
    await browser.storage.local.set({ [CONFIG_KEY]: updated });
  } catch (e) {
    console.error('Failed to save config to storage:', e);
  }
}
