import browser from 'webextension-polyfill';
// English fallback dictionary in case browser.i18n is not ready or key missing
import enMessages from '../_locales/en/messages.json';
const fallbackDict = {};
for (const [k, v] of Object.entries(enMessages)) {
    fallbackDict[k] = v.message;
}
export function t(key, substitutions) {
    try {
        const msg = browser.i18n.getMessage(key, substitutions);
        if (msg)
            return msg;
    }
    catch (e) {
        // ignore
    }
    return fallbackDict[key] || key;
}
export function localizeDocument() {
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
            el.placeholder = t(key);
        }
    });
}
