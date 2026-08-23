import { ExternalListingPayload } from '../../types';
import { t } from '../../i18n';

export function isSeloger(): boolean {
  return window.location.hostname.includes('seloger.com');
}

export function isSelogerDetailPage(): boolean {
  if (!isSeloger()) return false;
  const p = window.location.pathname;
  return /\/annonce\//.test(p) || /\/annonces\//.test(p) || /\/achat\//.test(p) || /\/location\//.test(p);
}

function extractPlatformId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '');
    const segments = path.split('/');
    const lastSeg = segments[segments.length - 1] || '';
    const cleanLast = lastSeg.replace(/\.htm.*$/, '');
    
    // Alphanumeric SeLoger token (e.g. 269W7APVLTZA or numeric ID)
    if (/^[A-Za-z0-9]{8,}$/.test(cleanLast) || /^\d{6,}$/.test(cleanLast)) {
      return cleanLast;
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

// Recursively traverse JSON tree to find classified listing data
function findClassifiedObject(node: any, depth = 0): any | null {
  if (!node || depth > 8 || typeof node !== 'object') return null;

  // Direct classified property
  if (node.classified && typeof node.classified === 'object') {
    return node.classified;
  }
  if (node.classifiedSummary && typeof node.classifiedSummary === 'object') {
    return node.classifiedSummary;
  }

  // Object looking like classified (has pricing / livingArea / customTitle / id)
  if (
    (node.customTitle || node.headline || node.livingArea || node.pricing) &&
    (node.pricing || node.photos || node.medias || node.id)
  ) {
    return node;
  }

  // Check common wrapper keys
  const priorityKeys = ['app_cldp', 'props', 'pageProps', 'data', 'initialState', 'state', 'listing'];
  for (const k of priorityKeys) {
    if (node[k] && typeof node[k] === 'object') {
      const found = findClassifiedObject(node[k], depth + 1);
      if (found) return found;
    }
  }

  // General object search
  if (Array.isArray(node)) {
    for (const item of node) {
      if (typeof item === 'object') {
        const found = findClassifiedObject(item, depth + 1);
        if (found) return found;
      }
    }
  } else {
    for (const key of Object.keys(node)) {
      if (typeof node[key] === 'object' && node[key] !== null) {
        const found = findClassifiedObject(node[key], depth + 1);
        if (found) return found;
      }
    }
  }

  return null;
}

function parseJsonScripts(): any | null {
  // 1. Check __NEXT_DATA__
  const nextDataEl = document.getElementById('__NEXT_DATA__');
  if (nextDataEl && nextDataEl.textContent) {
    try {
      const parsed = JSON.parse(nextDataEl.textContent);
      const classified = findClassifiedObject(parsed);
      if (classified) return classified;
    } catch (e) {
      console.warn('[Immo-Boussole] Failed to parse __NEXT_DATA__ JSON:', e);
    }
  }

  // 2. Check all <script type="application/json">
  const jsonScripts = document.querySelectorAll('script[type="application/json"]');
  for (let i = 0; i < jsonScripts.length; i++) {
    const text = jsonScripts[i].textContent;
    if (text && (text.includes('classified') || text.includes('pricing') || text.includes('livingArea'))) {
      try {
        const parsed = JSON.parse(text);
        const classified = findClassifiedObject(parsed);
        if (classified) return classified;
      } catch (e) {
        // ignore
      }
    }
  }

  // 3. Check inline script variables (window.__UFRN_LIFECYCLE_SERVERREQUEST__ etc.)
  const allScripts = document.querySelectorAll('script:not([src])');
  for (let i = 0; i < allScripts.length; i++) {
    const text = allScripts[i].textContent || '';
    if (text.includes('classified') && (text.includes('customTitle') || text.includes('pricing'))) {
      const match = text.match(/(\{.*"classified"\s*:\s*\{.*?\}.*?\})/s) || text.match(/window\.__[A-Z_]+__\s*=\s*(\{.*?\});/s);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          const classified = findClassifiedObject(parsed);
          if (classified) return classified;
        } catch (e) {
          // ignore
        }
      }
    }
  }

  return null;
}

