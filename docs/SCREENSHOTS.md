# SWAR AI Screenshots

Screenshots captured from the local development build on **November 24, 2026**.

- **Tool:** Puppeteer Core + Microsoft Edge (headless)
- **Desktop viewport:** 1440x900
- **Mobile viewport:** 390x844 (device scale 2)
- **App URL:** `http://localhost:5173`
- **Note:** `/profile` and `/dashboard` are protected routes. Without an authenticated session, the app correctly redirects to `/auth`; screenshots capture this real behavior.

## Desktop

### 01. Homepage
![Homepage](screenshots/desktop/01-homepage.png)
- **Route:** `/`
- **Description:** Marketing homepage introducing SWAR AI, voice-first multilingual positioning, hero CTA, and product sections.
- **Main elements:** Navbar, hero section with `SwarAICircle`, CTA buttons, feature/marketing sections, footer.

### 02. AI Assistant
![AI Assistant](screenshots/desktop/02-ai-assistant.png)
- **Route:** `/assistant`
- **Description:** Main assistant interface for text/voice interaction.
- **Main elements:** Assistant orb/circle area, status bar, chat panel, microphone control, text input, settings/language controls.

### 03. Assistant Chat Input
![Assistant Chat Input](screenshots/desktop/03-chat-input.png)
- **Route:** `/assistant`
- **Description:** Assistant page with text input focused/ready for user message.
- **Main elements:** Chat input, send/control area, assistant conversation UI.

### 04. Language Selector
![Language Selector](screenshots/desktop/04-language-selector.png)
- **Route:** `/assistant`
- **Description:** Language selection UI on assistant experience.
- **Main elements:** Language selector control and assistant interface.

### 05. Assistant Settings
![Assistant Settings](screenshots/desktop/05-assistant-settings.png)
- **Route:** `/assistant`
- **Description:** Assistant settings panel/state.
- **Main elements:** Settings controls for assistant preferences.

### 06. Login
![Login](screenshots/desktop/06-login.png)
- **Route:** `/auth`
- **Description:** Authentication page with sign-in form and auth options.
- **Main elements:** Email/password fields, sign-in action, Google sign-in button, forgot password/create account links, `SwarAICircle` visual.

### 07. Registration
![Registration](screenshots/desktop/07-registration.png)
- **Route:** `/auth` (signup mode)
- **Description:** Account creation state in authentication UI.
- **Main elements:** Name/email/password inputs, create account action, auth navigation.

### 08. Forgot Password
![Forgot Password](screenshots/desktop/08-forgot-password.png)
- **Route:** `/auth` (reset mode)
- **Description:** Password reset request state.
- **Main elements:** Email input, reset action, navigation back to sign-in.

### 09. Profile Route (Redirect Behavior)
![Profile Redirect](screenshots/desktop/09-profile-or-auth-redirect.png)
- **Route:** `/profile` (protected)
- **Description:** Real behavior when unauthenticated: route redirects to auth page.
- **Main elements:** Auth page shown after protected-route redirect.

### 10. Dashboard Route (Redirect Behavior)
![Dashboard Redirect](screenshots/desktop/10-dashboard-or-auth-redirect.png)
- **Route:** `/dashboard` (protected)
- **Description:** Real behavior when unauthenticated: route redirects to auth page.
- **Main elements:** Auth page shown after protected-route redirect.

## Mobile

### 01. Homepage (Mobile)
![Homepage Mobile](screenshots/mobile/01-homepage-mobile.png)
- **Route:** `/`
- **Description:** Mobile responsive homepage layout.

### 02. AI Assistant (Mobile)
![AI Assistant Mobile](screenshots/mobile/02-ai-assistant-mobile.png)
- **Route:** `/assistant`
- **Description:** Mobile assistant interface.

### 03. Login (Mobile)
![Login Mobile](screenshots/mobile/03-login-mobile.png)
- **Route:** `/auth`
- **Description:** Mobile login/auth layout.

### 04. Registration (Mobile)
![Registration Mobile](screenshots/mobile/04-registration-mobile.png)
- **Route:** `/auth` (signup mode)
- **Description:** Mobile registration state.

### 05. Assistant Settings (Mobile)
![Assistant Settings Mobile](screenshots/mobile/05-assistant-settings-mobile.png)
- **Route:** `/assistant`
- **Description:** Mobile assistant settings state.
