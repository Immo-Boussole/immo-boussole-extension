export interface ExtensionConfig {
  serverUrl: string;
  apiKey: string;
  username?: string;
  activeTab?: 'apikey' | 'userpass';
  openTabAfterImport?: boolean;
}

export interface ExternalListingPayload {
  url: string;
  title?: string;
  price?: number;
  area?: number;
  rooms?: number;
  bedrooms?: number;
  city?: string;
  postal_code?: string;
  location?: string;
  description?: string;
  photos?: string[];
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
