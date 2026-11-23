const fs = require('fs');
let s = fs.readFileSync('README.md', 'utf8');
s = s.replace('- **Auth**: Firebase Authentication (Google, Email/Password, Phone OTP)', '- **Auth**: Supabase Authentication (Email/Password, Google OAuth, password reset, email verification, persistent sessions)');
s = s.replace('services/                # aiAssistant, speechRecognition, speechSynthesis, languageDetection, firebase', 'services/                # aiAssistant, speechRecognition, speechSynthesis, languageDetection, supabase, supabaseAuth, dataStore');
s = s.replace(/### 3\) Configure Firebase Auth[\s\S]*?### 4\) Run development server/, `### 3) Configure Supabase Auth

Create a Supabase project and in Dashboard > Authentication > Providers enable **Email** (and optionally Google). Copy your Project URL and Publishable/anon key:

\`\`\`env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key
\`\`\`

In Authentication > URL Configuration, add redirect URLs such as \`http://localhost:5173/auth\`, \`http://localhost:5173/assistant\`, and your production URLs. Apply \`supabase/schema.sql\` in SQL Editor for profiles/conversations/memory/usage tables and RLS.

> If Supabase is not configured, the app still works in **guest mode**; auth screens show a clear configuration notice instead of faking login. Never use the \`service_role\` key in frontend code.

### 4) Run development server`);
s = s.replace('- API keys are read from environment variables; frontend only uses Firebase public web config.', '- API keys are read from environment variables; frontend only uses Supabase publishable/anon key (never service_role).');
s = s.replace('8. Phone OTP auth (Firebase-configured).\n9. Email auth + reset/verification (Firebase-configured).\n10. Google auth (Firebase-configured).', '8. Email auth + password reset + email verification (Supabase).\n9. Google OAuth (Supabase-configured).\n10. Persistent Supabase sessions and protected routes.');
fs.writeFileSync('README.md', s);
console.log('ok');