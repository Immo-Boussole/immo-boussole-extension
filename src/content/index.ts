import browser from 'webextension-polyfill';
import { ExternalListingPayload, AddListingResponse, CheckListingResponse, isListingUrl } from '../types';
import { t } from '../i18n';
import { isLeboncoin, injectLeboncoinButtons, extractLeboncoinDetailPage } from './scrapers/leboncoin';
import { isFigaro, injectFigaroButtons, extractFigaroDetailPage } from './scrapers/figaro';
import { isSeloger, injectSelogerButtons, updateSelogerButtonsState, extractSelogerDetailPageAsync } from './scrapers/seloger';

// Listen for direct extraction requests (e.g. from popup "Add Current Tab")
browser.runtime.onMessage.addListener(async (message: any): Promise<any> => {
  if (message.type === 'EXTRACT_LISTING') {
    try {
      if (isSeloger()) {
        return await extractSelogerDetailPageAsync();
      }
      if (isLeboncoin()) {
        return extractLeboncoinDetailPage();
      }
      if (isFigaro()) {
        return extractFigaroDetailPage();
      }
      return { url: window.location.href };
    } catch (e: any) {
      console.warn('[Immo-Boussole] Content script extraction error:', e);
      return { url: window.location.href };
    }
  }
});

function showToastNotification(message: string, isSuccess: boolean) {
  const existing = document.getElementById('immo-boussole-toast-el');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'immo-boussole-toast-el';
  toast.className = `immo-boussole-toast ${isSuccess ? 'success' : 'error'}`;
  toast.innerHTML = `<span>${isSuccess ? '✔' : '✖'}</span> <span>${message}</span>`;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

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
      
      showToastNotification(response.message || t('toastImportSuccess'), true);

      if (response.immoBoussoleUrl) {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(response.immoBoussoleUrl, '_blank');
        };
      }
    } else {
      btn.className = btn.className.replace('loading', '') + ' error';
      const errMsg = response?.message || t('addError');
      btn.innerHTML = `${t('btnError')}: ${errMsg}`;
      showToastNotification(`${t('toastImportError')}: ${errMsg}`, false);
      setTimeout(() => {
        btn.className = btn.className.replace('error', '');
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 4000);
    }
  } catch (err: any) {
    btn.className = btn.className.replace('loading', '') + ' error';
    const errMsg = err.message || t('networkError');
    btn.innerHTML = `${t('btnError')}: ${errMsg}`;
    showToastNotification(`${t('toastImportError')}: ${errMsg}`, false);
    setTimeout(() => {
      btn.className = btn.className.replace('error', '');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 4000);
  }
}

// Check current page listing existence and update button if already saved
async function checkCurrentPageListing() {
  const href = window.location.href;
  if (!isListingUrl(href)) return;

  try {
    const check: CheckListingResponse = await browser.runtime.sendMessage({
      type: 'CHECK_LISTING_EXISTS',
      url: href
    });

    if (check && check.exists && check.immoBoussoleUrl) {
      if (isSeloger()) {
        updateSelogerButtonsState(check.immoBoussoleUrl, sendListingToExtension);
      } else {
        const detailBtn = document.querySelector('.immo-boussole-detail-wrapper .immo-boussole-btn') as HTMLButtonElement;
        if (detailBtn) {
          detailBtn.className = 'immo-boussole-btn success';
          detailBtn.innerHTML = `${t('btnAlreadyInDb')} ↗`;
          detailBtn.title = t('listingAlreadyExists');
          detailBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(check.immoBoussoleUrl, '_blank');
          };
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

function runInjections() {
  if (isLeboncoin()) {
    injectLeboncoinButtons(sendListingToExtension);
  } else if (isFigaro()) {
    injectFigaroButtons(sendListingToExtension);
  } else if (isSeloger()) {
    injectSelogerButtons(sendListingToExtension);
  }
  checkCurrentPageListing();
}

// Initial run
runInjections();

// Observe DOM updates for dynamic infinite scroll / SPA routing with debounce
let observerTimeout: any = null;
const observer = new MutationObserver(() => {
  if (observerTimeout) clearTimeout(observerTimeout);
  observerTimeout = setTimeout(() => {
    runInjections();
  }, 200);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

