# Temporary Login

This project currently uses a frontend-only temporary login while the authentication API is not connected.

- Username: `1`
- Password: `1`
- Session storage key: `vcc_plastics_authenticated`

Important files:

- `src/auth/auth.js`: temporary authentication helpers.
- `src/auth/ProtectedRoute.jsx`: protects all application routes.
- `src/pages/Auth/Login.jsx`: login screen.
- `src/components/header/UserDropdown.jsx`: profile/settings/support/sign-out links.
- `src/components/header/NotificationDropdown.jsx`: empty notification state.

When the API is available, replace the temporary credential check in `src/auth/auth.js` with the real authentication flow.
- 2026-08-27: Compact UI pass: global 14px root scale, reduced theme typography, sidebar 252px/72px, denser menu rows/icons/header/content spacing.
