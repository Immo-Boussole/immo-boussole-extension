export interface ExtensionConfig {
  serverUrl: string;
  apiKey: string;
  username?: string;
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
}
