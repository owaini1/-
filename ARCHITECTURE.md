# Architecture Decision Record

## Current stack

- **Frontend:** standalone semantic `index.html`, Tailwind CSS CDN, Font Awesome CDN, Cairo Google Font, vanilla JavaScript.
- **Application/data layer:** one Vercel-compatible serverless endpoint at `api/contact.js`.
- **Database:** Supabase PostgreSQL, recreated by the migration under `supabase/migrations/`.
- **Version control:** the current project’s managed Git repository; GitHub has not been connected from this session.
- **Deployment target:** Vercel is the intended target for the static page plus `/api/contact` function, but no Vercel project has been connected or deployed.

## Chosen architecture

```text
Visitor browser
  -> Arabic RTL static frontend
  -> /api/contact serverless validation + anti-spam boundary
  -> Supabase REST insert using the public anon key
  -> PostgreSQL contact_submissions table protected by RLS
```

The endpoint uses the Supabase anon key, not a service-role key. Database permissions and the insert policy remain the final data boundary. The browser never receives database credentials or provider error details.

## Why Supabase is used

The website needs one durable destination for legitimate business inquiries. Supabase provides PostgreSQL, migration history, RLS, and a future path to a private authenticated admin interface without adding an application server or authentication today.

## Database design

The smallest useful entity is `contact_submissions`, not an RFQ or business-management table. It stores only the inquiry fields the existing form collects, plus timestamps, a fixed source, and a controlled status. Indexes exist only for the likely future admin queries: newest submissions and status filtering.

Allowed statuses: `new`, `reviewing`, `contacted`, `qualified`, `in_progress`, `completed`, `archived`.

## Security model

- RLS is enabled.
- Public roles receive INSERT only.
- There are no public SELECT, UPDATE, or DELETE policies.
- Database length checks, fixed source/status checks, and required-field checks protect integrity.
- The endpoint validates and bounds strings, strips control characters, rejects a honeypot, applies a best-effort per-IP in-memory rate limit, and returns generic Arabic UI errors through the frontend.
- The current rate limiter is intentionally lightweight and instance-local; a stronger shared limiter can be added if abuse volume justifies it.
- No authentication, admin URL, analytics, payment, or service-role key is included.

## Environment model

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are server-side environment variables for the Vercel function. Configure separate Development, Preview, and Production values in Vercel. `.env.example` documents names only; no real credentials are present in this repository.

## Deployment model

The intended flow is GitHub → Vercel → Preview/Production. The current repository is still the managed Web Dev repository and no GitHub or Vercel access was available in this session, so no external deployment is claimed. Vercel automatically serves the static root and recognizes `api/contact.js` as a function.

## Future expansion path

A future private admin interface can use Supabase Auth and authenticated RLS policies. Lead management, notifications, WhatsApp API integration, appointments, and analytics remain separate future decisions.

## Intentionally not implemented

- No authentication or admin dashboard.
- No Edge Function; the single Vercel function is sufficient for the current submission path.
- No email provider or transactional email claim.
- No WhatsApp API; the existing WhatsApp placeholder remains a separate continuation channel.
- No storage, analytics, payments, CRM, or domain configuration.
- No production database or deployment connection without owner-provided credentials.
