// Handles RevenueCat webhook events, keeping premium_devices in sync so
// gemini-chat (and any other server-side check) can verify premium status
// without trusting the client.
//
// Setup: RevenueCat dashboard > Project settings > Integrations > Webhooks.
// URL = this function's deployed URL. Authorization header value = Bearer
// <REVENUECAT_WEBHOOK_SECRET>, matching the secret set on this function
// (supabase secrets set REVENUECAT_WEBHOOK_SECRET=...).
//
// app_user_id in the event payload is the id passed to Purchases.configure()
// client-side (utils/revenuecat.js) — we pass our existing per-device UUID,
// so this maps 1:1 onto the device_id column premium_devices already uses.

const WEBHOOK_SECRET  = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ENTITLEMENT_ID  = 'premium';

const ACTIVE_EVENTS   = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'PRODUCT_CHANGE']);
const INACTIVE_EVENTS = new Set(['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE']);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const auth = req.headers.get('authorization') ?? '';
  if (!WEBHOOK_SECRET || auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload;
  try { payload = await req.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const event = payload.event;
  if (!event) return new Response('ok', { status: 200 });

  const deviceId = event.app_user_id;
  const entitlementIds = event.entitlement_ids || (event.entitlement_id ? [event.entitlement_id] : []);
  if (!deviceId || !entitlementIds.includes(ENTITLEMENT_ID)) {
    return new Response('ok', { status: 200 });
  }

  if (ACTIVE_EVENTS.has(event.type)) {
    await upsertPremium(deviceId);
  } else if (INACTIVE_EVENTS.has(event.type)) {
    await revokePremium(deviceId);
  }

  return new Response('ok', { status: 200 });
});

const sbHeaders = () => ({
  'Content-Type':  'application/json',
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer':        'resolution=merge-duplicates',
});

async function upsertPremium(deviceId: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/premium_devices`, {
    method: 'POST', headers: sbHeaders(),
    body: JSON.stringify({ device_id: deviceId, active: true, updated_at: new Date().toISOString() }),
  });
}

async function revokePremium(deviceId: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/premium_devices?device_id=eq.${encodeURIComponent(deviceId)}`, {
    method: 'PATCH', headers: sbHeaders(),
    body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }),
  });
}
