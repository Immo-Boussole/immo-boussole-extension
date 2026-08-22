import browser from 'webextension-polyfill';
import { getStoredConfig } from '../storage';
import { t } from '../i18n';
browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === 'ADD_LISTING') {
        return await handleAddListing(message.payload);
    }
    return { success: false, message: t('unknownMessageType') };
});
async function handleAddListing(payload) {
    try {
        const config = await getStoredConfig();
        if (!config.serverUrl || !config.apiKey) {
            return {
                success: false,
                message: t('notConfigured')
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
        if (response.redirected && (response.url.includes('cloudflareaccess.com') || response.url.includes('cloudflare.com')) ||
            bodyText.includes('cloudflare') ||
            bodyText.includes('challenge-platform') ||
            bodyText.includes('cf-chl')) {
            // Open server URL to let user complete Cloudflare validation
            try {
                await browser.tabs.create({ url: cleanServerUrl });
            }
            catch (e) {
                // ignore
            }
            return {
                success: false,
                message: t('cloudflareDetected')
            };
        }
        if (!response.ok) {
            return {
                success: false,
                message: `${t('serverError')} (${response.status}): ${bodyText || response.statusText}`
            };
        }
        try {
            const data = JSON.parse(bodyText);
            let localizedMsg = data.message;
            const isAlreadyExists = data.data?.already_exists || (typeof data.message === 'string' && data.message.toLowerCase().includes('déjà'));
            if (isAlreadyExists) {
                localizedMsg = t('listingAlreadyExists');
            }
            else if (data.message === 'Scraping task started in background.') {
                localizedMsg = t('scrapingStarted');
            }
            let listingId = undefined;
            if (data.data && data.data.listing_id) {
                listingId = data.data.listing_id;
            }
            // Fallback query: if listingId not in response, query /api/v1/listings/ to retrieve matching ID or latest import
            if (!listingId) {
                try {
                    const listResp = await fetch(`${cleanServerUrl}/api/v1/listings/?limit=20`, {
                        headers: {
                            'Authorization': `Bearer ${config.apiKey}`
                        },
                        credentials: 'include'
                    });
                    if (listResp.ok) {
                        const listData = await listResp.json();
                        if (Array.isArray(listData) && listData.length > 0) {
                            const match = listData.find((l) => l.url === payload.url || l.original_url === payload.url);
                            listingId = match ? match.id : listData[0].id;
                        }
                    }
                }
                catch (errFallback) {
                    console.warn('Fallback listing retrieval failed:', errFallback);
                }
            }
            const immoBoussoleUrl = listingId
                ? `${cleanServerUrl}/listings/${listingId}`
                : `${cleanServerUrl}/`;
            // Auto-open new tab if option is enabled (default is true)
            if (config.openTabAfterImport !== false && immoBoussoleUrl) {
                try {
                    await browser.tabs.create({ url: immoBoussoleUrl, active: true });
                }
                catch (e) {
                    console.warn('Could not auto-open listing tab:', e);
                }
            }
            return {
                success: true,
                message: localizedMsg || t('addSuccess'),
                listingId,
                immoBoussoleUrl,
                alreadyExists: isAlreadyExists
            };
        }
        catch {
            return {
                success: false,
                message: t('invalidJsonResponse')
            };
        }
    }
    catch (error) {
        return {
            success: false,
            message: `${t('connectionError')}: ${error.message || t('serverUnreachable')}`
        };
    }
}
