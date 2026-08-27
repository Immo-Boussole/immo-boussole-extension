export interface ExtensionConfig {
  serverUrl: string;
  apiKey: string;
  username?: string;
  password?: string;
  activeTab?: 'apikey' | 'userpass';
  openTabAfterImport?: boolean;
  usePreparsedData?: boolean;
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
  heating_type?: string;
  heating_mode?: string;
  building_year?: number;
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

  // Reject common search paths
  if (
    u.includes('/recherche') ||
    u.includes('/resultats') ||
    u.includes('/search') ||
    u.includes('/carte') ||
    u.includes('category=') ||
    u.includes('projects=')
  ) {
    return false;
  }

  // Le Figaro: Must contain /annonce- (search pages are /annonces/immobilier-...)
  if (u.includes('lefigaro.fr')) {
    return u.includes('/annonce-') || u.includes('/annonces/annonce-');
  }

  // SeLoger
  if (u.includes('seloger.com')) {
    return (u.includes('/annonce/') || u.includes('/annonces/')) && !u.includes('/resultats/') && !u.includes('/carte/');
  }

  // LeBonCoin
  if (u.includes('leboncoin.fr')) {
    return u.includes('/ad/') || u.includes('/ventes_immobilieres/') || u.includes('/locations/');
  }

  // Bien'Ici
  if (u.includes('bienici.com')) {
    return u.includes('/annonce/') && !u.includes('/recherche/');
  }

  return (
    u.includes('pap.fr/annonces/annonce-') ||
    u.includes('pap.fr/annonce/') ||
    u.includes('logic-immo.com/detail-') ||
    u.includes('ouestfrance-immo.com/immobilier/') ||
    u.includes('bellesdemeures.com/') ||
    u.includes('superimmo.com/annonces/') ||
    u.includes('avendrealouer.fr/vente/') ||
    u.includes('immoreve.fr') ||
    u.includes('admin/crm/index.php') ||
    u.includes('hektor')
  );
}
