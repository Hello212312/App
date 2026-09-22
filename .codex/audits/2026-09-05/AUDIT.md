# Interny onboarding and match-score audit

September 5, 2026. Audit only; no app implementation changes.

## Verdict

Interny has a useful foundation: one shared score calculator, explicit rejection of several known eligibility mismatches, explanations for score components, editable preferences, and tests. The main problem is that the percentage combines eligibility, preferences, incomplete information, and editorial promotion. It can look confident without establishing whether the student can realistically participate.

Fix correctness and uncertainty first. Then simplify onboarding. Tuning the weights alone would preserve the biggest problems.

## Scope and evidence

- Inventoried 87 project files outside dependencies, assets, generated graphs/builds, and prior content. See `project-file-inventory.txt`. Inventory is not a claim that every unrelated feature received a line-by-line audit.
- Deep review: current entry point and navigation, onboarding, user storage, school lookup, matching/eligibility, data mapping, Home/Search/Detail integration, profile editing, notifications, first-launch tour, analytics, and relevant activity schema/admin code.
- Used the existing graph to locate relationships, then checked the current source. The graph query was bounded and truncated; source review supplied the detailed findings below.
- Refreshed the project code graph after adding audit diagnostics. It reported missing SQL-parser support for seven SQL files and zero extracted nodes for eight files; relevant migration evidence in this audit was read directly. The graph is therefore not a complete representation of all project files.
- Existing matching checks: **34 passed, 0 failed**.
- Added and ran **15 read-only diagnostic scenarios** against the real calculator. These are synthetic inputs, not claims about any particular live internship. Full outputs: `match-probes.json`; reproducible runner: `match-probes.mjs`.
- Targeted lint on onboarding, Home, Search, and matching: **0 errors, 9 warnings**. Home and Search warnings include incomplete hook dependencies, supporting the stale-ranking finding. Onboarding and matching had no lint messages. Lint does not validate recommendation quality.
- No live database inspection, production user-data inspection, or device walkthrough was performed. Layout/scroll behavior and deployed data quality still need device verification. No screenshots or social post have been produced at this audit checkpoint.
- No prior posts, videos, or content-strategy files were used.

## Actual application structure

`package.json` points to `index.js`, which registers `App.js`. The live app uses React Navigation with Home, Search, Tracker, and Profile tabs. It is not currently launched through the Expo Router template under `app/`, despite the generic repository guidance describing that template.

The personalization chain is:

`OnboardingScreen → UserContext/local storage → matching.js → Home/Search ranking + Detail breakdown + notifications`

`data.js` maps the Supabase internship rows into the fields consumed by that chain. `ProfileScreen` provides subsequent edits. `TourContext` starts a feature tour after onboarding.

## How the score currently works

Known grade, age, location, gender, or race mismatches can return zero. Otherwise the following components add up to a 100-point denominator at default priorities:

| Component | Maximum | Current behavior |
|---|---:|---|
| Interests | 40 | Primary-field match earns 40; a single tag-only match 26; adjacent field 14; no supplied interests gets 20 |
| Grade and age | 12 | Narrow qualifying grade range gets 12; broader range 9; unknown grade fit 5 |
| Location and logistics | 24 | City/state match 24; same state 21; remote usually 15; remote preference can raise it to 24 |
| Compensation | 8 | Stipend 8; unpaid 3; program fee 0; unknown pay currently falls into unpaid |
| Academic/profile fit | 10 | Always 8–10, based on a coarse GPA/readiness classification |
| Featured | 3 | Editorial featured flag adds points |
| School match | 3 | Mention of the student's school/district adds points |

The four priority controls multiply both points and denominator by 0.35, 0.65, 1, 1.4, or 1.8. The result is normalized to 0–100. This is a hand-built preference index; it is not a calibrated probability of acceptance. No outcome-calibration implementation was found in the reviewed matching path.

