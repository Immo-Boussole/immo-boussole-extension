import browser from 'webextension-polyfill';
import { getStoredConfig } from '../storage';
browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === 'ADD_LISTING') {
        return await handleAddListing(message.payload);
    }
    return { success: false, message: 'Type de message inconnu.' };
});
async function handleAddListing(payload) {
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errText = await response.text();
            return {
                success: false,
                message: `Erreur du serveur (${response.status}): ${errText || response.statusText}`
            };
        }
        const data = await response.json();
        return {
            success: true,
            message: data.message || 'Annonce transmise avec succès à Immo-Boussole !'
        };
    }
    catch (error) {
        return {
            success: false,
            message: `Erreur de connexion: ${error.message || 'Impossible de joindre Immo-Boussole.'}`
        };
    }
}
