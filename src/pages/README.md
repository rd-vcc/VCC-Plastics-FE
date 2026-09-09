# Page structure and translations

Each UI page owns a folder with the same name as the page component:

```text
PageName/
├── PageName.jsx
└── locales.js
```

- `PageName.jsx` contains the page UI and imports `./locales`.
- `locales.js` contains Vietnamese, English, and Japanese translations that belong only to that page.
- `src/i18n/locales` is reserved for shared system translations such as navigation, common controls, languages, and shared placeholders.
- Shared/system components remain outside this page-folder convention.

When implementing a placeholder page, add its page-specific text to that page's `locales.js` instead of adding it to the global locale files.
