import { t } from '../../i18n';
export function isSeloger() {
    return window.location.hostname.includes('seloger.com');
}
export function isSelogerDetailPage() {
    return isSeloger() && (/\/annonce\//.test(window.location.pathname) || /\/annonces\//.test(window.location.pathname));
}
export function extractSelogerDetailPage() {
    const url = window.location.href;
    const titleEl = document.querySelector('h1');
    const title = titleEl ? titleEl.textContent?.trim() : document.title;
    const priceEl = document.querySelector('[data-test="ad-price"]') ||
        document.querySelector('[class*="Price__"]') ||
        document.querySelector('[data-qa="price"]');
    let price;
    if (priceEl && priceEl.textContent) {
        const rawPrice = priceEl.textContent.replace(/[^\d]/g, '');
        if (rawPrice)
            price = parseFloat(rawPrice);
    }
    let area;
    let rooms;
    const textNodes = document.body.innerText || '';
    const areaMatch = textNodes.match(/(\d+([\.,]\d+)?)\s*m²/i);
    if (areaMatch)
        area = parseFloat(areaMatch[1].replace(',', '.'));
    const roomsMatch = textNodes.match(/(\d+)\s*pièce/i);
    if (roomsMatch)
        rooms = parseInt(roomsMatch[1], 10);
    const photos = [];
    const imgEls = document.querySelectorAll('img[src*="seloger.com"], img[src*="slstatic.com"], img[src*="poliris.net"]');
    imgEls.forEach(img => {
        const src = img.src;
        if (src && !photos.includes(src) && !src.includes('logo') && !src.includes('avatar') && !src.includes('icon')) {
            photos.push(src);
        }
    });
    return {
        url,
        title: title || "Annonce SeLoger",
        price,
        area,
        rooms,
        photos: photos.slice(0, 10),
        source: 'seloger'
    };
}
export function injectSelogerButtons(onAdd) {
    if (!isSelogerDetailPage())
        return;
    if (document.querySelector('.immo-boussole-detail-btn'))
        return;
    const anchor = document.querySelector('h1') ||
        document.querySelector('[data-test="ad-price"]') ||
        document.querySelector('[class*="Price__"]') ||
        document.querySelector('main header') ||
        document.querySelector('main');
    if (anchor) {
        const wrapper = document.createElement('div');
        wrapper.className = 'immo-boussole-detail-wrapper';
        const btn = document.createElement('button');
        btn.className = 'immo-boussole-btn immo-boussole-detail-btn';
        btn.innerHTML = `🧭 ${t('btnAddListing')}`;
        btn.title = t('btnAddListing');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const payload = extractSelogerDetailPage();
            onAdd(payload, btn);
        });
        wrapper.appendChild(btn);
        if (anchor.tagName === 'H1' || anchor.getAttribute('data-test') === 'ad-price' || anchor.className.includes('Price__')) {
            anchor.insertAdjacentElement('afterend', wrapper);
        }
        else {
            anchor.insertAdjacentElement('afterbegin', wrapper);
        }
    }
}
