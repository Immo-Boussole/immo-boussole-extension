import browser from 'webextension-polyfill';
import { ExternalListingPayload } from '../types';
import { isLeboncoin, injectLeboncoinButtons } from './scrapers/leboncoin';
import { isFigaro, injectFigaroButtons } from './scrapers/figaro';

async function sendListingToExtension(payload: ExternalListingPayload, btn: HTMLButtonElement) {
  const originalText = btn.innerHTML;
  btn.className = btn.className + ' loading';
  btn.disabled = true;
  btn.innerHTML = '⏳ Envoi...';

  try {
    const response = await browser.runtime.sendMessage({
      type: 'ADD_LISTING',
      payload
    });

    if (response && response.success) {
      btn.className = btn.className.replace('loading', '') + ' success';
      btn.innerHTML = '✔ Ajouté !';
    } else {
      btn.className = btn.className.replace('loading', '') + ' error';
      btn.innerHTML = '✖ ' + (response?.message || 'Erreur');
      setTimeout(() => {
        btn.className = btn.className.replace('error', '');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 4000);
    }
  } catch (err: any) {
    btn.className = btn.className.replace('loading', '') + ' error';
    btn.innerHTML = '✖ Erreur réseau';
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
