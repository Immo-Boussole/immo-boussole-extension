# Extension Navigateur Immo-Boussole (Firefox, Chrome, Edge)

Extension navigateur officielle pour **Immo-Boussole**, compatible avec **Firefox**, **Chrome** et **Microsoft Edge**.

---

## 🌟 Fonctionnalités

- **Boutons intégrés** : Inscription automatique de boutons *"🧭 Ajouter à Immo-Boussole"* sur chaque carte d'annonce (pages de recherche) et sur les pages détaillées des plateformes immobilières (**LeBonCoin**, **Figaro Immobilier**).
- **Pré-extraction intelligente** : Capture en temps réel du titre, prix, surface, pièces, photos et URL sans dépendre uniquement des requêtes serveurs.
- **Stockage sécurisé** : L'URL de votre serveur et votre clé d'API (Bearer Token) sont conservées dans le stockage local sécurisé du navigateur (`browser.storage.local`).
- **Popup de contrôle** : Interface claire dans la barre d'outils pour tester la connexion, configurer vos accès et ajouter l'onglet actif en un clic.

---

## 🚀 Installation & Développement

### Dépendances

```bash
npm install
```

### Compilation

- **Pour Firefox** :
  ```bash
  npm run build:firefox
  ```
  Le dossier compilé sera disponible dans `dist-firefox/`.

- **Pour Chrome & Edge** :
  ```bash
  npm run build:chrome
  ```
  Le dossier compilé sera disponible dans `dist-chrome/`.

---

## 🦊 Charger l'extension dans Firefox (Développement)

1. Ouvrez Firefox et accédez à `about:debugging#/runtime/this-firefox`.
2. Cliquez sur **"Charger un module d'extension temporaire..."**.
3. Sélectionnez le fichier `manifest.json` dans le dossier `dist-firefox/`.

---

## 🌐 Charger l'extension dans Chrome / Edge (Développement)

1. Ouvrez Chrome/Edge et accédez à `chrome://extensions` ou `edge://extensions`.
2. Activez le **Mode développeur** (interrupteur en haut à droite).
3. Cliquez sur **"Charger l'extension non paquetée"** (*Load unpacked*).
4. Sélectionnez le dossier `dist-chrome/`.

---

## 🔐 Sécurité

L'extension utilise des clés d'API (tokens d'accès individuels) générées dans l'interface Immo-Boussole. Les identifiants ne sont transmis qu'à votre propre instance via des canaux HTTPS sécurisés.
