import type { Context } from '@netlify/functions';

declare const Netlify: { env: { get(key: string): string | undefined } };

const recentRequests = new Map<string, number[]>();

function response(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' }
  });
}

function text(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}

export default async function contact(req: Request, context: Context) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return response({ error: 'method_not_allowed' }, 405);

  const ip = String(context.ip || req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const active = (recentRequests.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (active.length >= 5) return response({ error: 'rate_limited' }, 429);
  active.push(now);
  recentRequests.set(ip, active);

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  if (text(body.website, 120)) return response({ error: 'invalid_submission' }, 400);

  const payload = {
    name: text(body.name, 120),
    business_name: text(body.business, 160),
    business_activity: text(body.businessType, 120),
    process_to_improve: text(body.process, 600),
    current_tool: text(body.currentTool, 160),
    contact_method: text(body.contactMethod, 160),
    contact_value: text(body.contactValue || body.contactMethod, 160),
    message: text(body.description, 2000),
    source: 'abdullah-website',
    status: 'new'
  };

  if (payload.name.length < 2 || payload.business_activity.length < 2 || payload.process_to_improve.length < 4 || payload.contact_value.length < 3 || payload.message.length < 4) {
    return response({ error: 'validation_error' }, 400);
  }

  const supabaseUrl = String(Netlify.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
  const supabaseAnonKey = String(Netlify.env.get('SUPABASE_ANON_KEY') || '');
  if (!supabaseUrl || !supabaseAnonKey) return response({ error: 'not_configured' }, 503);

  try {
    const result = await fetch(`${supabaseUrl}/rest/v1/contact_submissions`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!result.ok) return response({ error: 'database_error' }, 502);
    return response({ ok: true }, 201);
  } catch {
    return response({ error: 'network_error' }, 502);
  }
}

export const config = { path: '/api/contact' };
