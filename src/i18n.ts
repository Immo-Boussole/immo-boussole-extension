import browser from 'webextension-polyfill';

import enMessages from '../_locales/en/messages.json';
import frMessages from '../_locales/fr/messages.json';

const enDict: Record<string, string> = {};
for (const [k, v] of Object.entries(enMessages)) {
  enDict[k] = (v as any).message;
}

const frDict: Record<string, string> = {};
for (const [k, v] of Object.entries(frMessages)) {
  frDict[k] = (v as any).message;
}

export function t(key: string, substitutions?: string | string[]): string {
  try {
    const msg = browser.i18n.getMessage(key, substitutions);
    if (msg) return msg;
  } catch (e) {
    // ignore
  }

  const isFr = typeof navigator !== 'undefined' && navigator.language && navigator.language.toLowerCase().startsWith('fr');
  if (isFr && frDict[key]) {
    return frDict[key];
  }
  return enDict[key] || frDict[key] || key;
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