// Convert thumbnail / cropped SeLoger image URLs to maximum HD resolution
export function toHdImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  let hd = url;

  // Replace sizing in path (e.g. /120x90/ or /crop/120x90/ or /fit-in/300x200/)
  hd = hd.replace(/\/(?:crop|fit-in|resize|thumbnail)\/\d+x\d+\//i, '/fit-in/1920x1080/');
  hd = hd.replace(/\/\d+x\d+\//i, '/1920x1080/');

  // Replace query parameters sizing (e.g. ?w=120&h=90)
  try {
    const u = new URL(hd);
    if (u.searchParams.has('w') || u.searchParams.has('width')) {
      u.searchParams.set('w', '1920');
      u.searchParams.delete('h');
      u.searchParams.delete('height');
      hd = u.toString();
    }
  } catch (e) {
    // ignore
  }

  return hd;
}

function parseJsonLdScripts(): any | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    const text = scripts[i].textContent;
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] ? parsed['@graph'] : [parsed]);
      for (const item of items) {
        if (
          item &&
          (item['@type'] === 'SingleFamilyResidence' ||
           item['@type'] === 'Apartment' ||
           item['@type'] === 'House' ||
           item['@type'] === 'RealEstateListing' ||
           item['@type'] === 'Product' ||
           item.offers ||
           item.floorSize ||
           item.numberOfRooms)
        ) {
          return item;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

function extractImageUrls(mediaList: any[]): string[] {
  const urls: string[] = [];
  if (!Array.isArray(mediaList)) return urls;

  for (const item of mediaList) {
    let candidate: string | undefined;
    if (typeof item === 'string' && item.startsWith('http')) {
      candidate = item;
    } else if (item && typeof item === 'object') {
      candidate = item.hdUrl || item.largeUrl || item.fullUrl || item.url || item.src || item.path || item.contentUrl;
    }
    if (candidate && typeof candidate === 'string' && candidate.startsWith('http')) {
      const hd = toHdImageUrl(candidate);
      if (!urls.includes(hd)) urls.push(hd);
    }
  }
  return urls;
}

async function fetchFloorplansSubpage(baseUrl: string): Promise<string[]> {
  const cleanBase = baseUrl.split('?')[0].replace(/\/+$/, '');
  const floorplanSubUrls = [
    `${cleanBase}/medias/floorplans`,
    `${cleanBase}/plans`
  ];

  const plans: string[] = [];

  for (const subUrl of floorplanSubUrls) {
    try {
      const resp = await fetch(subUrl, { credentials: 'same-origin' });
      if (!resp.ok) continue;
      const htmlText = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // 1. Check __NEXT_DATA__ in subpage
      const subNext = doc.getElementById('__NEXT_DATA__');
      if (subNext && subNext.textContent) {
        try {
          const parsed = JSON.parse(subNext.textContent);
          const classified = findClassifiedObject(parsed);
          if (classified) {
            const rawPlans = classified.domains?.medias?.floorplans || classified.medias?.plans || classified.floorplans;
            if (rawPlans) {
              const extracted = extractImageUrls(rawPlans);
              extracted.forEach(u => { if (!plans.includes(u)) plans.push(u); });
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 2. Check <img> tags on floorplans subpage
      const imgs = doc.querySelectorAll('img[src*="seloger.com"], img[src*="slstatic.com"], img[src*="poliris.net"]');
      imgs.forEach(img => {
        const src = (img as HTMLImageElement).src || img.getAttribute('src');
        if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon') && !plans.includes(src)) {
          plans.push(src);
        }
      });

      if (plans.length > 0) break;
    } catch (e) {
      console.warn('[Immo-Boussole] Subpage floorplans fetch error:', e);
    }
  }

  return plans;
}

export async function extractSelogerDetailPageAsync(): Promise<ExternalListingPayload> {
  const url = window.location.href;
  const platformId = extractPlatformId(url);
  const external_id = platformId ? `sl_${platformId}` : undefined;

  const classified = parseJsonScripts();

  let title: string | undefined;
  let price: number | undefined;
  let area: number | undefined;
  let land_area: number | undefined;
  let rooms: number | undefined;
  let bedrooms: number | undefined;
  let bathroom_count: number | undefined;
  let city: string | undefined;
  let postal_code: string | undefined;
  let location: string | undefined;
  let description: string | undefined;
  let property_type: string | undefined;
  let dpe_rating: string | undefined;
  let ges_rating: string | undefined;
  let land_tax: number | undefined;
  let charges: number | undefined;
  const photos: string[] = [];
  const floorplans: string[] = [];

  // 1. Structured JSON extraction if available
  if (classified) {
    // Title
    title = classified.customTitle || classified.headline || classified.title || classified.teaserTitle;

    // Pricing
    const pAmount = classified.pricing?.amount ?? classified.pricing?.price ?? classified.price;
    if (pAmount !== undefined && pAmount !== null) {
      const num = typeof pAmount === 'string' ? parseFloat(pAmount.replace(/[^\d.]/g, '')) : Number(pAmount);
      if (!isNaN(num) && num > 0) price = num;
    }

    // Area & Land Area
    const living = classified.livingArea ?? classified.surface ?? classified.area;
    if (living !== undefined && living !== null) {
      const num = typeof living === 'string' ? parseFloat(living.replace(',', '.')) : Number(living);
      if (!isNaN(num) && num > 0) area = num;
    }

    const ground = classified.landSurface ?? classified.landArea ?? classified.groundArea ?? classified.terrainSurface;
    if (ground !== undefined && ground !== null) {
      const num = typeof ground === 'string' ? parseFloat(ground.replace(',', '.')) : Number(ground);
      if (!isNaN(num) && num > 0) land_area = num;
    }

    // Rooms & Bedrooms
    const rCount = classified.rooms?.total ?? classified.rooms?.count ?? classified.rooms;
    if (rCount !== undefined && rCount !== null) {
      const num = typeof rCount === 'string' ? parseInt(rCount, 10) : Number(rCount);
      if (!isNaN(num) && num > 0) rooms = num;
    }

    const bCount = classified.rooms?.bedrooms ?? classified.bedrooms;
    if (bCount !== undefined && bCount !== null) {
      const num = typeof bCount === 'string' ? parseInt(bCount, 10) : Number(bCount);
      if (!isNaN(num) && num > 0) bedrooms = num;
    }

    // Bathrooms
    const bathRooms = classified.rooms?.bathRooms || classified.bathRooms || 0;
    const showerRooms = classified.rooms?.showerRooms || classified.showerRooms || 0;
    const totalBaths = (Number(bathRooms) || 0) + (Number(showerRooms) || 0);
    if (totalBaths > 0) bathroom_count = totalBaths;

    // Location & Postal Code
    city = classified.location?.city || classified.city;
    postal_code = classified.location?.zipCode || classified.location?.postalCode || classified.zipCode;
    if (city && postal_code) {
      location = `${city} (${postal_code})`;
    } else if (city) {
      location = city;
    }

    // Description
    description = classified.description || classified.body || classified.text;

    // Property Type
    property_type = classified.propertyType || classified.estateType;

    // Energy ratings
    const dpeGrade = classified.energy?.dpe?.grade || classified.energy?.dpeGrade || classified.dpe;
    if (typeof dpeGrade === 'string' && /^[A-G]$/i.test(dpeGrade.trim())) {
      dpe_rating = dpeGrade.trim().toUpperCase();
    }

    const gesGrade = classified.energy?.ges?.grade || classified.energy?.gesGrade || classified.ges;
    if (typeof gesGrade === 'string' && /^[A-G]$/i.test(gesGrade.trim())) {
      ges_rating = gesGrade.trim().toUpperCase();
    }

    // Taxes & Charges
    const tax = classified.pricing?.landTax ?? classified.pricing?.propertyTax ?? classified.taxeFonciere;
    if (tax !== undefined && tax !== null) {
      const num = typeof tax === 'string' ? parseFloat(tax.replace(/[^\d.]/g, '')) : Number(tax);
      if (!isNaN(num) && num > 0) land_tax = num;
    }

    const ch = classified.pricing?.charges ?? classified.pricing?.monthlyCharges ?? classified.charges;
    if (ch !== undefined && ch !== null) {
      const num = typeof ch === 'string' ? parseFloat(ch.replace(/[^\d.]/g, '')) : Number(ch);
      if (!isNaN(num) && num >= 0) charges = num;
    }

    // Photos
    const rawImages = classified.domains?.medias?.images || classified.medias?.images || classified.photos || classified.pictures;
    if (rawImages) {
      const extractedPhotos = extractImageUrls(rawImages);
      extractedPhotos.forEach(u => { if (!photos.includes(u)) photos.push(u); });
    }

    // Floorplans
    const rawFloorplans = classified.domains?.medias?.floorplans || classified.medias?.plans || classified.floorplans;
    if (rawFloorplans) {
      const extractedPlans = extractImageUrls(rawFloorplans);
      extractedPlans.forEach(u => {
        if (!floorplans.includes(u)) floorplans.push(u);
        if (!photos.includes(u)) photos.push(u);
      });
    }
  }

  // 2. Structured JSON-LD extraction if available
  const jsonLd = parseJsonLdScripts();
  if (jsonLd) {
    if (!title && jsonLd.name) title = jsonLd.name;
    if (!description && jsonLd.description) description = jsonLd.description;
    if (!price && jsonLd.offers?.price) {
      const num = Number(jsonLd.offers.price);
      if (!isNaN(num) && num > 0) price = num;
    }
    if (!area && jsonLd.floorSize?.value) {
      const num = Number(jsonLd.floorSize.value);
      if (!isNaN(num) && num > 0) area = num;
    }
    if (!rooms && jsonLd.numberOfRooms) {
      const num = Number(jsonLd.numberOfRooms);
      if (!isNaN(num) && num > 0) rooms = num;
    }
    if (!bedrooms && jsonLd.numberOfBedrooms) {
      const num = Number(jsonLd.numberOfBedrooms);
      if (!isNaN(num) && num > 0) bedrooms = num;
    }
    if (!bathroom_count && jsonLd.numberOfBathroomsTotal) {
      const num = Number(jsonLd.numberOfBathroomsTotal);
      if (!isNaN(num) && num > 0) bathroom_count = num;
    }
    if (!city && jsonLd.address?.addressLocality) city = jsonLd.address.addressLocality;
    if (!postal_code && jsonLd.address?.postalCode) postal_code = String(jsonLd.address.postalCode);
    if (jsonLd.image) {
      const ldImages = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
      const extracted = extractImageUrls(ldImages);
      extracted.forEach(u => { if (!photos.includes(u)) photos.push(u); });
    }
  }

  // 3. DOM & URL Fallbacks for any missing fields
  if (!title) {
    const h1 = document.querySelector('h1');
    title = h1 ? h1.textContent?.trim() : document.title;
  }

  if (!price) {
    const priceEl = document.querySelector('[data-test="ad-price"]') || 
                    document.querySelector('[class*="Price__"]') ||
                    document.querySelector('[data-qa="price"]');
    if (priceEl && priceEl.textContent) {
      const rawPrice = priceEl.textContent.replace(/[^\d]/g, '');
      if (rawPrice) price = parseFloat(rawPrice);
    }
  }

  const pageText = document.body.innerText || '';

  if (!area) {
    const areaMatch = pageText.match(/(\d+([\.,]\d+)?)\s*m²(?!\s*(?:de\s+terrain|terrain))/i);
    if (areaMatch) area = parseFloat(areaMatch[1].replace(',', '.'));
  }

  if (!land_area) {
    const landMatch = pageText.match(/(?:terrain|parcelle|jardin)(?:\s+de)?\s*(\d+([\.,]\d+)?)\s*m²/i) ||
                      pageText.match(/(\d+([\.,]\d+)?)\s*m²\s*(?:de\s+terrain|terrain|de\s+parcelle|parcelle)/i);
    if (landMatch) land_area = parseFloat(landMatch[1].replace(',', '.'));
  }

  if (!rooms) {
    const tfMatch = pageText.match(/\b[TF](\d+)\b/i) ||
                    pageText.match(/(\d+)\s*pièce/i) ||
                    pageText.match(/(\d+)\s*p\b/i);
    if (tfMatch) rooms = parseInt(tfMatch[1], 10);
  }

  if (!bedrooms) {
    const bedMatch = pageText.match(/(\d+)\s*chambre/i) ||
                     pageText.match(/(\d+)\s*ch\b/i);
    if (bedMatch) bedrooms = parseInt(bedMatch[1], 10);
  }

  if (!bathroom_count) {
    const bathMatch = pageText.match(/(\d+)\s*salle[s]?\s*(?:de\s*bain|d'eau)/i) ||
                      pageText.match(/(\d+)\s*(?:sdb|sde)\b/i);
    if (bathMatch) bathroom_count = parseInt(bathMatch[1], 10);
  }

  if (!postal_code || !city) {
    const locEl = document.querySelector('[data-test="ad-location"]') ||
                  document.querySelector('[class*="Location__"]') ||
                  document.querySelector('[class*="Summary__Location"]');
    const locText = locEl ? locEl.textContent || '' : pageText;
    const cpMatch = locText.match(/\b(\d{5})\b/);
    if (cpMatch) postal_code = cpMatch[1];
    const cityMatch = locText.match(/([A-ZÀ-ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ-]+)*)\s*\(\d{5}\)/);
    if (cityMatch) city = cityMatch[1];
  }

  // URL location fallback (e.g. /saint-clair-du-rhone-38370/)
  if (!postal_code || !city) {
    const urlLocMatch = url.match(/\/([a-z0-9-]+)-(\d{5})\//i);
    if (urlLocMatch) {
      if (!postal_code) postal_code = urlLocMatch[2];
      if (!city) {
        city = urlLocMatch[1]
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join('-');
      }
    }
  }

  if (city && postal_code) {
    location = `${city} (${postal_code})`;
  } else if (city) {
    location = city;
  }

  if (!description) {
    const descEl = document.querySelector('[data-test="ad-description"]') ||
                   document.querySelector('[class*="Description__"]') ||
                   document.querySelector('[data-qa="description"]') ||
                   document.querySelector('[class*="ShowMore__Wrapper"]') ||
                   document.querySelector('[class*="ReadMore__"]');
    if (descEl) description = descEl.textContent?.trim();
  }

  if (!dpe_rating) {
    const dpeMatch = pageText.match(/DPE\s*[:\s]*([A-G])\b/i);
    if (dpeMatch) dpe_rating = dpeMatch[1].toUpperCase();
  }

  if (!ges_rating) {
    const gesMatch = pageText.match(/GES\s*[:\s]*([A-G])\b/i);
    if (gesMatch) ges_rating = gesMatch[1].toUpperCase();
  }

  if (!land_tax) {
    const taxMatch = pageText.match(/taxe\s*foncière\s*[:\s]*(\d+([\.,]\d+)?)\s*€/i);
    if (taxMatch) land_tax = parseFloat(taxMatch[1].replace(',', '.'));
  }

  // Synthesize a descriptive title if empty or too generic
  if (!title || title.length < 15 || /^Maison|Appartement$/i.test(title.trim())) {
    const parts = [
      property_type || (title ? title.trim() : 'Maison'),
      rooms ? `T${rooms}` : undefined,
      area ? `${Math.round(area)} m²` : undefined,
      location || city
    ].filter(Boolean);
    if (parts.length >= 2) {
      title = parts.join(' - ');
    }
  }

  // Fallback photo extraction from DOM images if none or very few
  if (photos.length < 3) {
    const imgEls = document.querySelectorAll('img[src*="seloger.com"], img[src*="slstatic.com"], img[src*="poliris.net"]');
    imgEls.forEach(img => {
      const src = (img as HTMLImageElement).src || img.getAttribute('src');
      if (
        src &&
        src.startsWith('http') &&
        !src.includes('logo') &&
        !src.includes('avatar') &&
        !src.includes('icon') &&
        !src.includes('placeholder')
      ) {
        const hd = toHdImageUrl(src);
        if (!photos.includes(hd)) {
          photos.push(hd);
        }
      }
    });
  }

  // 3. Floorplans sub-page async recovery if not already found
  if (floorplans.length === 0) {
    const subpagePlans = await fetchFloorplansSubpage(url);
    subpagePlans.forEach(p => {
      if (!floorplans.includes(p)) floorplans.push(p);
      if (!photos.includes(p)) photos.push(p);
    });
  }

  return {
    url,
    external_id,
    title: title || 'Annonce SeLoger',
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
    dpe_rating,
    ges_rating,
    land_tax,
    charges,
    photos: photos.length > 0 ? photos : undefined,
    floorplans: floorplans.length > 0 ? floorplans : undefined,
    source: 'seloger'
  };
}

export function extractSelogerDetailPage(): ExternalListingPayload {
  // Synchronous wrapper (triggers async enrichment in background if needed)
  const syncPayload: ExternalListingPayload = {
    url: window.location.href,
    source: 'seloger'
  };
  return syncPayload;
}

export function injectSelogerButtons(onAdd: (payload: ExternalListingPayload, btn: HTMLButtonElement) => void) {
  if (!isSelogerDetailPage()) return;

  const BAR_ID = 'immo-boussole-seloger-action-bar';
  let bar = document.getElementById(BAR_ID);

  // Remove any legacy duplicate wrappers if present
  const oldWrappers = document.querySelectorAll('.immo-boussole-detail-wrapper:not(#' + BAR_ID + ')');
  oldWrappers.forEach(el => el.remove());

  if (bar) return;

  const anchor = document.querySelector('h1') || 
                 document.querySelector('[data-test="ad-price"]') || 
                 document.querySelector('[class*="Price__"]') ||
                 document.querySelector('main header') ||
                 document.querySelector('main');

  if (anchor) {
    bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.className = 'immo-boussole-action-bar';

    const btn = document.createElement('button');
    btn.className = 'immo-boussole-btn immo-boussole-detail-btn';
    const label = t('btnAddListing') || t('btnAddToImmoBoussole') || 'Ajouter à Immo-Boussole';
    btn.innerHTML = `🧭 ${label}`;
    btn.title = label;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const originalText = btn.innerHTML;
      btn.innerHTML = `🧭 ${t('btnSending') || 'Envoi...'}`;
      try {
        const payload = await extractSelogerDetailPageAsync();
        onAdd(payload, btn);
      } catch (err) {
        btn.innerHTML = originalText;
        const basicPayload = { url: window.location.href, source: 'seloger' };
        onAdd(basicPayload, btn);
      }
    });

    bar.appendChild(btn);

    if (anchor.tagName === 'H1' || anchor.getAttribute('data-test') === 'ad-price' || anchor.className.includes('Price__')) {
      anchor.insertAdjacentElement('afterend', bar);
    } else {
      anchor.insertAdjacentElement('afterbegin', bar);
    }
  }
}

export function updateSelogerButtonsState(immoBoussoleUrl: string, onAdd: (payload: ExternalListingPayload, btn: HTMLButtonElement) => void) {
  const BAR_ID = 'immo-boussole-seloger-action-bar';
  const bar = document.getElementById(BAR_ID);
  if (!bar) return;

  bar.innerHTML = '';

  // 1. Button View in DB
  const btnView = document.createElement('button');
  btnView.className = 'immo-boussole-btn success';
  btnView.innerHTML = `${t('btnAlreadyInDb')} ↗`;
  btnView.title = t('listingAlreadyExists');
  btnView.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(immoBoussoleUrl, '_blank');
  };
  bar.appendChild(btnView);

  // 2. Button Update / Overwrite
  const btnUpdate = document.createElement('button');
  btnUpdate.className = 'immo-boussole-btn immo-boussole-update-btn';
  btnUpdate.innerHTML = `🔄 ${t('btnUpdateListing') || 'Mettre à jour'}`;
  btnUpdate.title = t('btnUpdateListing') || 'Mettre à jour les données dans Immo-Boussole';
  btnUpdate.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const originalText = btnUpdate.innerHTML;
    btnUpdate.innerHTML = `🔄 ${t('btnUpdating') || 'Mise à jour...'}`;
    try {
      const payload = await extractSelogerDetailPageAsync();
      onAdd(payload, btnUpdate);
    } catch (err) {
      btnUpdate.innerHTML = originalText;
      const basicPayload = { url: window.location.href, source: 'seloger' };
      onAdd(basicPayload, btnUpdate);
    }
  };
  bar.appendChild(btnUpdate);
}
