import browser from 'webextension-polyfill';
import { ExtensionConfig } from './types';

const CONFIG_KEY = 'immo_boussole_config';

export async function getStoredConfig(): Promise<ExtensionConfig> {
  const data = await browser.storage.local.get(CONFIG_KEY);
  const cfg = data[CONFIG_KEY] as ExtensionConfig | undefined;
  return cfg || { serverUrl: 'http://localhost:8000', apiKey: '' };
}

export async function saveStoredConfig(config: ExtensionConfig): Promise<void> {
  // Ensure trailing slash is removed from serverUrl
  const cleanConfig = {
    ...config,
    serverUrl: config.serverUrl.replace(/\/+$/, '')
  };
  await browser.storage.local.set({ [CONFIG_KEY]: cleanConfig });
}
