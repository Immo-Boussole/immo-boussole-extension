export interface ExtensionConfig {
  serverUrl: string;
  apiKey: string;
  username?: string;
  activeTab?: 'apikey' | 'userpass';
  openTabAfterImport?: boolean;
}

export interface ExternalListingPayload {
  url: string;
  external_id?: string;
  title?: string;
  price?: number;
  area?: number;
  land_area?: number;
  rooms?: number;
  bedrooms?: number;
  bathroom_count?: number;
  city?: string;
  postal_code?: string;
  location?: string;
  description?: string;
  property_type?: string;
  dpe_rating?: string;
  ges_rating?: string;
  land_tax?: number;
  charges?: number;
  photos?: string[];
  floorplans?: string[];
  source?: string;
}

export interface AddListingResponse {
  success: boolean;
  message: string;
  listingId?: number;
  immoBoussoleUrl?: string;
  alreadyExists?: boolean;
}

export interface CheckListingResponse {
  exists: boolean;
  listingId?: number;
  immoBoussoleUrl?: string;
  title?: string;
}

export function isListingUrl(url?: string): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('leboncoin.fr/ad/') ||
    u.includes('immobilier.lefigaro.fr/annonces/') ||
    u.includes('lefigaro.fr/annonces/') ||
    u.includes('seloger.com/annonce') ||
    u.includes('bienici.com/annonce') ||
    u.includes('pap.fr/annonces/') ||
    u.includes('logic-immo.com/detail-') ||
    u.includes('ouestfrance-immo.com/immobilier/') ||
    u.includes('bellesdemeures.com/') ||
    u.includes('superimmo.com/annonces/') ||
    u.includes('avendrealouer.fr/vente/')
  );
}
