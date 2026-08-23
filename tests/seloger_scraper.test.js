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

function findClassifiedObject(node, depth = 0) {
  if (!node || depth > 8 || typeof node !== 'object') return null;
  if (node.classified && typeof node.classified === 'object') return node.classified;
  if (node.customTitle || (node.livingArea && node.pricing)) return node;
  for (const k of ['props', 'pageProps', 'data', 'app_cldp']) {
    if (node[k] && typeof node[k] === 'object') {
      const found = findClassifiedObject(node[k], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

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

console.log("✓ SeLoger Next.js parser simulation unit tests PASSED successfully!");
