import browser from 'webextension-polyfill';
import { t } from '../i18n';
import { isLeboncoin, injectLeboncoinButtons } from './scrapers/leboncoin';
import { isFigaro, injectFigaroButtons } from './scrapers/figaro';
import { isSeloger, injectSelogerButtons } from './scrapers/seloger';
function showToastNotification(message, isSuccess) {
    const existing = document.getElementById('immo-boussole-toast-el');
    if (existing)
        existing.remove();
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
async function sendListingToExtension(payload, btn) {
    const originalText = btn.innerHTML;
    btn.className = btn.className + ' loading';
    btn.disabled = true;
    btn.innerHTML = t('btnSending');
    try {
        const response = await browser.runtime.sendMessage({
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
        }
        else {
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
    }
    catch (err) {
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
    if (!href.includes('/ad/') && !href.includes('/annonces/'))
        return;
    try {
        const check = await browser.runtime.sendMessage({
            type: 'CHECK_LISTING_EXISTS',
            url: href
        });
        if (check && check.exists && check.immoBoussoleUrl) {
            const detailBtn = document.querySelector('.immo-boussole-detail-wrapper .immo-boussole-btn');
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
    catch (e) {
        // ignore
    }
}
function runInjections() {
    if (isLeboncoin()) {
        injectLeboncoinButtons(sendListingToExtension);
    }
    else if (isFigaro()) {
        injectFigaroButtons(sendListingToExtension);
    }
    else if (isSeloger()) {
        injectSelogerButtons(sendListingToExtension);
    }
    checkCurrentPageListing();
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
