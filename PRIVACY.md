# Privacy Policy for Immo-Boussole WebExtension

**Last updated:** August 23, 2026

**Immo-Boussole** ("the Extension") is an open-source browser companion extension developed for the Immo-Boussole real estate platform.

We believe strongly in user privacy, transparency, and data ownership. This Privacy Policy outlines what data is processed, how it is handled, and your rights.

---

## 1. Zero Data Collection & Tracking

- **No Analytics / Telemetry**: The Extension contains no trackers, telemetry, analytics SDKs, or third-party tracking scripts.
- **No Remote Profiling**: We do not collect, monitor, track, sell, or rent any of your personal information, browsing habits, search queries, or real estate preferences.

---

## 2. Data Storage & Local Isolation

- **Local Storage (`browser.storage.local`)**:
  - Your configured **Server URL** (e.g., `https://your-instance.com`) and **API Bearer Token** are stored strictly inside your browser's private local storage.
  - This data never leaves your device unless making authorized requests to your own configured server.
  - You can erase this data at any time by clearing the extension storage or uninstalling the extension.

---

## 3. Network Communications & Data Transfer

- **Direct Self-Hosted Communication**: All network requests initiated by the Extension (e.g. checking listing existence, submitting a new property) are sent **directly and exclusively** to your configured Immo-Boussole server instance.
- **No Intermediary Proxies**: The extension developers have no access to your API requests, your property database, or your server logs.

---

## 4. Permissions Justification

The Extension requests only the minimum permissions necessary to function:

- **`activeTab` / `tabs`**: Used solely to inspect the current real estate listing URL and DOM when you click the extension button or view a supported portal.
- **`storage`**: Used exclusively to persist your server instance URL and authentication credentials locally.
- **`scripting`**: Used to display action buttons (e.g. *"🧭 Add to Immo-Boussole"*) directly on supported property portals.

---

## 5. Contact & Open Source

This project is open-source under the MIT License. You can review the full source code and verify our privacy guarantees at:
- **Repository**: [https://github.com/Immo-Boussole/immo-boussole-extension](https://github.com/Immo-Boussole/immo-boussole-extension)
- **Issues & Inquiries**: [https://github.com/Immo-Boussole/immo-boussole-extension/issues](https://github.com/Immo-Boussole/immo-boussole-extension/issues)
