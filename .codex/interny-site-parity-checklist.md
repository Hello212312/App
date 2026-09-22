# Interny site parity assessment — 2026-09-08

Sources confirmed: mobile app at `../`; current Site version 5, commit `a990245692b1aa3565f50026684e0cc7e9e055fb`. Review checkout: `interny-site-review/`. No mobile app edits.

## Pre-edit flow checklist

- [ ] Catalog loading and refresh: `data.js`, `utils/supabase.js`, `App.js`. Uses the existing anonymous Supabase client; selects `Internships.*`, orders featured first then deadline date. No explicit pagination in this loader. Subscribers update mounted screens; failed refresh retains prior data, first-load failure leaves an empty list and logs a warning. Preserve backend response limits and visibility rules.
- [ ] Home discovery: `screens/HomeScreen.js`, `utils/matching.js`, `context/UserContext.js`. Personalized ordering, daily pick, closing-soon/recent/similar rails, full feed, refresh, navigation into Search/Detail/Profile/Tracker/ClosingSoon.
- [ ] Search: `screens/SearchScreen.js`, `utils/matching.js`. Initial categories/recent searches, query entry and clearing, filter chips and filter modal (field, format, pay, difficulty, rolling, near me, multi-field, deadline), clear-all and apply, relevance/deadline/newest sorting, result and empty states, details and return. Existing date picker needs a browser adaptation.
- [ ] Details: `screens/DetailScreen.js`, `components/MatchBreakdownModal.js`, `utils/matching.js`, `context/UserContext.js`. Save, top pick, sharing, match/eligibility explanation, status picker, checklist, notes, Overview/Requirements/Apply tabs, external apply action and return-status prompt. Calendar action additionally uses `utils/calendar.js`.
- [ ] Saved: `screens/SavedScreen.js`, `context/UserContext.js`, `utils/matching.js`. Saved/application views, empty browse action, detail navigation, changes after catalog load.
- [ ] Tracker: `screens/TrackerScreen.js`, `context/UserContext.js`. Active/decided/all filtering, seven application stages, deadline ordering, advance/remove actions, checklist progress, detail return, similar recommendations, Materials navigation.
- [ ] State and prerequisites: `App.js`, `context/UserContext.js`, `context/TourContext.js`, Onboarding/Profile/Materials/ClosingSoon/Deadlines screens. Onboarding version gate and tours; local AsyncStorage persistence under `@interny_user_v2`. No account sign-in gate found in the root listing navigation. Browser refresh persistence must be verified, not presumed to sync with phone storage.
- [ ] Native side effects: `utils/calendar.js`, `utils/notifications.js`, `utils/revenuecat.js`. Calendar permissions, calendar lookup, duplicate event detection, event creation and alarm; scheduled notifications on saved-state changes; premium entitlement initialization through native RevenueCat.
- [ ] Browser verification: loading/failure/empty, filter reset, details/return and browser back, apply return, persistence after refresh, mouse/keyboard, desktop/laptop/narrow widths.

## Confirmed blocker before implementing the listing tab

`utils/calendar.js` requires native calendar read/write access, including duplicate detection and event creation with an alarm. The installed `node_modules/expo-calendar/src/ExpoCalendar.web.ts` returns non-granted permissions and supplies no calendar enumeration, event lookup, or event creation implementation. Reusing it would leave a nonfunctional Add to Calendar button. A downloadable calendar file changes the sequence and cannot verify duplicates in the user's calendar; connecting a calendar provider introduces a new connection/authentication flow. Neither is authorized by the strict parity scope.

Saved-state changes also invoke native notification scheduling through `utils/notifications.js`. Equivalent scheduled delivery while a browser is closed cannot be supplied by the existing native implementation; no web notification delivery service was found in this dependency path. Adding one is expressly prohibited. No unsupported substitute or incomplete Internships tab will be added.

The listing dependency audit stopped at these blockers; unchecked items above are a source-based implementation/verification checklist, not claims of completed porting or runtime verification.

## Independently authorized change

Remove the three decorative ribbon meshes and their animation from `app/phone-scene.tsx` in the latest Site source. Preserve phone models, movement, page content, navigation, screenshot labels, badges, publishing, and access settings. Verify build, types, lint and local responsive preview.

