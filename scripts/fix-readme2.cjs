const fs = require('fs');
let s = fs.readFileSync('README.md', 'utf8');
// Replace the old firebase config block remnants if any - be careful to only replace the old section
s = s.replace(/Create a Firebase project and enable \*\*Google\*\*, \*\*Email\/Password\*\*, and \*\*Phone\*\* sign-in methods\. Add your web app config:\n\n```env\nVITE_FIREBASE_API_KEY=\.\.\.\nVITE_FIREBASE_AUTH_DOMAIN=\.\.\.\nVITE_FIREBASE_PROJECT_ID=\.\.\.\nVITE_FIREBASE_STORAGE_BUCKET=\.\.\.\nVITE_FIREBASE_MESSAGING_SENDER_ID=\.\.\.\nVITE_FIREBASE_APP_ID=\.\.\.\n```\n\nFor Phone OTP, configure Firebase Phone Auth and authorized domains\. reCAPTCHA is handled by Firebase \(`RecaptchaVerifier`\)\.\n\n> If Firebase is not configured, the app still works in \*\*guest mode\*\*; auth screens show a clear configuration notice instead of faking login\./,
`Create a Supabase project and enable **Email** (and optionally Google) in Authentication > Providers. Add your project config:

\`\`\`env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_anon_key
\`\`\`

Add redirect URLs in Supabase Authentication > URL Configuration. Apply \`supabase/schema.sql\` for profiles/conversations/memory/usage tables and RLS.

> If Supabase is not configured, the app still works in **guest mode**; auth screens show a clear configuration notice instead of faking login.`);
fs.writeFileSync('README.md', s);
console.log('ok');