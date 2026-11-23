# SWAR AI

**Your Voice. Your Language. Your AI.**

SWAR AI is a multilingual, voice-first AI assistant designed to make AI accessible to everyone - including people who cannot comfortably read, write, or type. It supports **Telugu (తెలుగు)**, **Hindi (हिन्दी)**, and **English** with a natural female voice experience.

> "SWAR AI — Everyone Deserves to Be Heard."

## What’s Included

- **Marketing + product experience**: landing page and a separate `/assistant` voice app.
- **Multilingual voice assistant**: speech recognition, AI responses, and speech synthesis in `te-IN`, `hi-IN`, `en-IN`.
- **Language system**: centralized i18n, manual selector, auto-detect toggle, language-aware responses/voice.
- **Accessible voice-first UI**: large mic button, clear listening/processing/speaking states, repeat/speak-again, optional text input.
- **Smart suggestions**: contextual suggestion chips returned by the AI.
- **Authentication**: Supabase-backed Email/Password, Google OAuth, password reset, email verification, persistent sessions (gracefully reports when not configured). Guest mode supported for assistant.
- **User settings/profile**: preferred language, speech speed, auto-detect, history toggle, sign out.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, React Router, Framer Motion, Lucide icons
- **Backend**: Node.js, Express (AI chat proxy + static serving)
- **AI**: OpenCode Inference Chat Completions API (configurable via env)
- **Speech**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) + Speech Synthesis (`speechSynthesis`)
- **Auth**: Supabase Authentication (Email/Password, Google OAuth, password reset, email verification, persistent sessions)

## Project Structure

```text
server/
  index.js                 # Express API: /api/health, /api/chat
src/
  components/
    Authentication/        # (auth UI lives in pages/AuthPage for now; extensible)
    Layout/                # Navbar, LanguageSelector, PageShell
    Marketing/             # Hero, Features, HowItWorks, Footer
    Settings/              # (settings integrated in Assistant/Profile)
    VoiceAssistant/        # Orb, Mic button, Conversation, Suggestions, Status
  context/                 # Language, Settings, Auth providers
  i18n/                    # translations.ts
  pages/                   # Home, Assistant, Auth, Profile
  services/                # aiAssistant, speechRecognition, speechSynthesis, languageDetection, supabase, supabaseAuth, dataStore
  styles/                  # global.css
  types/                   # shared types + speech.d.ts
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

#### Required for real AI responses

```env
AI_API_KEY=your_key
AI_API_URL=https://opencode.ai/inference/openai/v1/chat/completions
AI_MODEL=mimo-v2.5-free
```

The backend uses OpenCode Inference chat completions format. Set `AI_API_URL` to `https://opencode.ai/inference/openai/v1/chat/completions` and `AI_MODEL` to a model available in the OpenCode Inference catalog. Do not use the old OpenAI endpoint as a fallback.

#### Required for authentication

Create a Supabase project and enable **Email** (and optionally Google) in Authentication > Providers. Add your project config:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key
```

Add redirect URLs in Supabase Authentication > URL Configuration. Apply `supabase/schema.sql` for profiles/conversations/memory/usage tables and RLS.

> If Supabase is not configured, the app still works in **guest mode**; auth screens show a clear configuration notice instead of faking login.

### 3. Run in development

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001 (Vite proxies `/api`)

### 4. Build for production

```bash
npm run build
npm start
```

`npm start` serves the built client from `dist/` and exposes `/api`.

## Voice & Language Notes

- **Speech Recognition**: uses Web Speech API where available. If unsupported/denied, UI shows a clear message and users can type.
- **Speech Synthesis**: uses browser `speechSynthesis`. The app attempts to pick a female voice matching `te-IN`/`hi-IN`/`en-IN`; if unavailable, it falls back to the closest language voice or browser default and does not claim an unavailable voice is used.
- **Auto language detection**: heuristic detection for Telugu/Devanagari/Latin scripts; manual selector overrides auto-detect.
- **No fake audio visualization**: orb/waveform reacts to real mic analyser during listening and animates by state during processing/speaking.

## Security & Honesty

- No hardcoded OTPs, no fake auth success, no fake AI responses.
- API keys are read from environment variables; frontend only uses Supabase publishable/anon key (never service_role).
- AI is instructed to be honest about unknowns/live info limitations and to provide general health info only (no diagnosis).

## Testing Checklist

Manual scenarios covered by implementation:

1. Telugu voice question -> Telugu reply + TTS.
2. Hindi voice question -> Hindi reply + TTS.
3. English voice question -> English reply + TTS.
4. Switch language during conversation (history preserved).
5. Contextual suggestion chips.
6. Mic permission denial handling.
7. Unsupported speech recognition/TTS fallback messaging.
8. Email auth + password reset + email verification (Supabase).
9. Google OAuth (Supabase-configured).
10. Persistent Supabase sessions and protected routes.
11. Responsive mobile/tablet/desktop layouts.
12. Existing repo functionality preserved (repo was minimal; no prior app logic broken).

## Environment Variables

See `.env.example` for all variables and descriptions.
