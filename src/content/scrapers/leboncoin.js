export function isLeboncoin() {
    return window.location.hostname.includes('leboncoin.fr');
}
export function isLeboncoinDetailPage() {
    return isLeboncoin() && /\/ad\//.test(window.location.pathname);
}
export function extractLeboncoinDetailPage() {
    const url = window.location.href;
    const titleEl = document.querySelector('h1[data-qa-id="adview_title"]') || document.querySelector('h1');
    const title = titleEl ? titleEl.textContent?.trim() : document.title;
    const priceEl = document.querySelector('[data-qa-id="adview_price"]') || document.querySelector('[data-test-id="price"]');
    let price;
    if (priceEl && priceEl.textContent) {
        const rawPrice = priceEl.textContent.replace(/[^\d]/g, '');
        if (rawPrice)
            price = parseFloat(rawPrice);
    }
    let area;
    let rooms;
    // Search in criteria blocks
    const criteriaElements = document.querySelectorAll('[data-qa-id="criteria_item"]');
    criteriaElements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('Surface')) {
            const match = text.match(/(\d+([\.,]\d+)?)\s*m²/i);
            if (match)
                area = parseFloat(match[1].replace(',', '.'));
        }
        if (text.includes('Pièces')) {
            const match = text.match(/(\d+)/);
            if (match)
                rooms = parseInt(match[1], 10);
        }
    });
    // Extract photos
    const photos = [];
    const imgEls = document.querySelectorAll('img[src*="img.leboncoin.fr"]');
    imgEls.forEach(img => {
        const src = img.src;
        if (src && !photos.includes(src)) {
            photos.push(src);
        }
    });
    const descEl = document.querySelector('[data-qa-id="adview_description_container"]');
    const description = descEl ? descEl.textContent?.trim() : undefined;
    return {
        url,
        title,
        price,
        area,
        rooms,
        description,
        photos: photos.slice(0, 10),
        source: 'leboncoin'
    };
}
export function injectLeboncoinButtons(onAdd) {
    // 1. If detail page, inject main header button
    if (isLeboncoinDetailPage()) {
        const headerContainer = document.querySelector('h1')?.parentElement;
        if (headerContainer && !headerContainer.querySelector('.immo-boussole-detail-btn')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'immo-boussole-detail-wrapper';
            const btn = document.createElement('button');
            btn.className = 'immo-boussole-btn immo-boussole-detail-btn';
            btn.innerHTML = '🧭 Ajouter à Immo-Boussole';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const payload = extractLeboncoinDetailPage();
                onAdd(payload, btn);
            });
            wrapper.appendChild(btn);
            headerContainer.appendChild(wrapper);
        }
    }
    // 2. Search listing cards injection
    const cards = document.querySelectorAll('a[href*="/ad/"], article');
    cards.forEach((card) => {
        if (card.querySelector('.immo-boussole-card-btn'))
            return;
        let adUrl = card.href;
        if (!adUrl) {
            const linkEl = card.querySelector('a[href*="/ad/"]');
            if (linkEl)
                adUrl = linkEl.href;
        }
        if (adUrl && adUrl.includes('/ad/')) {
            const btn = document.createElement('button');
            btn.className = 'immo-boussole-btn immo-boussole-btn-card immo-boussole-card-btn';
            btn.innerHTML = '🧭 Immo-Boussole';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Extract card metadata
                const titleEl = card.querySelector('[data-qa-id="aditem_title"]') || card.querySelector('p');
                const priceEl = card.querySelector('[data-qa-id="aditem_price"]') || card.querySelector('span');
                let price;
                if (priceEl && priceEl.textContent) {
                    const rawPrice = priceEl.textContent.replace(/[^\d]/g, '');
                    if (rawPrice)
                        price = parseFloat(rawPrice);
                }
                const payload = {
                    url: adUrl,
                    title: titleEl?.textContent?.trim() || undefined,
                    price,
                    source: 'leboncoin'
                };
                onAdd(payload, btn);
            });
            card.appendChild(btn);
        }
    });
}
