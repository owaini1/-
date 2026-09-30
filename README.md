# Abdullah Alowaini Website

Arabic RTL personal service website for Abdullah Alowaini — automation, AI, and practical digital solutions.

## Stack

- Standalone HTML/CSS/vanilla JavaScript frontend
- Tailwind CSS, Cairo, and Font Awesome via CDN
- Vercel-compatible `api/contact.js` serverless endpoint
- Supabase PostgreSQL with version-controlled RLS migration

## Local setup

The frontend can be previewed directly:

```bash
python3 -m http.server 3000
```

The contact endpoint requires a Vercel-compatible function runtime to submit data. Without configured environment variables it returns a safe configuration error; the UI does not show a fake success.

## Environment variables

Copy `.env.example` to `.env` only for a local function runtime, or configure the same names separately in Vercel Development, Preview, and Production:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Never use a service-role key in browser code or commit real credentials.

## Supabase setup

1. Create a Supabase project.
2. Apply `supabase/migrations/202609300001_create_contact_submissions.sql` with the Supabase CLI or SQL migration workflow.
3. Confirm RLS is enabled and that public roles have INSERT only.
4. Keep development/preview data separate from production when practical.

## Development and migration workflow

```bash
supabase start
supabase db reset
supabase db push
```

The repository does not include the Supabase CLI; install it using the official Supabase instructions if needed.

## Build and deployment

There is no frontend build step. Vercel serves `index.html` as a static page and `api/contact.js` as a serverless function. Connect the repository to Vercel manually, add the environment variables per environment, and use Preview deployments before Production.

GitHub is not connected by this project session. No production URL or successful database insertion is claimed.

## Contact flow

1. Browser validation and honeypot check.
2. POST to `/api/contact`.
3. Server-side validation and best-effort rate limit.
4. Supabase insert into `contact_submissions`.
5. Success UI only after a 2xx response.
6. WhatsApp remains a separate optional continuation and keeps its existing placeholder.

## Security notes

RLS prevents public reads/updates/deletes. The public endpoint returns generic errors and does not expose database details. The in-memory rate limit is not a substitute for a shared edge limiter if traffic grows. Do not collect sensitive customer information in the current form.
