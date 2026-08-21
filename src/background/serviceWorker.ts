import browser from 'webextension-polyfill';
import { getStoredConfig } from '../storage';
import { ExternalListingPayload } from '../types';

browser.runtime.onMessage.addListener(async (message: any, sender: any) => {
  if (message.type === 'ADD_LISTING') {
    return await handleAddListing(message.payload);
  }
  return { success: false, message: 'Type de message inconnu.' };
});

async function handleAddListing(payload: ExternalListingPayload) {
  try {
    const config = await getStoredConfig();
    if (!config.serverUrl || !config.apiKey) {
      return {
        success: false,
        message: 'L\'extension n\'est pas configurée. Cliquez sur l\'icône Immo-Boussole pour configurer l\'URL et la clé d\'API.'
      };
    }

    const cleanServerUrl = config.serverUrl.replace(/\/+$/, '');
    
    // Choose endpoint: if metadata present, use submit-external-listing, else submit-url
    const hasMetadata = payload.title || payload.price || payload.area;
    const endpoint = hasMetadata 
      ? `${cleanServerUrl}/api/v1/actions/submit-external-listing`
      : `${cleanServerUrl}/api/v1/actions/submit-url`;

    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const bodyText = await response.text();

    // Check Cloudflare interception
    if (
      response.redirected && (response.url.includes('cloudflareaccess.com') || response.url.includes('cloudflare.com')) ||
      bodyText.includes('cloudflare') ||
      bodyText.includes('challenge-platform') ||
      bodyText.includes('cf-chl')
    ) {
      // Open server URL to let user complete Cloudflare validation
      try {
        browser.tabs.create({ url: cleanServerUrl });
      } catch (e) {
        // ignore
      }
      return {
        success: false,
        message: 'Protection Cloudflare détectée. Un onglet a été ouvert pour valider l\'accès.'
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: `Erreur du serveur (${response.status}): ${bodyText || response.statusText}`
      };
    }

    try {
      const data = JSON.parse(bodyText);
      return {
        success: true,
        message: data.message || 'Annonce transmise avec succès à Immo-Boussole !'
      };
    } catch {
      return {
        success: false,
        message: 'Réponse invalide du serveur (non-JSON).'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Erreur de connexion: ${error.message || 'Impossible de joindre Immo-Boussole.'}`
    };
  }
}
