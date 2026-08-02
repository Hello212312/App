// Sends you an email whenever someone submits an essay for review, with
// Reply-To set to the submitter — so you can just hit reply in your inbox to
// send feedback back. This is the missing piece that makes essay review a
// real (human) pipeline instead of a write-only table nobody looks at.
//
// Setup required:
//   1. Sign up at resend.com (or another transactional email API — adjust
//      the fetch call below if you use a different provider). Verify a
//      sending domain, or use Resend's shared test domain to start.
//   2. Create an API key, then:
//        supabase secrets set RESEND_API_KEY=re_xxx
//        supabase secrets set ADMIN_NOTIFY_EMAIL=you@example.com
//        supabase secrets set NOTIFY_WEBHOOK_SECRET=<random string>
//        supabase secrets set NOTIFY_FROM_EMAIL="Interny Essays <essays@yourdomain.com>"
//   3. Deploy this function: supabase functions deploy notify-essay-submission
//   4. Run the migration in supabase/migrations/ that adds the Postgres
//      trigger calling this function on every essay_reviews insert — replace
//      the placeholder secret in that file with the same NOTIFY_WEBHOOK_SECRET
//      value before running it.

const RESEND_API_KEY        = Deno.env.get('RESEND_API_KEY') ?? '';
const ADMIN_NOTIFY_EMAIL    = Deno.env.get('ADMIN_NOTIFY_EMAIL') ?? '';
const FROM_EMAIL            = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'Interny Essays <onboarding@resend.dev>';
const NOTIFY_WEBHOOK_SECRET = Deno.env.get('NOTIFY_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  if (NOTIFY_WEBHOOK_SECRET && req.headers.get('x-notify-secret') !== NOTIFY_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  if (!RESEND_API_KEY || !ADMIN_NOTIFY_EMAIL) {
    console.error('notify-essay-submission: missing RESEND_API_KEY or ADMIN_NOTIFY_EMAIL secret');
    // Return 200 so the DB trigger doesn't treat a missing config as a failure.
    return new Response('ok (not configured)', { status: 200 });
  }

  const { email, essay_title, essay_text, program, notes } = body;

  const html = `
    <h2>New essay review submission</h2>
    <p><strong>From:</strong> ${escapeHtml(email || 'no email given')}</p>
    <p><strong>Program:</strong> ${escapeHtml(program || '—')}</p>
    <p><strong>Title:</strong> ${escapeHtml(essay_title || '—')}</p>
    ${notes ? `<p><strong>Notes from student:</strong> ${escapeHtml(notes)}</p>` : ''}
    <hr />
    <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(essay_text || '')}</pre>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_NOTIFY_EMAIL],
      reply_to: email || undefined,
      subject: `Essay review: ${essay_title || 'Untitled'} (${program || 'no program given'})`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('resend error', await res.text());
    return new Response('email failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});

function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
