# Architecture Decision Record

## Current stack

- **Frontend:** standalone semantic `index.html`, Tailwind CSS CDN, Font Awesome CDN, Cairo Google Font, vanilla JavaScript.
- **Application/data layer:** one Netlify TypeScript Function at `netlify/functions/contact.mts`, exposed at `/api/contact`.
- **Database:** Supabase PostgreSQL, recreated by the migration under `supabase/migrations/`.
- **Version control:** GitHub repository selected by the owner; the local history starts at commit `7537174`.
- **Deployment target:** Netlify, with GitHub-connected deploys and Preview/Production environments.

## Chosen architecture

```text
Visitor browser
  -> Arabic RTL static frontend
  -> Netlify Function /api/contact: validation + anti-spam boundary
  -> Supabase REST insert using the public anon key
  -> PostgreSQL contact_submissions table protected by RLS
```

The function uses the Supabase anon key, not a service-role key. Database permissions and the insert policy remain the final data boundary. The browser never receives database credentials or provider error details.

## Why Supabase is used

The website needs one durable destination for legitimate business inquiries. Supabase provides PostgreSQL, migration history, RLS, and a future path to a private authenticated admin interface without adding authentication today.

## Database design

The smallest useful entity is `contact_submissions`, not an RFQ or business-management table. It stores only the inquiry fields the existing form collects, plus timestamps, a fixed source, and a controlled status. Indexes exist only for the likely future admin queries: newest submissions and status filtering.

Allowed statuses: `new`, `reviewing`, `contacted`, `qualified`, `in_progress`, `completed`, `archived`.

## Security model

- RLS is enabled.
- Public roles receive INSERT only.
- There are no public SELECT, UPDATE, or DELETE policies.
- Database length checks, fixed source/status checks, and required-field checks protect integrity.
- The Function validates and bounds strings, strips control characters, rejects a honeypot, applies a best-effort per-IP in-memory rate limit, and returns generic errors through the frontend.
- No authentication, admin URL, analytics, payment, or service-role key is included.

## Environment model

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are server-side Netlify environment variables for Development, Deploy Preview, and Production. `.env.example` documents names only; no real credentials are present in this repository.

## Deployment model

The intended flow is GitHub → Netlify → Deploy Preview/Production. `netlify.toml` publishes the repository root and discovers `netlify/functions`. Netlify environment variables must be configured separately per context. Production deployment is not claimed until a real Preview and end-to-end submission are verified.

## Future expansion path

A future private admin interface can use Supabase Auth and authenticated RLS policies. Lead management, notifications, WhatsApp API integration, appointments, and analytics remain separate future decisions.

## Intentionally not implemented

- No authentication or admin dashboard.
- No Supabase Edge Function; the single Netlify Function is sufficient for the current submission path.
- No email provider or transactional email claim.
- No WhatsApp API; the existing WhatsApp placeholder remains a separate continuation channel.
- No storage, analytics, payments, CRM, or domain configuration.
