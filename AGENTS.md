# General Guidelines for AI Agents (Immo-Boussole WebExtension)

This document centralizes all mandatory rules and best practices for any AI agent working on this repository (`immo-boussole-extension`).

---

## 1. Extension Architecture & Cross-Browser Standards

- **Manifest V3**: Target native Manifest V3 for Firefox, Google Chrome, and Microsoft Edge.
- **Polyfill**: Use `webextension-polyfill` for cross-browser unified async API calls (`browser.*`).
- **Target Portals**: Real estate listings on LeBonCoin (`leboncoin.fr`), Figaro Immobilier (`immobilier.lefigaro.fr`), and future supported platforms.
- **DOM Injections**: Inject non-intrusive action buttons (*"🧭 Add to Immo-Boussole"*) on listing search cards and property detail pages.
- **Dual Build**: Maintain compatibility with `npm run build:firefox` (outputs `dist-firefox/`) and `npm run build:chrome` (outputs `dist-chrome/`).

---

## 2. Responsive Design & Multi-Device Compatibility

- **Popup Layout**: Ensure the extension popup renders cleanly across standard browser popup dimensions (width: 320px–380px, height auto/fluid).
- **Buttons & Injected UI**: Ensure injected buttons adapt seamlessly to responsive portal layouts (desktop and mobile viewports) without breaking portal DOM flows.

---

## 3. Security & Credentials Protection

- **Safe Storage**: Instance server URL and Bearer API Token are strictly preserved in browser-isolated local storage (`browser.storage.local`).
- **Zero Leakage**: Tokens and credentials must never be logged to the browser console, exposed in DOM attributes, or sent to unauthorized endpoints.
- **Strict Origin Communication**: Extension interacts exclusively with the configured Immo-Boussole server instance via authenticated REST API calls.

---

## 4. Git Commit Message Format

- Always provide a concise, clear Git commit message in **English** adhering to the **Conventional Commits** standard (`feat(...)`, `fix(...)`, `docs(...)`, `i18n(...)`, `chore(...)`).
- **Detailed Reference**: See [.agents/rules/commit_message_guideline.md](.agents/rules/commit_message_guideline.md).

---

## 5. Documentation, Internationalization (i18n) & Cross-Repository Parity

- **English First & French Parity**: Write user-facing documentation in English first (`README.md`, `PRIVACY.md`, `TERMS.md`), and maintain exact parity in French (`README.fr.md`, `PRIVACY.fr.md`, `TERMS.fr.md`) in the same task/commit.
- **Localization Files**: Maintain translation strings in `_locales/en/messages.json` and `_locales/fr/messages.json`.
- **Cross-Repo Ecosystem**: Keep references, navigation banners, and GitHub links aligned across all repositories (`immo-boussole`, `immo-boussole-extension`, `immo-boussole-orchestrator`, `immo-boussole.wiki`).
- **Organization Namespace**: Always use `https://github.com/Immo-Boussole/<repo>`.
- **Text & Structure**: Focus on text, tables, and diagrams; do not spend time generating new screenshots unless requested.
- **Detailed Reference**: See [.agents/rules/documentation_and_i18n.md](.agents/rules/documentation_and_i18n.md).

---

## 6. Store Publishing & Release Safety

- Store secrets and credentials (API keys for Chrome Web Store, Mozilla AMO, Edge Add-ons) must remain exclusively in GitHub Repository Secrets.
- Document any new permission additions in `docs/STORE_PUBLISHING_SETUP.md` and both privacy policy documents.

---

## 7. GitHub Workflow Verification on Pushes & Pull Requests

- **Mandatory Workflow Monitoring**: After pushing code or creating/updating pull requests, always check the status of all triggered GitHub Actions workflows using `gh run list` / `gh run view` / `gh pr checks`.
- **Zero Failure Tolerance**: Never mark a task complete if any workflow job fails (CI, package builds, publishing, lints, automated tests).
- **Immediate Failure Resolution**: Inspect failure logs (`gh run view <run-id> --log-failed`), diagnose the root cause, apply fixes, commit and push, and monitor until all workflows are 100% green.
- **Detailed Reference**: See [.agents/rules/github_workflow_verification.md](.agents/rules/github_workflow_verification.md).

---

## 8. Response Formatting & Step Progress Tracking

- **Standardized Step Headers**: Every multi-step response or status update must begin with a Level 3 heading adhering to `### [X/Y] [EMOJI] [Descriptive Step Title]` (single square bracket pair around the fraction, e.g. `### [1/5] ...`, never double brackets like `[[1]/[5]]`).
- **Technology & Action Emojis**: Always prefix step titles with the corresponding Unicode emoji (e.g. 🐍 Python, 🧪 Tests, 🐳 Docker, 🐙 GitHub, ⚙️ CI/CD, 🧩 WebExtension, 🌐 Frontend/Web, 🔍 Research, 📝 Docs/i18n, 🚀 Deploy/Release, 🛡️ Security, 🧭 Immo-Boussole Domain).
- **Detailed Reference**: See [.agents/rules/step_progress_and_formatting.md](.agents/rules/step_progress_and_formatting.md).
