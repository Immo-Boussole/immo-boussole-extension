import { ExternalListingPayload } from '../../types';
import { t } from '../../i18n';

export function isHektor(): boolean {
  const host = window.location.hostname;
  const path = window.location.pathname;
  const search = window.location.search;

  return (
    host.includes('immoreve.fr') ||
    host.includes('hektor') ||
    host.includes('ma-boite-immo.com') ||
    path.includes('/admin/crm/') ||
    search.includes('uri=property') ||
    document.querySelector('hektor-public-property-page') !== null ||
    document.querySelector('.properties-detail-v2, .detail_caracteristiques_v1') !== null
  );
}

export function isHektorDetailPage(): boolean {
  if (!isHektor()) return false;

  const path = window.location.pathname;
  const search = window.location.search;

  return (
    document.querySelector('hektor-public-property-page') !== null ||
    document.querySelector('.properties-detail-v2, .detail_caracteristiques_v1, .detail-dpe-ges') !== null ||
    search.includes('uri=property') ||
    /\/(?:vente|location|annonce|bien|propriete|villa|maison|appartement|terrain|immeuble|fiche)\/.*(?:\d+)/.test(path)
  );
}

export function extractHektorDetailPage(): ExternalListingPayload {
  const url = window.location.href;

  // External ID
  let external_id: string | undefined;
  const idMatch = url.match(/\/(\d+)(?:-[^/?#]+)?(?:[?#]|$)/) || url.match(/id(?:ann)?=(\d+)/);
  if (idMatch) {
    external_id = `hektor_${idMatch[1]}`;
  }

  // Title
  const titleEl =
    document.querySelector('h1') ||
    document.querySelector('hektor-public-property-page h1') ||
    document.querySelector('.properties-detail__title') ||
    document.querySelector('.title-detail');
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  let title = titleEl?.textContent?.trim() || ogTitle || document.title;
  if (title) {
    title = title.replace(/\s*\|\s*Immor[^\s]+.*$/i, '').trim();
  }

  // Price
  const priceEl =
    document.querySelector('.properties-detail__price') ||
    document.querySelector('.finance_content--prix_honoraires_inclus') ||
    document.querySelector('[data-slot="price"]') ||
    document.querySelector('.price') ||
    document.querySelector('.item__price');
  let price: number | undefined;
  const priceText = priceEl?.textContent || document.body.innerText;
  const priceMatch = priceText.match(/([\d\s\u00a0]+)\s*€/);
  if (priceMatch) {
    const raw = priceMatch[1].replace(/[^\d]/g, '');
    if (raw && parseInt(raw, 10) > 1000) {
      price = parseFloat(raw);
    }
  }

  // City, Postal Code & Location
  let city: string | undefined;
  let postal_code: string | undefined;
  const cityEl = document.querySelector('.properties-detail__city, .item__block--city, .detail-city');
  if (cityEl && cityEl.textContent) {
    const cityRaw = cityEl.textContent.trim();
    const mCp = cityRaw.match(/([^\d()]+?)\s*\(\s*(\d{5})\s*\)/);
    if (mCp) {
      city = mCp[1].trim();
      postal_code = mCp[2].trim();
    } else {
      const mCp2 = cityRaw.match(/\b(\d{5})\b/);
      if (mCp2) {
        postal_code = mCp2[1];
        city = cityRaw.replace(postal_code, '').trim().replace(/^[-_\s()]+|[-_\s()]+$/g, '');
      } else {
        city = cityRaw;
      }
    }
  }

  const location = city && postal_code ? `${city} (${postal_code})` : (city || postal_code || undefined);

  // Description
  const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const descEl = document.querySelector('.detail_description, .properties-detail__description, .description, .detail-data-description');
  const description = ogDesc?.trim() || descEl?.textContent?.trim() || undefined;

  // Characteristics & Amenities
  const bodyText = document.body.innerText;
  const caracContainer = document.querySelector('.detail_caracteristiques_v1, .detail_caracteristiques, .caracteristiques');
  const caracText = caracContainer?.textContent || bodyText;

  // Area (habitable)
  let area: number | undefined;
  const areaMatch = caracText.match(/Surface\s*(\d+([\.,]\d+)?)\s*m²/i) || bodyText.match(/(\d+([\.,]\d+)?)\s*m²\s*habitable/i) || caracText.match(/(\d+([\.,]\d+)?)\s*m²/i);
  if (areaMatch) {
    area = parseFloat(areaMatch[1].replace(',', '.'));
  }

  // Land area (terrain)
  let land_area: number | undefined;
  const landMatch = caracText.match(/terrain\s*(\d+([\.,\s]\d+)?)\s*m²/i);
  if (landMatch) {
    land_area = parseFloat(landMatch[1].replace(/\s/g, '').replace(',', '.'));
  }

  // Rooms
  let rooms: number | undefined;
  const roomMatch = bodyText.match(/(\d+)\s*pi[èe]ce(?:\(s\)|s)?/i);
  if (roomMatch) {
    rooms = parseInt(roomMatch[1], 10);
  }

  // Bedrooms
  let bedrooms: number | undefined;
  const bedMatch = caracText.match(/(\d+)\s*chambre(?:\(s\)|s)?/i) || bodyText.match(/(\d+)\s*chambre(?:\(s\)|s)?/i);
  if (bedMatch) {
    bedrooms = parseInt(bedMatch[1], 10);
  }

  // Bathrooms
  let bathroom_count: number | undefined;
  const bathMatch = caracText.match(/(\d+)\s*salle(?:\(s\)|s)?\s*(?:de\s*bain|d['’]eau)/i);
  if (bathMatch) {
    bathroom_count = parseInt(bathMatch[1], 10);
  }

  // Property Type
  let property_type: string | undefined;
  const combinedType = (title || '') + ' ' + caracText;
  if (/maison|villa/i.test(combinedType)) {
    property_type = 'Maison';
  } else if (/appartement/i.test(combinedType)) {
    property_type = 'Appartement';
  } else if (/terrain/i.test(combinedType)) {
    property_type = 'Terrain';
  } else if (/immeuble/i.test(combinedType)) {
    property_type = 'Immeuble';
  }

  // Photos
  const photos: string[] = [];
  const mediaContainer = document.querySelector('.properties-detail-v2__media, .property-detail-v2__slide, .slider__main, .property-slider__list, .modal-swiper-gallery') || document.body;
  const imgEls = mediaContainer.querySelectorAll('img');
  imgEls.forEach((img) => {
    if (img.closest('.item__block, .card-similar, .suggestions, footer')) {
      return;
    }
    const src =
      img.getAttribute('data-splide-lazy') ||
      img.getAttribute('src') ||
      img.getAttribute('data-src') ||
      img.getAttribute('data-lazy') ||
      img.getAttribute('data-path');
    if (
      src &&
      (src.includes('biens') || src.includes('photos') || src.includes('staticlbi.com') || src.includes('photo_')) &&
      !src.includes('dpe.php')
    ) {
      let fullSrc = src.startsWith('http')
        ? src
        : src.startsWith('//')
        ? 'https:' + src
        : window.location.origin + '/' + src.replace(/^\//, '');
      
      // Convert thumbnails to original resolution
      fullSrc = fullSrc.replace(/\/(?:\d+x\w+|thumbnail)\//, '/original/');

      if (!photos.includes(fullSrc)) {
        photos.push(fullSrc);
      }
    }
  });

  return {
    url,
    external_id,
    title,
    price,
    area,
    land_area,
    rooms,
    bedrooms,
    bathroom_count,
    city,
    postal_code,
    location,
    description,
    property_type,
    photos: photos.slice(0, 20),
    source: 'hektor'
  };
}

export function injectHektorButtons(onAdd: (payload: ExternalListingPayload, btn: HTMLButtonElement) => void) {
  if (isHektorDetailPage()) {
    // 1. Check for hektor-public-property-page or standard detail page
    const customElem = document.querySelector('hektor-public-property-page, .properties-detail-v2, .detail_caracteristiques_v1') || document.body;
    if (customElem && !document.querySelector('.immo-boussole-hektor-detail-btn')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'immo-boussole-detail-wrapper immo-boussole-hektor-floating';
      wrapper.style.position = 'fixed';
      wrapper.style.bottom = '24px';
      wrapper.style.right = '24px';
      wrapper.style.zIndex = '999999';
      wrapper.style.boxShadow = '0 4px 14px rgba(0,0,0,0.25)';
      wrapper.style.borderRadius = '9999px';

      const btn = document.createElement('button');
      btn.className = 'immo-boussole-btn immo-boussole-detail-btn immo-boussole-hektor-detail-btn';
      btn.innerHTML = t('btnAddToImmoBoussole');
      btn.style.borderRadius = '9999px';
      btn.style.padding = '12px 20px';
      btn.style.fontSize = '14px';
      btn.style.fontWeight = 'bold';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const payload = extractHektorDetailPage();
        onAdd(payload, btn);
      });

      wrapper.appendChild(btn);
      document.body.appendChild(wrapper);
    }
  }

  // 2. Listing Cards on Search Results
  const cardLinks = document.querySelectorAll('a[href*="/vente/"], a[href*="/location/"], a[href*="/annonce/"], a[href*="/bien/"], a[href*="/propriete/"], a[href*="/villa/"], a[href*="/maison/"], a[href*="/appartement/"]');
  cardLinks.forEach((link) => {
    const card = link.closest('article, .item, .card, [class*="card"], [class*="item"]') as HTMLElement;
    if (card && !card.querySelector('.immo-boussole-card-btn')) {
      const btn = document.createElement('button');
      btn.className = 'immo-boussole-btn immo-boussole-btn-card immo-boussole-card-btn';
      btn.innerHTML = t('btnImmoBoussoleCard');

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const titleEl = card.querySelector('h2, h3, .title, .item__title');
        const priceEl = card.querySelector('.price, .item__price, [class*="price"]');
        let price: number | undefined;
        if (priceEl && priceEl.textContent) {
          const raw = priceEl.textContent.replace(/[^\d]/g, '');
          if (raw) price = parseFloat(raw);
        }

        const payload: ExternalListingPayload = {
          url: (link as HTMLAnchorElement).href,
          title: titleEl?.textContent?.trim() || undefined,
          price,
          source: 'hektor'
        };

        onAdd(payload, btn);
      });

      card.appendChild(btn);
    }
  });
}

