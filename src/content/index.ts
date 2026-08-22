import browser from 'webextension-polyfill';
import { ExternalListingPayload, AddListingResponse } from '../types';
import { t } from '../i18n';
import { isLeboncoin, injectLeboncoinButtons } from './scrapers/leboncoin';
import { isFigaro, injectFigaroButtons } from './scrapers/figaro';

async function sendListingToExtension(payload: ExternalListingPayload, btn: HTMLButtonElement) {
  const originalText = btn.innerHTML;
  btn.className = btn.className + ' loading';
  btn.disabled = true;
  btn.innerHTML = t('btnSending');

  try {
    const response: AddListingResponse = await browser.runtime.sendMessage({
      type: 'ADD_LISTING',
      payload
    });

    if (response && response.success) {
      btn.className = btn.className.replace('loading', '') + ' success';
      const label = response.alreadyExists ? t('btnAlreadyInDb') : t('btnViewListing');
      btn.innerHTML = `${label} ↗`;
      btn.disabled = false;
      btn.title = response.message || label;
      
      if (response.immoBoussoleUrl) {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(response.immoBoussoleUrl, '_blank');
        };
      }
    } else {
      btn.className = btn.className.replace('loading', '') + ' error';
      btn.innerHTML = `${t('btnError')}: ${response?.message || t('addError')}`;
      setTimeout(() => {
        btn.className = btn.className.replace('error', '');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 4000);
    }
  } catch (err: any) {
    btn.className = btn.className.replace('loading', '') + ' error';
    btn.innerHTML = `${t('btnError')}: ${t('networkError')}`;
    setTimeout(() => {
      btn.className = btn.className.replace('error', '');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 4000);
  }
}

function runInjections() {
  if (isLeboncoin()) {
    injectLeboncoinButtons(sendListingToExtension);
  } else if (isFigaro()) {
    injectFigaroButtons(sendListingToExtension);
  }
}

// Initial run
runInjections();

// Observe DOM updates for dynamic infinite scroll / SPA routing
const observer = new MutationObserver(() => {
  runInjections();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