Source: [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 892–1263. The shared breakdown is a strength worth keeping.

## Priority findings

### 1. Profile edits can leave Home and Search ranked using stale scores — high

Both score caches omit `formatPreference`, `gender`, `race`, `birthday`, and `school` from their dependencies. When an omitted field changes without a listed dependency changing, the calculator is not rerun. Detail computes its breakdown from the whole user object, so ranking and detail can disagree. Updating arrays indirectly can sometimes mask the problem; it does not make the dependencies correct.

**Change:** one shared, complete scoring-input object/version; all consumers use it. Recalculate date-dependent eligibility on app resume/day changes as well.

**Acceptance:** change remote preference or a restriction-relevant profile answer; Home, Search, Detail, and recommendation notifications agree immediately.

Sources: [HomeScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/HomeScreen.js>) lines 254–260; [SearchScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/SearchScreen.js>) lines 647–654; [DetailScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/DetailScreen.js>) line 449.

### 2. Unknown eligibility is displayed as a confident match — high

The eligibility helper sometimes returns `unknown: true`, but the successful match breakdown drops that information. Missing age is worse: a tenth grader with no birthday on a 16+ program is classified as age-eligible because some tenth graders could be sixteen. That does not establish the actual student's eligibility.

**Reproduced:** a tenth grader without a birthday gets **81%** on a 16+ fixture. An explicitly female-only fixture also gets **81%** when gender is unanswered; its internal unknown status is absent from the breakdown.

**Change:** keep three visible states: requirements checked, needs confirmation, and known mismatch. List the exact unresolved requirement. Age/grade requirements need a reference date where programs specify age at application or start, rather than always comparing with today.

Sources: [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 369–386, 761–858, 1006–1021, 1263; [components.js](<C:/Users/Sidharth Mantri/Downloads/my_app/components.js>) lines 207–258.

### 3. “Stay local” does not establish a realistic commute — high

Same-state programs earn 21/24 location points before travel restrictions are considered. “Within my state” has no dedicated scoring branch. Nearby states are treated as nearby without checking distance. A far-away program can still accumulate a high total from other categories.

**Reproduced:** a San Diego student who selects Stay local gets **87%** for San Francisco. A Richmond, VA student gets **67%** for Los Angeles, or **75%** with interests set to priority 5.

**Change:** collect a separate home/base location plus an acceptable commute distance or time. Separate “must be reachable from home” from a soft location preference. Only apply a feasibility exclusion when the necessary location information is reliable; otherwise show a check-needed state. Handle relocation and housing separately.

Sources: [OnboardingScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/OnboardingScreen.js>) lines 61–65; [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 1088–1159.

### 4. School location is treated as home/residency — high

Onboarding copies the selected school's city/state into the student's main location. Eligibility accepts either home or school location as matching state/city evidence, without distinguishing a residency requirement from a school-attendance requirement. These are not interchangeable for students who commute across a boundary or attend boarding school. Skipping school also leaves no independent onboarding location entry.

**Change:** separate “Where will you be based?” from optional school; represent residence and school eligibility with distinct requirement types.

Sources: [OnboardingScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/OnboardingScreen.js>) lines 968–984; [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 617–643.

### 5. Recommendation surfaces do not share one eligibility policy — high

Home's Today's Pick rotates through up to eight open results without excluding known mismatches. If fewer than eight eligible items exist, an ineligible item can become the highlighted pick. “Because you looked at” uses similarity and expiration checks, but not user eligibility. Search's ranking tiers check grade only; Deadline/Newest sorting can promote an age/location-ineligible result over eligible ones. The remote-only filter also admits nationwide in-person items.

**Reproduced:** a nationwide in-person fixture passes `isLocationEligible` for a remote-only user and receives **66%**. Nationwide availability is not remote work.

**Change:** share an eligibility/availability result across all recommendation surfaces. Keep explicitly searched mismatches accessible with explanations, but do not label them personalized top recommendations. Remote-only should mean genuinely remote.

Sources: [HomeScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/HomeScreen.js>) lines 290–296 and 325–340; [SearchScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/SearchScreen.js>) lines 730–787; [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 176–191.

### 6. Missing answers receive invented fit points — medium/high

Very little information activates a numerical score, including merely setting one priority. Unanswered interests get 20 points and missing GPA/readiness is treated as an open-leaning profile. That blends “unknown” with “lower readiness.”

**Reproduced:** entering only grade produces **54%** on the remote stipend fixture. Entering only default interest priority produces **50%**. Detail labels 50+ a Good match, while notifications use 50 as their high-match threshold.

**Change:** show “Add your interests/location to personalize” until enough useful inputs exist. Report data coverage separately from fit; do not assign invented personal traits to missing answers. Define labels/notification thresholds consistently and test them against judged recommendations.

Sources: [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 984–990, 1051–1053, 1224–1256; [DetailScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/DetailScreen.js>) lines 58–63; [notifications.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/notifications.js>) line 57.

### 7. “Prestige & selectivity” promises different behavior from the formula — medium

The tooltip says increasing this priority favors competitive, name-brand programs. In fact it magnifies the academic-fit category. For an open-leaning profile, that magnifies a preference for open programs. All programs receive 8–10 points anyway, despite GPA/readiness occupying two onboarding screens. Readiness counts all checked materials equally, regardless of what that application actually requires.

**Reproduced:** with below-3.0 GPA and prestige priority 5, otherwise identical competitive/open fixtures score **80% / 83%**, favoring open.

**Change:** keep application readiness separate: “You have 2 of the 4 required materials.” Ask whether the student wants exploratory, broadly accessible, or competitive opportunities if that preference matters. Do not imply GPA plus material count estimates acceptance chances. If GPA is retained, explain its scale and handle unknown/unweighted/weighted values.

Sources: [OnboardingScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/OnboardingScreen.js>) lines 75–84 and 106–120; [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 1214–1257.

### 8. Featured status changes supposedly personal fit — medium

**Reproduced:** changing only the featured flag changes a fixture from **81% to 84%**. Editorial promotion has not changed the student's suitability. Narrower grade eligibility and direct school mentions also reward specificity over an otherwise equally suitable broadly open program.

**Change:** keep editorial placement separate from personal fit. Treat meeting eligibility as a requirement check; avoid awarding extra personal fit simply because a program excludes other grades or happens to name a school.

Source: [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 1067–1072, 1199–1211.

### 9. Parsing and missing listing fields can produce false claims — high for affected listings

**Reproduced:** `Ages 10-18` is parsed as grade 10, making an actual eleventh grader age 16 score zero. `Portland, ME` adds Oregon through the city-name table as well as explicit Maine, giving an Oregon student a same-state boost and **87%**. Missing compensation is described as “Unpaid, but free to attend,” although the input never established it was free.

The internal `Paid` value means the student pays a fee; this is internally intentional, but fragile terminology for imports and future maintenance.

**Change:** prefer structured grade bounds, explicit city/state coordinates, separate wages/stipend/fee/unknown values, and data-validation checks. Explicit state should override ambiguous city lookup. Age labels must never be parsed as school grade.

Sources: [matching.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/matching.js>) lines 118–148, 327–340, 410–433, 1187–1196; [data.js](<C:/Users/Sidharth Mantri/Downloads/my_app/data.js>) lines 69–87.

### 10. Demographic purpose explanation does not cover analytics use — high

The visible onboarding copy describes optional gender/race answers as helping flag eligibility. A source comment goes further and says they are never shown to anyone or used for anything else. Actual analytics attach gender, race, GPA, age, school, name, and location fields to activity records keyed by device ID. The admin statistics schema includes these fields, and admin UI presents some profile details. The absolute “never shown” wording is a code comment, not a verified onscreen promise.

**Change:** remove unnecessary sensitive profile fields from ordinary analytics and align the explanation with actual collection/use. Measure onboarding completion and relevance without copying the whole profile into each event.

This is a code-level purpose/data-flow finding, not a legal conclusion or a claim that the production database was inspected. Admin access controls exist in the reviewed migration; this finding does not imply the data is public.

Sources: [OnboardingScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/OnboardingScreen.js>) lines 123–126 and 839–845; [analytics.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/analytics.js>) lines 9–28, 40–48, 64–72; [20260817130000_admin_auth_hardening.sql](<C:/Users/Sidharth Mantri/Downloads/my_app/supabase/migrations/20260817130000_admin_auth_hardening.sql>) lines 105–115.

## Onboarding findings

The current flow is Welcome → Referral → Name → Grade/birthday → Interests → School → Logistics/priorities → GPA → Readiness → Demographics, followed by an automatic feature tour.

### The first useful result comes too late

Referral attribution and name are requested before matching inputs. Logistics packs format, travel, housing, and four five-point priority controls onto one screen. GPA and document readiness add steps despite contributing a narrow distinction to the score. This is an identifiable friction risk; actual abandonment rates were not available, so no conversion-loss percentage is claimed.

### Skip has two conflicting meanings

The school copy says the step is optional and can be skipped, but the visible Skip action completes all remaining setup. There is no separate “Skip this question” control. A student trying to skip school can unintentionally miss logistics and everything after it. Already-entered answers are preserved, which is good.

Sources: [OnboardingScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/OnboardingScreen.js>) lines 471, 1011–1017, 1062–1071.

### Draft progress and returning profiles are fragile

Answers and step number live in component state until completion/Skip. Terminating and reopening the app can lose an incomplete draft. Onboarding initializes all fields empty instead of from the existing user. If the version gate sends existing users through setup again, skipping can overwrite prior profile fields with blanks. This is source-confirmed behavior, not a device-reproduced session.

Sources: [OnboardingScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/OnboardingScreen.js>) lines 901–920 and 968–1017; [App.js](<C:/Users/Sidharth Mantri/Downloads/my_app/App.js>) lines 178–190; [UserContext.js](<C:/Users/Sidharth Mantri/Downloads/my_app/context/UserContext.js>) lines 43–48 and 184–188.

### School input needs stronger states

Manual state validation accepts any two letters, including `ZZ`. Search requests have a debounce but no response-generation guard: an older request can overwrite newer results. Directory errors and no matches both become an empty list. The school is not editable in the reviewed profile modal, although freeform location is; old school-location evidence can remain after location changes.

Sources: [OnboardingScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/OnboardingScreen.js>) lines 411–463; [schools.js](<C:/Users/Sidharth Mantri/Downloads/my_app/utils/schools.js>) lines 16–56; [ProfileScreen.js](<C:/Users/Sidharth Mantri/Downloads/my_app/screens/ProfileScreen.js>) lines 350–439.

## Proposed onboarding

Keep the existing restrained mobile visual system. Make each screen ask a coherent question and show what its answer changes.

1. **Grade and eligibility basics:** current grade, optional birthday with a precise purpose explanation; distinguish program reference dates when known.
2. **Interests:** a few selected fields plus “Still exploring”; allow the student to indicate a primary interest without encouraging indiscriminate selection.
3. **Practical limits:** home/base city independently from school, remote/in-person, commute range, willingness to relocate, housing needs, and whether paid work is required. Reveal follow-up controls only when relevant.
4. **Your first matches:** actual listings, two main reasons, and a conspicuous unresolved-requirement label where needed. Let the student adjust answers directly.

Name, referral, optional school, demographic eligibility details, GPA, and application materials can be offered after the first useful results or when a relevant requirement arises. No forced lengthy tour before browsing. Use a short optional contextual explanation.

Each optional screen needs “Skip this question”; a distinct “Browse now” can leave setup. Save a resumable draft, prefill existing answers, validate location, and reset scroll/focus on step changes. Verify actual small-screen, keyboard, screen-reader, and large-text behavior on-device before shipping.

## Proposed matching contract

Keep separate outputs for:

- **Availability:** open, closed, rolling/unknown deadline.
- **Eligibility:** meets checked requirements, needs confirmation, known mismatch; include source/reason and relevant date.
- **Practical feasibility:** commute/remote, relocation, housing, cost, dates; unknown stays unknown.
- **Preference fit:** rank feasible results by the student's actual interests and stated preferences.
- **Application readiness:** missing documents/tasks for this specific program.

A percentage, if retained, should describe preference fit only, with understandable reasons and a separate completeness indicator. Do not call it an acceptance probability. Featured placement should be visibly editorial.

I would not select a replacement set of numerical weights before validating student/program examples. First fix deterministic failures; then build a small, diverse set of manually judged recommendation comparisons, test top-result relevance and unmet-requirement rates, and tune weights against those judgments. Follow with privacy-minimal product measurements: first-result time, onboarding step completion, first useful save, and requirement-related dismissals.

## Recommended order

1. Fix stale scoring inputs, preserve unknown eligibility, prevent infeasible top recommendations, and correct the parser failures.
2. Remove unsupported “free” claims and unnecessary sensitive analytics fields.
3. Separate eligibility/readiness/fit, standardize explanations and thresholds across screens.
4. Shorten onboarding, separate school from home, add draft persistence and accurate Skip behavior.
5. Verify on real devices with realistic profiles and live listing quality checks.

## Separate screenshot slideshow

Still pending, per the audit-first review checkpoint. No old content was consulted. The later post must use freshly captured real app screens, a complete ordered slide sequence, slide text, and a caption. It must describe the app as actually verified at capture time, without implying that these proposed improvements already exist. No publication is authorized or planned by the assistant.

