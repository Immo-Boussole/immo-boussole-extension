import { ExternalListingPayload } from '../../types';
import { t } from '../../i18n';

export function isSeloger(): boolean {
  return window.location.hostname.includes('seloger.com');
}

export function isSelogerDetailPage(): boolean {
  return isSeloger() && (/\/annonce\//.test(window.location.pathname) || /\/annonces\//.test(window.location.pathname));
}

export function extractSelogerDetailPage(): ExternalListingPayload {
  const url = window.location.href;
  const titleEl = document.querySelector('h1');
  const title = titleEl ? titleEl.textContent?.trim() : document.title;

  const priceEl = document.querySelector('[data-test="ad-price"]') || document.querySelector('[class*="Price__"]');
  let price: number | undefined;
  if (priceEl && priceEl.textContent) {
    const rawPrice = priceEl.textContent.replace(/[^\d]/g, '');
    if (rawPrice) price = parseFloat(rawPrice);
  }

  let area: number | undefined;
  let rooms: number | undefined;

  const textNodes = document.body.innerText;
  const areaMatch = textNodes.match(/(\d+([\.,]\d+)?)\s*m²/i);
  if (areaMatch) area = parseFloat(areaMatch[1].replace(',', '.'));

  const roomsMatch = textNodes.match(/(\d+)\s*pièce/i);
  if (roomsMatch) rooms = parseInt(roomsMatch[1], 10);

  const photos: string[] = [];
  const imgEls = document.querySelectorAll('img[src*="seloger.com"], img[src*="slstatic.com"]');
  imgEls.forEach(img => {
    const src = (img as HTMLImageElement).src;
    if (src && !photos.includes(src) && !src.includes('logo') && !src.includes('avatar')) {
      photos.push(src);
    }
  });

  return {
    url,
    title,
    price,
    area,
    rooms,
    photos: photos.slice(0, 10),
    source: 'seloger'
  };
}

export function injectSelogerButtons(onAdd: (payload: ExternalListingPayload, btn: HTMLButtonElement) => void) {
  if (isSelogerDetailPage()) {
    const h1 = document.querySelector('h1');
    const headerContainer = h1?.parentElement;
    if (headerContainer && !headerContainer.querySelector('.immo-boussole-detail-btn')) {
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
      h1.insertAdjacentElement('afterend', wrapper);
    }
  }
}
