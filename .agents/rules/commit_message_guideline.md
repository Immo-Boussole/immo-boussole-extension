# Commit Message Guidelines (WebExtension)

Every commit must follow the [Conventional Commits](https://www.conventionalcommits.org/) format in **English**.

## Format

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

## Types

- `feat`: A new user-facing feature or enhancement (e.g. `feat(leboncoin): support new layout selector`)
- `fix`: A bug fix (e.g. `fix(popup): handle 401 token authentication errors`)
- `docs`: Documentation changes (`README.md`, `TRANSLATING.md`, `PRIVACY.md`)
- `style`: Code style changes (formatting, whitespace, semi-colons)
- `refactor`: Code refactoring without behavioral changes
- `test`: Adding or updating tests
- `chore`: Maintenance, dependencies (`package.json`, Vite configs)
- `i18n`: Translations and localization string updates

## Rules

1. Use imperative mood in the subject line ("add", "fix", "update", not "added", "fixed").
2. Limit the first line to 72 characters.
3. Language must be **English**.
