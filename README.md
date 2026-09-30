# Abdullah Alowaini Website

Arabic RTL personal service website for Abdullah Alowaini — automation, AI, and practical digital solutions.

## Stack

- Standalone HTML/CSS/vanilla JavaScript frontend
- Tailwind CSS, Cairo, and Font Awesome via CDN
- Netlify TypeScript Function at `/api/contact`
- Supabase PostgreSQL with version-controlled RLS migration

## Local setup

The static page can be previewed directly:

```bash
python3 -m http.server 3000
```

For the complete frontend + Function flow, use the Netlify CLI:

```bash
npx netlify dev
```

Without configured environment variables, the Function returns a safe configuration error; the UI does not show a fake success.

## Environment variables

Copy `.env.example` to `.env` only for local Netlify development, or configure the same names separately in Netlify Development, Deploy Preview, and Production:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Never use a service-role key in browser code or commit real credentials.

## Supabase setup

1. Select the intended Supabase project.
2. Apply `supabase/migrations/202609300001_create_contact_submissions.sql` with the Supabase migration workflow.
3. Confirm RLS is enabled and public roles have INSERT only.
4. Keep development/preview data separate from production when practical.

## Development and migration workflow

```bash
supabase db push
```

The repository does not include the Supabase CLI; install it using the official Supabase instructions if needed.

## Netlify deployment

There is no frontend build step. `netlify.toml` publishes the repository root and discovers `netlify/functions`. Connect the GitHub repository to Netlify, then set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in each appropriate Netlify environment context. Use Deploy Preview before Production.

## Contact flow

1. Browser validation and honeypot check.
2. POST to `/api/contact`.
3. Netlify server-side validation and best-effort rate limit.
4. Supabase insert into `contact_submissions`.
5. Success UI only after a 2xx response.
6. WhatsApp remains a separate optional continuation and keeps its existing placeholder.

## Security notes

RLS prevents public reads/updates/deletes. The public Function returns generic errors and does not expose database details. The in-memory rate limit is not a substitute for a shared edge limiter if traffic grows. Do not collect sensitive customer information in the current form.
