import { ExternalListingPayload } from '../../types';
import { t } from '../../i18n';

export function isFigaro(): boolean {
  return window.location.hostname.includes('lefigaro.fr');
}

export function isFigaroDetailPage(): boolean {
  return isFigaro() && (/\/annonce-/.test(window.location.pathname) || /\/annonces\/annonce-/.test(window.location.pathname));
}

export function extractFigaroDetailPage(): ExternalListingPayload {
  const url = window.location.href;
  const titleEl = document.querySelector('h1') || document.querySelector('.title-detail');
  const title = titleEl ? titleEl.textContent?.trim() : document.title;

  const priceEl = document.querySelector('.price-detail') || document.querySelector('.price') || document.querySelector('[data-price]');
  let price: number | undefined;
  if (priceEl && priceEl.textContent) {
    const rawPrice = priceEl.textContent.replace(/[^\d]/g, '');
    if (rawPrice) price = parseFloat(rawPrice);
  }

  let area: number | undefined;
  let rooms: number | undefined;

  const textContent = document.body.innerText;
  const areaMatch = textContent.match(/(\d+([\.,]\d+)?)\s*m²/i);
  if (areaMatch) area = parseFloat(areaMatch[1].replace(',', '.'));

  const roomMatch = textContent.match(/(\d+)\s*pièce[s]?/i);
  if (roomMatch) rooms = parseInt(roomMatch[1], 10);

  const photos: string[] = [];
  const imgEls = document.querySelectorAll('img[src*="figaro"], img[src*="immo"]');
  imgEls.forEach(img => {
    const src = (img as HTMLImageElement).src;
    if (src && !photos.includes(src)) {
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
    source: 'lefigaro'
  };
}

export function injectFigaroButtons(onAdd: (payload: ExternalListingPayload, btn: HTMLButtonElement) => void) {
  if (isFigaroDetailPage()) {
    const titleHeader = document.querySelector('h1')?.parentElement;
    if (titleHeader && !titleHeader.querySelector('.immo-boussole-detail-btn')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'immo-boussole-detail-wrapper';

      const btn = document.createElement('button');
      btn.className = 'immo-boussole-btn immo-boussole-detail-btn';
      btn.innerHTML = t('btnAddToImmoBoussole');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const payload = extractFigaroDetailPage();
        onAdd(payload, btn);
      });

      wrapper.appendChild(btn);
      titleHeader.appendChild(wrapper);
    }
  }

  // Cards on search list
  const cardElements = document.querySelectorAll('.card-annonce, [class*="annonce-card"], article');
  cardElements.forEach(card => {
    if (card.querySelector('.immo-boussole-card-btn')) return;

    const linkEl = card.querySelector('a[href*="/annonce-"], a[href*="/annonces/"]') as HTMLAnchorElement;
    if (linkEl && linkEl.href) {
      const btn = document.createElement('button');
      btn.className = 'immo-boussole-btn immo-boussole-btn-card immo-boussole-card-btn';
      btn.innerHTML = t('btnImmoBoussoleCard');


      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const titleEl = card.querySelector('h2, h3, .title');
        const priceEl = card.querySelector('.price, [class*="price"]');
        let price: number | undefined;
        if (priceEl && priceEl.textContent) {
          const rawPrice = priceEl.textContent.replace(/[^\d]/g, '');
          if (rawPrice) price = parseFloat(rawPrice);
        }

        const payload: ExternalListingPayload = {
          url: linkEl.href,
          title: titleEl?.textContent?.trim() || undefined,
          price,
          source: 'lefigaro'
        };

        onAdd(payload, btn);
      });

      card.appendChild(btn);
    }
  });
}
