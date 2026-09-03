# JavaScript conversion

This project has been converted from TypeScript React to JavaScript React.

## Main changes

- `src/**/*.tsx` -> `src/**/*.jsx`
- `src/**/*.ts` -> `src/**/*.js`
- `vite.config.ts` -> `vite.config.js`
- Removed TypeScript declaration files and `tsconfig*` files.
- Removed TypeScript/type-only dev dependencies from `package.json`.
- `npm run build` now runs `vite build` directly.
- ESLint now targets `.js` and `.jsx` files.
- `index.html` now loads `/src/main.jsx`.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
