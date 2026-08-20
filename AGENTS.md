# AGENTS.md - Immo-Boussole WebExtension

Guidelines for AI agents working on this browser extension repository.

## 1. Extension Architecture & Cross-Browser Standards

- **Manifest V3**: Native Manifest V3 target for Firefox, Chrome, and Edge.
- **Polyfill**: Use `webextension-polyfill` for unified API calls (`browser.*`).
- **Target Sites**: LeBonCoin (`leboncoin.fr`), Figaro Immobilier (`immobilier.lefigaro.fr`).
- **UI & Injections**: Content script buttons on listing cards & detail pages, Popup UI for extension settings & manual URL submit.

## 2. Security & Credentials

- User credentials/API Key and Server URL are stored locally in `browser.storage.local`.
- Sensitive tokens must never be logged or exposed in client DOM attributes.

## 3. Git Commit Message Format

- Conventional Commits in **English** (e.g., `feat: ...`, `fix: ...`, `docs: ...`).
