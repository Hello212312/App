// Creates a Stripe Checkout session and returns the hosted URL.
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_PRICE_ID   = Deno.env.get('STRIPE_PRICE_ID') ?? '';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  let body;
  try { body = await req.json(); }
  catch { return json({ error: 'INVALID_JSON' }, 400); }

  const deviceId = body.device_id?.trim();
  if (!deviceId) return json({ error: 'MISSING_DEVICE_ID' }, 400);

  const params = new URLSearchParams({
    'mode':                    'payment',
    'line_items[0][price]':    STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    'client_reference_id':     deviceId,
    'success_url':             'interny://payment-success',
    'cancel_url':              'interny://payment-cancel',
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) return json({ error: 'STRIPE_ERROR', detail: data.error?.message }, 500);

  return json({ url: data.url });
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
