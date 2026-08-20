import browser from 'webextension-polyfill';
import { getStoredConfig, saveStoredConfig } from '../storage';
document.addEventListener('DOMContentLoaded', async () => {
    const serverUrlInput = document.getElementById('server-url');
    const apiKeyInput = document.getElementById('api-key');
    const configForm = document.getElementById('config-form');
    const btnTest = document.getElementById('btn-test');
    const btnAddCurrent = document.getElementById('btn-add-current');
    const btnAddManual = document.getElementById('btn-add-manual');
    const manualUrlInput = document.getElementById('manual-url');
    const statusMsg = document.getElementById('status-message');
    const addStatusMsg = document.getElementById('add-status-message');
    const badge = document.getElementById('connection-badge');
    // Load existing config
    const config = await getStoredConfig();
    if (config.serverUrl)
        serverUrlInput.value = config.serverUrl;
    if (config.apiKey)
        apiKeyInput.value = config.apiKey;
    if (config.apiKey && config.serverUrl) {
        checkConnection(config.serverUrl, config.apiKey);
    }
    // Save config
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        await saveStoredConfig({ serverUrl, apiKey });
        statusMsg.className = 'status-msg success';
        statusMsg.textContent = 'Configuration enregistrée !';
        checkConnection(serverUrl, apiKey);
    });
    // Test connection
    btnTest.addEventListener('click', async () => {
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        if (!serverUrl || !apiKey) {
            statusMsg.className = 'status-msg error';
            statusMsg.textContent = 'Veuillez saisir l\'URL et la clé API.';
            return;
        }
        await checkConnection(serverUrl, apiKey, true);
    });
    // Add current tab
    btnAddCurrent.addEventListener('click', async () => {
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0] && tabs[0].url) {
                await sendUrlToBackend(tabs[0].url);
            }
            else {
                addStatusMsg.className = 'status-msg error';
                addStatusMsg.textContent = 'Impossible de récupérer l\'URL de l\'onglet actif.';
            }
        }
        catch (err) {
            addStatusMsg.className = 'status-msg error';
            addStatusMsg.textContent = err.message || 'Erreur lors de l\'ajout.';
        }
    });
    // Add manual URL
    btnAddManual.addEventListener('click', async () => {
        const url = manualUrlInput.value.trim();
        if (!url) {
            addStatusMsg.className = 'status-msg error';
            addStatusMsg.textContent = 'Veuillez saisir une URL valide.';
            return;
        }
        await sendUrlToBackend(url);
    });
    async function checkConnection(serverUrl, apiKey, showMsg = false) {
        try {
            const cleanUrl = serverUrl.replace(/\/+$/, '');
            const resp = await fetch(`${cleanUrl}/api/v1/listings/?limit=1`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            if (resp.ok) {
                badge.className = 'badge badge-connected';
                badge.textContent = 'Connecté';
                if (showMsg) {
                    statusMsg.className = 'status-msg success';
                    statusMsg.textContent = 'Connexion à Immo-Boussole réussie !';
                }
            }
            else {
                badge.className = 'badge badge-disconnected';
                badge.textContent = 'Erreur Auth';
                if (showMsg) {
                    statusMsg.className = 'status-msg error';
                    statusMsg.textContent = `Erreur (${resp.status}): Clé d'API ou URL invalide.`;
                }
            }
        }
        catch (err) {
            badge.className = 'badge badge-disconnected';
            badge.textContent = 'Hors ligne';
            if (showMsg) {
                statusMsg.className = 'status-msg error';
                statusMsg.textContent = `Impossible de contacter le serveur: ${err.message}`;
            }
        }
    }
    async function sendUrlToBackend(url) {
        addStatusMsg.className = 'status-msg';
        addStatusMsg.textContent = 'Envoi en cours...';
        const cfg = await getStoredConfig();
        if (!cfg.serverUrl || !cfg.apiKey) {
            addStatusMsg.className = 'status-msg error';
            addStatusMsg.textContent = 'Veuillez configurer l\'URL et la clé API ci-dessus.';
            return;
        }
        try {
            const resp = await browser.runtime.sendMessage({
                type: 'ADD_LISTING',
                payload: { url }
            });
            if (resp && resp.success) {
                addStatusMsg.className = 'status-msg success';
                addStatusMsg.textContent = resp.message || 'Annonce ajoutée avec succès !';
            }
            else {
                addStatusMsg.className = 'status-msg error';
                addStatusMsg.textContent = resp?.message || 'Erreur lors de l\'ajout de l\'annonce.';
            }
        }
        catch (err) {
            addStatusMsg.className = 'status-msg error';
            addStatusMsg.textContent = err.message || 'Erreur réseau.';
        }
    }
});
