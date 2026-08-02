// Edge Function: gemini-chat
// Proxies Gemini calls server-side. Rate-limits each device to 3 msgs/day.
// Devices listed in ADMIN_DEVICE_IDS (comma-separated env var) are unlimited,
// and any device in premium_devices (kept in sync by revenuecat-webhook) is unlimited.

// Support multiple API keys via GEMINI_API_KEYS (comma-separated).
// Falls back to GEMINI_API_KEY for backwards compatibility.
// When a key returns 429, the next key in the list is tried automatically.
const GEMINI_API_KEYS: string[] = (
  Deno.env.get('GEMINI_API_KEYS') ?? Deno.env.get('GEMINI_API_KEY') ?? ''
).split(',').map((k) => k.trim()).filter(Boolean);

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ADMIN_DEVICE_IDS = new Set(
  (Deno.env.get('ADMIN_DEVICE_IDS') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
);

const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const RPC_URL        = `${SUPABASE_URL}/rest/v1/rpc/check_and_increment_chat_usage`;
const PREMIUM_URL    = `${SUPABASE_URL}/rest/v1/premium_devices?device_id=eq.__DEVICE__&active=eq.true&select=device_id`;
const DAILY_LIMIT    = 3;

// Daily free-tier limit is enforced below (DAILY_LIMIT). Flip to true only
// for a temporary promo/testing period.
const UNLIMITED_CHATS_TEMP = false;

async function isPremiumDevice(deviceId: string): Promise<boolean> {
  const res = await fetch(PREMIUM_URL.replace('__DEVICE__', encodeURIComponent(deviceId)), {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) return false;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0;
}

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'content-type, x-device-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS });

  const deviceId = req.headers.get('x-device-id')?.trim();
  if (!deviceId || deviceId.length < 8) return json({ error: 'MISSING_DEVICE_ID' }, 400);

  if (!UNLIMITED_CHATS_TEMP && !ADMIN_DEVICE_IDS.has(deviceId) && !(await isPremiumDevice(deviceId))) {
    const today = new Date().toISOString().slice(0, 10);
    const rpcRes = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify({ p_device_id: deviceId, p_usage_date: today, p_limit: DAILY_LIMIT }),
    });
    if (!rpcRes.ok) { console.error('rpc error', await rpcRes.text()); return json({ error: 'DB_ERROR' }, 500); }
    const allowed = await rpcRes.json();
    if (!allowed) return json({ error: 'DAILY_LIMIT', limit: DAILY_LIMIT }, 429);
  }

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'INVALID_JSON' }, 400); }

  const geminiBody = JSON.stringify({
    systemInstruction: { parts: [{ text: body.systemPrompt }] },
    contents: body.contents,
    // thinkingBudget: 0 (no reasoning) was measured to silently drop one
    // constraint on compound filters (e.g. grade + location combined),
    // recommending ineligible programs. A small budget fixed this consistently.
    // Raised 512 -> 1024 because Advisor mode's constraint-verification step
    // (check every candidate against every stated filter before listing it)
    // needs more room than a single filter pass did.
    //
    // maxOutputTokens is set to gemini-2.5-flash's max (no artificial cap on
    // reply length). The system prompts already tell the model to keep Normal
    // mode answers short (~2-6 sentences) and only let Essay/Resume/Advisor
    // modes run long, so this ceiling is a safety backstop, not the thing
    // actually controlling response length in practice.
    generationConfig: { temperature: 0.3, maxOutputTokens: 65536, thinkingConfig: { thinkingBudget: 1024 } },
  });

  // Try each API key in order. If one is rate-limited or quota-exhausted (429),
  // cancel its body and immediately move to the next key.
  let geminiRes: Response | null = null;
  for (const apiKey of GEMINI_API_KEYS) {
    geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: geminiBody,
    });
    if (geminiRes.status !== 429) break;
    await geminiRes.body?.cancel();
    console.warn('API key quota hit, trying next key...');
  }

  // No keys configured, or every key was rate-limited.
  if (!geminiRes) return json({ error: 'NO_API_KEY' }, 500);
  if (geminiRes.status === 429) return json({ error: 'RATE_LIMIT' }, 429);

  return new Response(geminiRes.body, { status: geminiRes.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
