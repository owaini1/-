const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const recentRequests = new Map();

const limits = {
  name: 120,
  business: 160,
  businessType: 120,
  process: 600,
  currentTool: 160,
  contactMethod: 160,
  description: 2000
};

function text(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}

function json(res, status, body) {
  res.status(status).json(body);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const previous = recentRequests.get(ip) || [];
  const active = previous.filter((time) => now - time < WINDOW_MS);
  if (active.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return json(res, 429, { error: 'rate_limited' });
  }
  active.push(now);
  recentRequests.set(ip, active);

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  // Honeypot: bots commonly fill hidden fields; silently reject without touching the database.
  if (text(body.website, 120)) return json(res, 400, { error: 'invalid_submission' });

  const payload = {
    name: text(body.name, limits.name),
    business_name: text(body.business, limits.business),
    business_activity: text(body.businessType, limits.businessType),
    process_to_improve: text(body.process, limits.process),
    current_tool: text(body.currentTool, limits.currentTool),
    contact_method: text(body.contactMethod, limits.contactMethod),
    contact_value: text(body.contactValue || body.contactMethod, limits.contactMethod),
    message: text(body.description, limits.description),
    source: 'abdullah-website',
    status: 'new'
  };

  if (payload.name.length < 2 || payload.business_activity.length < 2 || payload.process_to_improve.length < 4 || payload.contact_value.length < 3 || payload.message.length < 4) {
    return json(res, 400, { error: 'validation_error' });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '');
  if (!supabaseUrl || !supabaseAnonKey) {
    return json(res, 503, { error: 'not_configured' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/contact_submissions`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Do not forward provider/database details to a public visitor.
      return json(res, 502, { error: 'database_error' });
    }
    return json(res, 201, { ok: true });
  } catch {
    return json(res, 502, { error: 'network_error' });
  }
}
