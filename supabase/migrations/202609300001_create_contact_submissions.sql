-- Incoming business/project inquiries for the public Abdullah website.
-- Apply with `supabase db push` or the Supabase CLI migration workflow.

create extension if not exists pgcrypto;

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  business_name text check (business_name is null or char_length(business_name) <= 160),
  business_activity text check (business_activity is null or char_length(business_activity) <= 120),
  process_to_improve text check (process_to_improve is null or char_length(process_to_improve) <= 600),
  current_tool text check (current_tool is null or char_length(current_tool) <= 160),
  contact_method text check (contact_method is null or char_length(contact_method) <= 160),
  contact_value text not null check (char_length(contact_value) between 3 and 160),
  message text check (message is null or char_length(message) <= 2000),
  source text not null default 'abdullah-website' check (source = 'abdullah-website'),
  status text not null default 'new' check (status in ('new', 'reviewing', 'contacted', 'qualified', 'in_progress', 'completed', 'archived'))
);

create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx on public.contact_submissions (status);

alter table public.contact_submissions enable row level security;

revoke all on table public.contact_submissions from public;
grant usage on schema public to anon, authenticated;
grant insert on table public.contact_submissions to anon, authenticated;

-- Visitors may create a new inquiry, but cannot read, update, or delete submissions.
drop policy if exists "Public visitors can submit inquiries" on public.contact_submissions;
create policy "Public visitors can submit inquiries"
on public.contact_submissions
for insert
to anon, authenticated
with check (status = 'new' and source = 'abdullah-website');

-- No SELECT/UPDATE/DELETE policies are intentionally created for public roles.