Usage baseline: 9% of five-hour allowance used. Task ceiling: 59% used in the same window. Last checkpoint before edits: 22%.

## Verification and handoff

- Ribbon geometry and animation removed: exactly 46 deleted lines in `app/phone-scene.tsx`; no other tracked Site source changed from version 5.
- Production build: passed; existing bundle-size warning and route-classification notice remain.
- TypeScript (`tsc --noEmit --incremental false`): passed.
- Edited-file lint (`oxlint app/phone-scene.tsx`): passed.
- Full lint: failed with 20 errors in unchanged UI primitives, `hooks/use-mobile.ts`, and `app/page.tsx`; unrelated cleanup was not performed.
- Local preview: `http://localhost:5173/` returned HTTP 200 and was requested in the Codex browser panel. Development server retained for review.
- Browser UI tool failed to initialize with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`. Desktop/laptop/narrow visual checks and interactive checks are unverified.
- Internships tab: not implemented because exact parity is blocked as documented above. No listing runtime checks claimed.
- Project graph refreshed successfully (pre-existing SQL-parser and graph-label warnings remain).
- No publishing, access-setting, backend, or mobile-app changes.
- Latest measured five-hour usage: 39%, an increase of 30 percentage points from the 9% baseline; below the 50-point cap.

## Continuation checkpoint — browser port, not yet published

The user authorized browser equivalents for native features, lifted the original 50-point cap, authorized publication after completion, and then explicitly required staying below the full usage limit. Last usage checkpoint: 92%; stop with margin. Do not consume reset credits.

Implementation now lives in `interny-site-review/`:
- Main navigation includes Internships at `/internships`; mobile navigation rules keep it visible.
- Original app screens, matching, UserContext, tours, onboarding and supporting logic are copied to `interny-app/`; mobile source untouched. Expo web export is under `public/interny-app/` and is embedded in the Site route to isolate original styles.
- Browser adapters cover date picker, accessible alerts, sharing, keyboard button semantics, session navigation/history, calendar .ics export and tab-open notifications. Browser notification limitations are disclosed in the interface. Native purchases are not initialized on web; no entitlement bypass.
- Calendar exports contain the original one-day alarm. The browser cannot inspect installed calendar events; repeat exports ask before downloading again.
- `data.js` retains the original Supabase query and mapping; adds loading/error state for the browser.
- Existing ribbons remain removed.

Verification:
- First-run onboarding renders at 1440px without JS errors.
- Live network-enabled browser run loaded 811 listings from the original backend.
- Search categories, unmatched search empty state, clear-search action, opening filters, choosing Free and Clear all were exercised.
- Full site production build passes including `/internships`.
- Site TypeScript scan currently fails because copied, unused Expo starter `.tsx` files under `interny-app/components` import absent Expo-router dependencies. Remove unreachable source files or separate the Expo source from Site TypeScript scope; do not install unrelated dependencies.
- Final automated flow run remains incomplete. Inspect its tool result or rerun `verify-flows.cjs` with network-enabled execution. It was attempting NASA search -> details -> save/top pick -> refresh -> browser back -> responsive widths. Do not mark these checks passed without evidence.
- Calendar export, notes/checklist edits, status transitions, application return prompt, persistent saved state, failure/retry state, keyboard flow, complete onboarding and all responsive widths still need verification.
- Full lint had pre-existing 20 errors before porting; new/changed code still needs targeted checks.
- Do NOT publish until remaining issues and required verification are resolved. No version has been saved or published during this continuation.

Tooling:
- CUA and node_repl fail initializing kernel assets. Shell Playwright works using `C:/Users/Sidharth Mantri/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`, Chromium channel `msedge`.
- Browser processes need network-enabled execution to reach live Supabase. Sandboxed runs wait indefinitely on the external catalog.
- Preview remains `http://localhost:5173/internships`.
- Expo export: run the existing local Expo CLI in `interny-app/`, `export --platform web --output-dir ../public/interny-app --max-workers 2`, CI=1. Re-export after app source changes.
- App dependency junction points to mobile node_modules; Site junction points to prior Site node_modules. Both are gitignored. Make install/build instructions portable before saving.
- Source site latest baseline was version 5 / a990245692b1aa3565f50026684e0cc7e9e055fb. Obtain fresh source credential, recheck remote head and audience before publishing. User authorized publication to existing audience.
