# Guide de Configuration CI/CD : Publication Multi-Stores (Chrome, Firefox, Edge)

Ce guide explique pas-à-pas comment obtenir les identifiants API et configurer les **GitHub Repository Secrets** pour automatiser la publication de l'extension Immo-Boussole sur le **Chrome Web Store**, **Mozilla Firefox Add-ons (AMO)** et **Microsoft Edge Add-ons**.

---

## 📋 Résumé des Secrets GitHub à Configurer

Dans votre dépôt GitHub (`immo-boussole-extension`), rendez-vous dans :
**Settings** > **Secrets and variables** > **Actions** > **New repository secret**.

| Magasin / Service | Nom du Secret GitHub | Description |
| :--- | :--- | :--- |
| **Chrome Web Store** | `CHROME_EXTENSION_ID` | L'ID de l'extension sur le Chrome Web Store (32 caractères) |
| | `CHROME_CLIENT_ID` | Client ID Google Cloud OAuth 2.0 |
| | `CHROME_CLIENT_SECRET` | Client Secret Google Cloud OAuth 2.0 |
| | `CHROME_REFRESH_TOKEN` | Refresh Token OAuth 2.0 avec accès Chrome Web Store API |
| **Mozilla Firefox (AMO)** | `AMO_JWT_ISSUER` | Clé API JWT Issuer (`user:...`) générée sur AMO |
| | `AMO_JWT_SECRET` | Clé secrète API JWT Secret générée sur AMO |
| **Microsoft Edge** | `EDGE_PRODUCT_ID` | Identifiant du produit dans le Microsoft Partner Center (UUID) |
| | `EDGE_CLIENT_ID` | Client ID Azure AD / Microsoft Entra |
| | `EDGE_CLIENT_SECRET` | Client Secret / Clé d'application Azure AD |
| | `EDGE_ACCESS_TOKEN_URL` | URL de jeton Azure AD (ex: `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token`) |

---

## 1. 🌐 Google Chrome Web Store

### Étape 1 : Créer le compte Développeur Chrome
1. Rendez-vous sur le [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Connectez-vous avec votre compte Google et payez les frais uniques d'inscription (5 $ USD).
3. Effectuez un premier téléversement manuel du fichier `immo-boussole-chrome-edge.zip` pour initialiser l'extension et obtenir son **Extension ID** (ex: `abcdefghijklmnopqrstuvwxyz123456`).
4. Enregistrez `CHROME_EXTENSION_ID` dans vos secrets GitHub.

### Étape 2 : Activer l'API & Configurer l'écran de consentement sur Google Cloud
1. Rendez-vous sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un nouveau projet (ex: `Immo-Boussole-Extension-publishing`).
3. Dans la barre de recherche, cherchez **Chrome Web Store API** et cliquez sur **Activer** (*Enable*).
4. Rendez-vous dans **API et services** > **Écran de consentement OAuth** (*OAuth consent screen*) :
   - Type d'utilisateur : **Externe** (*External*).
   - Renseignez le nom de l'application et votre adresse email.
   - **Important** : Dans l'onglet **Utilisateurs test** (*Test users*), cliquez sur **+ ADD USERS** et ajoutez votre adresse email Google (`jmarc.alb@gmail.com`) pour autoriser la génération du jeton.
5. Rendez-vous dans **Identifiants** (*Credentials*) > **Créer des identifiants** > **ID client OAuth 2.0** :
   - Type d'application : **Application de bureau** (*Desktop App*) ou *Application Web* (avec redirect URI `urn:ietf:wg:oauth:2.0:oob` ou `https://oauth.pstmn.io/v1/callback`).
   - Notez le `Client ID` et le `Client Secret`.
   - Enregistrez `CHROME_CLIENT_ID` et `CHROME_CLIENT_SECRET` dans GitHub Secrets.

### Étape 3 : Générer le Refresh Token OAuth 2.0
1. Ouvrez l'URL suivante dans votre navigateur (en remplaçant `<YOUR_CLIENT_ID>` par votre Client ID) :
   ```text
   https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=<YOUR_CLIENT_ID>&redirect_uri=urn:ietf:wg:oauth:2.0:oob
   ```
   *(Ou utilisez l'outil officiel en ligne de commande : `npx chrome-webstore-upload-cli rc`)*
2. Autorisez l'accès et copiez le code d'autorisation affiché.
3. Échangez ce code contre un refresh token via une requête HTTP POST ou avec la CLI :
   ```bash
   curl -X POST -d "client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&code=<AUTHORIZATION_CODE>&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob" https://oauth2.googleapis.com/token
   ```
4. Récupérez la valeur `"refresh_token"` et enregistrez-la dans le secret GitHub `CHROME_REFRESH_TOKEN`.

---

## 2. 🦊 Mozilla Firefox Add-ons (AMO)

### Étape 1 : Créer le compte Développeur Mozilla
1. Rendez-vous sur le portail [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/).
2. Connectez-vous avec votre compte Firefox.

### Étape 2 : Générer les Clés API (JWT)
1. Rendez-vous sur la page [Gestion des clés API AMO](https://addons.mozilla.org/developers/addon/api/key/).
2. Cliquez sur **Générer de nouvelles informations d'authentification** (*Generate new credentials*).
3. Notez :
   - **Émetteur JWT (JWT Issuer)** : commence par `user:...` -> Enregistrez dans `AMO_JWT_ISSUER`.
   - **Secret JWT (JWT Secret)** -> Enregistrez dans `AMO_JWT_SECRET`.

> [!NOTE]
> Le workflow GitHub soumettra automatiquement les nouvelles versions en mode **Listed** (catalogue public AMO) avec signature automatique par Mozilla.

---

## 3. 🌊 Microsoft Edge Add-ons

### Étape 1 : Créer le compte Développeur Microsoft
1. Rendez-vous sur le [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge).
2. Connectez-vous et inscrivez-vous au programme développeur Microsoft Edge.
3. Effectuez un premier téléversement manuel du fichier `immo-boussole-chrome-edge.zip` pour créer le produit et obtenir son **Product ID** (UUID dans l'URL de votre tableau de bord).
4. Enregistrez `EDGE_PRODUCT_ID` dans GitHub Secrets.

### Étape 2 : Activer l'accès API Edge Add-ons
1. Dans le Microsoft Partner Center, allez dans **Paramètres du développeur** (*Developer settings*) > **Gestion des utilisateurs** (*User management*) > **Applications Azure AD**.
2. Créez une application Azure AD ou associez-en une existante.
3. Récupérez le **Client ID**, la **Clé secrète (Client Secret)** et l'URL de jeton de votre locataire Azure AD (ex: `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token`).
4. Enregistrez respectivement dans :
   - `EDGE_CLIENT_ID`
   - `EDGE_CLIENT_SECRET`
   - `EDGE_ACCESS_TOKEN_URL`

---

## 🚀 Déclenchement de la Publication Automatisée

### 1. Publication par Tag Git (Recommandé)
Pour créer une nouvelle version et déclencher la publication sur tous les stores configurés :
```bash
git tag v1.1.0
git push origin v1.1.0
```

### 2. Déclenchement Manuel (GitHub Actions Web UI)
1. Rendez-vous sur GitHub dans l'onglet **Actions** de votre dépôt.
2. Sélectionnez le workflow **Build, Package & Publish Extension**.
3. Cliquez sur **Run workflow**, cochez l'option `Publish to Stores` et validez.
