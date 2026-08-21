# Contributing Translations to Immo-Boussole Extension

We welcome community translations! The Immo-Boussole browser extension supports all languages through standard WebExtension `_locales/` architecture.

---

## 🌍 How to Add a New Language

1. **Fork and Clone** the repository:
   ```bash
   git clone https://github.com/wikijm/immo-boussole-extension.git
   cd immo-boussole-extension
   ```

2. **Create a New Locale Directory**:
   Use the standard [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) (e.g., `de` for German, `es` for Spanish, `it` for Italian, `nl` for Dutch):
   ```bash
   mkdir _locales/<your_language_code>
   ```

3. **Copy the Reference Template**:
   Copy `_locales/en/messages.json` into your new folder:
   ```bash
   cp _locales/en/messages.json _locales/<your_language_code>/messages.json
   ```

4. **Translate the Strings**:
   Edit `_locales/<your_language_code>/messages.json` and translate each `"message"` value into your target language.
   *Do not modify the key names.*

   Example:
   ```json
   {
     "extensionName": {
       "message": "Immo-Boussole Erweiterung",
       "description": "The name of the extension"
     },
     "btnAddToImmoBoussole": {
       "message": "🧭 Zu Immo-Boussole hinzufügen",
       "description": "Button injected on listing detail page"
     }
   }
   ```

5. **Test Your Translation Locally**:
   ```bash
   npm install
   npm run build:firefox
   ```
   Load the temporary extension in Firefox or Chrome/Edge and verify that it matches your browser's language setting.

6. **Submit a Pull Request**:
   Create a branch and open a PR on GitHub with a clear title like:
   `i18n: add German (de) translation`

---

Thank you for helping make Immo-Boussole accessible worldwide! 🚀
