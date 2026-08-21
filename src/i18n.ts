import browser from 'webextension-polyfill';

// English fallback dictionary in case browser.i18n is not ready or key missing
import enMessages from '../_locales/en/messages.json';

const fallbackDict: Record<string, string> = {};
for (const [k, v] of Object.entries(enMessages)) {
  fallbackDict[k] = (v as any).message;
}

export function t(key: string, substitutions?: string | string[]): string {
  try {
    const msg = browser.i18n.getMessage(key, substitutions);
    if (msg) return msg;
  } catch (e) {
    // ignore
  }
  return fallbackDict[key] || key;
}

export function localizeDocument(): void {
  // Translate text content
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Translate placeholders
  const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderElements.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && 'placeholder' in el) {
      (el as HTMLInputElement).placeholder = t(key);
    }
  });
}
