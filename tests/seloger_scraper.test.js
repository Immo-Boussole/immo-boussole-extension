import assert from 'assert';

// Mock test structure for SeLoger Next.js structured data extraction
const mockNextData = {
  props: {
    pageProps: {
      classified: {
        id: "269W7APVLTZA",
        customTitle: "Maison individuelle 5 pièces avec appartement T2",
        headline: "Maison Saint-Clair-du-Rhône",
        pricing: {
          amount: 349000.0,
          landTax: 1170.0,
          charges: 0.0
        },
        livingArea: 140.0,
        landSurface: 629.0,
        rooms: {
          total: 5,
          bedrooms: 3,
          bathRooms: 1,
          showerRooms: 1
        },
        location: {
          city: "Saint-Clair-du-Rhône",
          zipCode: "38370"
        },
        description: "Maison individuelle rénovée avec appartement indépendant...",
        propertyType: "Maison",
        energy: {
          dpe: { grade: "A" },
          ges: { grade: "A" }
        },
        domains: {
          medias: {
            images: [
              { url: "https://mms.seloger.com/photos/1.jpg" },
              { url: "https://mms.seloger.com/photos/2.jpg" }
            ],
            floorplans: [
              { url: "https://mms.seloger.com/floorplans/plan1.jpg" }
            ]
          }
        }
      }
    }
  }
};

function toHdImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let hd = url.trim();
  if (!hd) return hd;
  if (hd.startsWith('//')) hd = 'https:' + hd;
  if (hd.includes('/_next/image') && hd.includes('url=')) {
    try {
      const parsed = new URL(hd, 'https://www.seloger.com');
      const realUrl = parsed.searchParams.get('url');
      if (realUrl) hd = decodeURIComponent(realUrl);
    } catch (e) {}
  }
  hd = hd.replace(/\/(?:crop|fit-in|resize|thumbnail)\/\d+x\d+\//i, '/fit-in/1920x1080/');
  hd = hd.replace(/\/\d+x\d+\//i, '/1920x1080/');
  try {
    const u = new URL(hd);
    if (u.searchParams.has('w') || u.searchParams.has('width')) {
      u.searchParams.set('w', '1920');
      u.searchParams.delete('h');
      u.searchParams.delete('height');
      hd = u.toString();
    }
  } catch (e) {}
  return hd;
}

function collectAllPhotosFromJson(node, depth = 0) {
  if (!node || depth > 8) return [];
  const photos = [];
  const isPhotoValid = (u) => {
    if (!u || typeof u !== 'string' || !u.startsWith('http')) return false;
    const low = u.toLowerCase();
    return !['logo', 'avatar', 'icon', 'placeholder', 'badge', 'pin-map', 'favicon', 'pixel'].some(k => low.includes(k));
  };
  const addCandidate = (c) => {
    if (!c) return;
    if (typeof c === 'string') {
      const hd = toHdImageUrl(c);
      if (hd && isPhotoValid(hd) && !photos.includes(hd)) photos.push(hd);
    } else if (typeof c === 'object') {
      for (const k of ['hdUrl', 'largeUrl', 'fullUrl', 'url', 'src', 'path', 'contentUrl', 'uri', 'original', 'large', 'big', 'url_photo', 'url_large', 'rawUrl', 'thumbnail']) {
        if (typeof c[k] === 'string') {
          const hd = toHdImageUrl(c[k]);
          if (hd && isPhotoValid(hd) && !photos.includes(hd)) photos.push(hd);
        }
      }
      if (c.image) addCandidate(c.image);
    }
  };

  if (Array.isArray(node)) {
    node.forEach(addCandidate);
  } else if (typeof node === 'object') {
    for (const k of ['images', 'photos', 'medias', 'pictures', 'rawPhotos', 'gallery']) {
      if (node[k]) {
        if (Array.isArray(node[k])) node[k].forEach(addCandidate);
        else if (typeof node[k] === 'object') {
          for (const subK of ['images', 'photos', 'all', 'large', 'list']) {
            if (Array.isArray(node[k][subK])) node[k][subK].forEach(addCandidate);
          }
        }
      }
    }
    for (const val of Object.values(node)) {
      if (val && typeof val === 'object') {
        collectAllPhotosFromJson(val, depth + 1).forEach(p => {
          if (!photos.includes(p)) photos.push(p);
        });
      }
    }
  }
  return photos;
}

function findClassifiedObject(node, depth = 0) {
  if (!node || depth > 8 || typeof node !== 'object') return null;

  if (node.listingData && typeof node.listingData === 'object') {
    const fromListingData = node.listingData.listing || node.listingData.classified || node.listingData;
    if (fromListingData && typeof fromListingData === 'object') return fromListingData;
  }
  if (node.classified && typeof node.classified === 'object') {
    return node.classified;
  }
  if (node.listing && typeof node.listing === 'object') {
    return node.listing;
  }

  if (
    (node.customTitle || node.headline || node.livingArea || node.pricing) &&
    (node.pricing || node.photos || node.medias || node.id)
  ) {
    return node;
  }

  const priorityKeys = ['app_cldp', 'props', 'pageProps', 'listingData', 'initialState', 'data', 'state', 'listing'];
  for (const k of priorityKeys) {
    if (node[k] && typeof node[k] === 'object') {
      const found = findClassifiedObject(node[k], depth + 1);
      if (found) return found;
    }
  }

  if (node.classifiedSummary && typeof node.classifiedSummary === 'object') {
    return node.classifiedSummary;
  }

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

// Test 1: Full classified extraction from Next.js structure
const classified = findClassifiedObject(mockNextData);
assert(classified !== null, "Classified object should be found");
assert.strictEqual(classified.customTitle, "Maison individuelle 5 pièces avec appartement T2");
assert.strictEqual(classified.pricing.amount, 349000.0);
assert.strictEqual(classified.livingArea, 140.0);
assert.strictEqual(classified.landSurface, 629.0);
assert.strictEqual(classified.rooms.total, 5);
assert.strictEqual(classified.rooms.bedrooms, 3);
assert.strictEqual(classified.rooms.bathRooms + classified.rooms.showerRooms, 2);
assert.strictEqual(classified.location.city, "Saint-Clair-du-Rhône");
assert.strictEqual(classified.location.zipCode, "38370");
assert.strictEqual(classified.energy.dpe.grade, "A");
assert.strictEqual(classified.energy.ges.grade, "A");
assert.strictEqual(classified.pricing.landTax, 1170.0);
assert.strictEqual(classified.domains.medias.images.length, 2);
assert.strictEqual(classified.domains.medias.floorplans.length, 1);

// Test 2: Modern Next.js listingData structure & classifiedSummary prioritization
const mockListingDataStructure = {
  props: {
    pageProps: {
      classifiedSummary: {
        id: "269W7APVLTZA_SUMMARY",
        customTitle: "Summary teaser (1 photo only)",
        photos: ["https://v.seloger.com/s/crop/120x90/teaser.jpg"]
      },
      listingData: {
        listing: {
          id: "269W7APVLTZA_FULL",
          customTitle: "Maison 5 pièces 140m²",
          pricing: { amount: 349000.0 },
          livingArea: 140.0,
          photos: [
            "https://v.seloger.com/s/crop/120x90/1.jpg",
            "//mms.seloger.com/photos/2.jpg",
            { hdUrl: "https://v.seloger.com/s/crop/120x90/3.jpg" },
            { largeUrl: "https://photos.aviv-group.com/4.jpg" },
            { src: "/_next/image?url=https%3A%2F%2Fv.seloger.com%2Fs%2Fcrop%2F120x90%2F5.jpg&w=1080&q=75" }
          ]
        }
      }
    }
  }
};

const fullListingObj = findClassifiedObject(mockListingDataStructure);
assert.strictEqual(fullListingObj.id, "269W7APVLTZA_FULL", "Should prioritize full listingData over classifiedSummary");

// Test 3: collectAllPhotosFromJson recursive collector
const allCollectedPhotos = collectAllPhotosFromJson(mockListingDataStructure);
assert(allCollectedPhotos.length >= 5, `Expected at least 5 photos collected, got ${allCollectedPhotos.length}`);
assert(allCollectedPhotos.some(u => u.includes("1920x1080/1.jpg")), "Photo 1 should be converted to HD");
assert(allCollectedPhotos.some(u => u.startsWith("https://mms.seloger.com")), "Protocol relative URL should have https:");
assert(allCollectedPhotos.some(u => u.includes("1920x1080/3.jpg")), "Photo 3 hdUrl should be converted to HD");
assert(allCollectedPhotos.some(u => u.includes("photos.aviv-group.com/4.jpg")), "Aviv group photo should be included");
assert(allCollectedPhotos.some(u => u.includes("1920x1080/5.jpg")), "Next.js decoded photo should be converted to HD");

// Test 4: HD image enhancer
const thumbUrl = "https://v.seloger.com/s/crop/120x90/visuels/1/2/3.jpg";
const hdUrl = toHdImageUrl(thumbUrl);
assert.strictEqual(hdUrl, "https://v.seloger.com/s/fit-in/1920x1080/visuels/1/2/3.jpg");

const protoRelUrl = "//v.seloger.com/s/120x90/visuels/1.jpg";
assert.strictEqual(toHdImageUrl(protoRelUrl), "https://v.seloger.com/s/1920x1080/visuels/1.jpg");

const nextImgUrl = "https://www.seloger.com/_next/image?url=https%3A%2F%2Fv.seloger.com%2Fs%2Fcrop%2F120x90%2Ftest.jpg&w=640&q=75";
assert.strictEqual(toHdImageUrl(nextImgUrl), "https://v.seloger.com/s/fit-in/1920x1080/test.jpg");

// Test 5: URL location slug extraction
const testUrl = "https://www.seloger.com/annonce/achat/auvergne-rhone-alpes/isere-38/saint-clair-du-rhone-38370/26H129BK5GHE";
const urlLocMatch = testUrl.match(/\/([a-z0-9-]+)-(\d{5})\//i);
assert(urlLocMatch !== null, "URL location slug should match");
assert.strictEqual(urlLocMatch[2], "38370");
const parsedCity = urlLocMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
assert.strictEqual(parsedCity, "Saint-Clair-Du-Rhone");

// Test 6: T6/F6 regex
const testText = "Maison à vendre T6/F6 138 m² 422000 € Saint-Clair-du-Rhône (38370)";
const tfMatch = testText.match(/\b[TF](\d+)\b/i) || testText.match(/(\d+)\s*pièce/i);
assert(tfMatch !== null, "T6/F6 should match rooms");
assert.strictEqual(parseInt(tfMatch[1], 10), 6);

const priceMatch = testText.match(/(\d[\d\s]*\d)\s*€/);
assert(priceMatch !== null, "Price should match");
assert.strictEqual(parseFloat(priceMatch[1].replace(/\s/g, '')), 422000);

console.log("✓ All SeLoger scraper unit tests PASSED successfully!");
