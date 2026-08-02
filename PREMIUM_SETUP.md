# Premium / Payments / Essay Review — setup checklist

This is everything that had to be built in code (done) and everything that
only you can do because it requires accounts, dashboards, or store approval
(not done — do these before shipping).

## 1. RevenueCat + in-app purchase (the $8 Premium unlock)

Why RevenueCat instead of Stripe: Apple requires In-App Purchase (not an
external payment processor) to unlock digital features inside an iOS app.
RevenueCat is a thin layer over Apple/Google's own purchase APIs so you get
one integration for both stores.

**Code done:** `utils/revenuecat.js`, `screens/PaywallScreen.js` (real
purchase + restore flow), `context/UserContext.js` (syncs entitlement status
on launch), `supabase/functions/revenuecat-webhook/` (keeps the existing
`premium_devices` table in sync so `gemini-chat` can verify premium
server-side).

**You need to do:**
1. Create a free RevenueCat account at app.revenuecat.com, create a project,
   add an iOS app (bundle id `com.smantri.Interny`) and Android app (package
   `com.interny.app`).
2. In **App Store Connect**, create a Non-Consumable in-app purchase, e.g.
   product id `premium_lifetime`, price $8. In **Google Play Console**,
   create the matching managed product with the same id. Import both into
   RevenueCat (Products tab).
3. In RevenueCat, create an **Entitlement** named exactly `premium` and
   attach both store products to it.
4. Create an **Offering** with a **Package** offering that product (default
   offering, first package — the code just takes `availablePackages[0]`).
5. Copy the iOS and Android **public API keys** (Project settings > API
   keys) and set them as env vars the app can read at build time:
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
   (e.g. in a `.env` file, or as EAS secrets for cloud builds).
6. Deploy the webhook function and wire it up:
   ```
   supabase functions deploy revenuecat-webhook
   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<a random string you make up>
   ```
   Then in RevenueCat: Project settings > Integrations > Webhooks > add the
   deployed function's URL, Authorization header value
   `Bearer <that same random string>`.
7. **Build a dev client to test** — RevenueCat is a native SDK, Expo Go
   cannot run it:
   ```
   eas build --profile development --platform ios
   # or
   npx expo run:ios   /   npx expo run:android
   ```
   Sandbox-test purchases using a Sandbox Apple ID (App Store Connect >
   Users and Access > Sandbox Testers) or a Google Play license tester.

The old `create-checkout` / `stripe-webhook` functions are no longer used
and can be deleted once you've confirmed RevenueCat works end to end.

## 2. Chat rate limiting

Already re-enabled in code: `supabase/functions/gemini-chat/index.ts` now
enforces 3 free messages/day again (`UNLIMITED_CHATS_TEMP = false`). Just
redeploy: `supabase functions deploy gemini-chat`. No dashboard setup needed
— it reuses the same `premium_devices` table RevenueCat's webhook writes to.

## 3. Essay review — real human pipeline

Essay review was always meant to be human-reviewed (not AI) — the missing
piece was that submissions went into a table nobody was notified about. Now
every submission emails you, with **Reply-To set to the student's email**,
so you just hit reply to send feedback.

**You need to do:**
1. Sign up at resend.com (or swap the fetch call in
   `notify-essay-submission` for whatever email API you prefer), verify a
   sending domain (or use their shared test domain to start).
2. 
   ```
   supabase secrets set RESEND_API_KEY=re_xxx
   supabase secrets set ADMIN_NOTIFY_EMAIL=mantrihouse601@gmail.com
   supabase secrets set NOTIFY_WEBHOOK_SECRET=<a random string you make up>
   supabase functions deploy notify-essay-submission
   ```
3. Open `supabase/migrations/20260801120000_essay_review_notify_trigger.sql`,
   replace `REPLACE_WITH_YOUR_NOTIFY_WEBHOOK_SECRET` with the same value you
   used above, then apply it (`supabase db push`, or paste it into the SQL
   editor in the Supabase dashboard).

After that, every essay submission lands in your inbox within seconds.

## 4. More Premium upsell placements

Added a reusable `PremiumUpsellBanner` (in `components.js`) and placed it on:
Home (feed), Search (above results), Tracker (above the pipeline), and
Detail (below the tab content) — all gated on `!user.premium`, in addition
to the existing ones in Chat, Materials, EssayReview, InterviewPrep, and
Profile.
