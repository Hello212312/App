// Handles Stripe webhook events.
// checkout.session.completed  -> mark device as premium
// customer.subscription.deleted -> revoke premium

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL          = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY           = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req) => {
  const sig  = req.headers.get('stripe-signature') ?? '';
  const body = await req.text();

  let event;
  try {
    event = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('webhook signature failed', err.message);
    return new Response('Unauthorized', { status: 401 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.client_reference_id && session.payment_status === 'paid') {
      await upsertPremium(session.client_reference_id, session.customer);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    if (sub.customer) {
      await revokePremium(sub.customer);
    }
  }

  return new Response('ok', { status: 200 });
});

const sbHeaders = () => ({
  'Content-Type':  'application/json',
  'apikey':        SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer':        'resolution=merge-duplicates',
});

async function upsertPremium(deviceId, customerId) {
  await fetch(`${SUPABASE_URL}/rest/v1/premium_devices`, {
    method: 'POST', headers: sbHeaders(),
    body: JSON.stringify({ device_id: deviceId, stripe_customer_id: customerId, active: true, updated_at: new Date().toISOString() }),
  });
}

async function revokePremium(customerId) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/premium_devices?stripe_customer_id=eq.${encodeURIComponent(customerId)}`,
    {
      method: 'PATCH', headers: sbHeaders(),
      body: JSON.stringify({ active: false, updated_at: new Date().toISOString() }),
    },
  );
}

async function verifyStripeSignature(payload, header, secret) {
  const parts     = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error('malformed header');
  const signed = `${timestamp}.${payload}`;
  const key    = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac    = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const hex    = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex !== signature) throw new Error('signature mismatch');
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new Error('timestamp expired');
  return JSON.parse(payload);
}
