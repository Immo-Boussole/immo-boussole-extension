# Politique de Confidentialité — Extension Immo-Boussole

**Dernière mise à jour :** 23 août 2026

**Immo-Boussole** (« l'Extension ») est une extension de navigateur open-source conçue pour interagir avec l'application Immo-Boussole.

La protection de vos données personnelles, la souveraineté de vos informations et la transparence sont nos priorités fondamentales. Cette politique de confidentialité détaille le traitement des données lors de l'utilisation de l'Extension.

---

## 1. Aucune Collecte de Données & Aucun Pistage

- **Zéro Télémétrie / Analytics** : L'Extension n'intègre aucun traceur, aucun outil d'analyse comportementale, ni aucun script tiers de mesure d'audience.
- **Aucun Profilage** : Nous ne collectons, ne surveillons, ne vendons et ne partageons aucune de vos données personnelles, historiques de navigation, requêtes de recherche ou critères immobiliers.

---

## 2. Stockage Local & Isolation des Données

- **Stockage Local du Navigateur (`browser.storage.local`)** :
  - L'**URL de votre serveur** (ex: `https://votre-instance.fr`) et votre **Clé d'API Bearer Token** sont enregistrées de façon strictement locale et chiffrée/isolée dans l'espace de votre navigateur.
  - Ces informations ne quittent jamais votre terminal, si ce n'est pour communiquer directement avec votre propre serveur lors de vos demandes d'import.
  - Vous pouvez supprimer ces informations à tout moment en réinitialisant la configuration ou en désinstallant l'extension.

---

## 3. Communications Réseau & Transfert Direct

- **Communication Directe avec votre Instance Privée** : Toutes les requêtes HTTP (vérification de doublon, import d'une nouvelle annonce) sont envoyées **directement et exclusivement** à l'instance Immo-Boussole que vous avez vous-même configurée.
- **Aucun Serveur Intermédiaire** : Les créateurs de l'extension n'ont aucun accès à vos requêtes, à votre base de données immobilière ou à vos journaux de connexion.

---

## 4. Justification des Permissions Requises

L'Extension ne requiert que les autorisations strictement indispensables à son fonctionnement :

- **`activeTab` / `tabs`** : Utilisé uniquement pour lire l'URL et les données publiques de l'annonce immobilière active lorsque vous cliquez sur l'icône de l'extension ou naviguez sur un portail pris en charge.
- **`storage`** : Utilisé exclusivement pour sauvegarder localement vos paramètres de connexion serveur.
- **`scripting`** : Utilisé pour injecter les boutons d'action (ex: *« 🧭 Ajouter à Immo-Boussole »*) sur les cartes des portails immobiliers supportés.

---

## 5. Code Source Ouvert & Contact

Le projet est entièrement open-source sous licence MIT. Vous pouvez consulter, vérifier et auditer l'intégralité du code source à l'adresse suivante :
- **Dépôt GitHub** : [https://github.com/Immo-Boussole/immo-boussole-extension](https://github.com/Immo-Boussole/immo-boussole-extension)
- **Signalement & Questions** : [https://github.com/Immo-Boussole/immo-boussole-extension/issues](https://github.com/Immo-Boussole/immo-boussole-extension/issues)
