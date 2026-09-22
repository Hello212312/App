# Graph Report - my_app  (2026-09-05)

## Corpus Check
- 157 files · ~1,592,568 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1423 nodes · 2642 edges · 131 communities (81 shown, 50 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eae0da2e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- isItemRemote
- explore.tsx
- screens/SavedScreen.js
- expo
- screens/ProfileScreen.js
- utils/matching.js
- devDependencies
- screens/HomeScreen.js
- screens/SearchScreen.js
- implementation-baseline/matching.js
- generate-carousels.cjs
- ChatScreen.js
- Architecture Overview
- ErrorBoundary
- reset-project.js
- parse-resume/index.ts
- expo-constants
- tsconfig.json
- gemini-chat/index.ts
- stripe-webhook/index.ts
- app.json (Expo App Configuration)
- create-checkout/index.ts
- ios
- App Icon (Interny) - Blue 'A' Boomerang/Chevron Mark
- Existing Companies List
- context/UserContext.js
- Adaptive Icon
- App Favicon Icon
- Android Icon Background (adaptive icon safe-zone diagram)
- Android Monochrome Icon (Chevron)
- Favicon (blue chevron/arrow logo)
- Splash Icon (Concentric Circles Logo)
- Notification Icon (Blue Square, White Upward Arrow)
- Splash Icon
- Tour Match UI Fragment
- Expo Internal README
- Interny TikTok content system
- permissions
- Interny social creative brief
- Premium / Payments / Essay Review — setup checklist
- revenuecat-webhook/index.ts
- Internship Verification Workflow
- notification
- splash
- extra
- plugins
- eslint.config.js
- metro.config.js
- Q: Where are Interny's real brand assets and app screens for social creative?
- Photography prompts
- utils/matching.test.mjs
- .codex/AGENTS.md
- expo-application
- dependencies
- expo-clipboard
- rejected-implementation/utils/matching.js
- expo-dev-client
- expo-device
- implementation-baseline/utils/matching.js
- expo-file-system
- expo-status-bar
- expo-store-review
- expo-updates
- Interny onboarding and match-score audit
- rejected-implementation/screens/ProfileScreen.js
- react-native
- @react-native-async-storage/async-storage
- @react-native-community/datetimepicker
- react-native-gesture-handler
- rejected-implementation/screens/SearchScreen.js
- react-native-reanimated
- react-native-safe-area-context
- react-native-screens
- rejected-implementation/screens/HomeScreen.js
- rejected-implementation/context/UserContext.js
- @react-navigation/stack
- @supabase/supabase-js
- useUser
- App.js
- implementation-baseline/OnboardingScreen.js
- InterviewPrepScreen.js
- computeMatchBreakdown
- screens/TrackerScreen.js
- review.js
- match-probes.mjs
- implementation-baseline/screens/SearchScreen.js
- screens/OnboardingScreen.js
- Q: Audit onboarding and match score in Interny
- screens/DetailScreen.js
- implementation-baseline/ProfileScreen.js
- implementation-baseline/screens/DetailScreen.js
- implementation-baseline/context/UserContext.js
- rejected-implementation/screens/DetailScreen.js
- computeMatchBreakdown
- implementation-baseline/screens/HomeScreen.js
- computeMatchBreakdown
- implement-matching.cjs
- implementation-baseline/matching.test.mjs
- root-updates.cjs
- integrate-profile.cjs
- catalog-polish.cjs
- integrate-matching.cjs
- refine-integration.cjs
- ui-polish.cjs
- rail-consistency.cjs
- fetch-live-catalog.cjs
- final-cleanup.cjs
- finish-polish.cjs
- prerequisite-check.cjs
- root-final.cjs
- similar-rails.cjs
- web-scroll-fix.cjs
- useUser
- expo-linking
- expo-localization
- package.json
- @expo/vector-icons
- react-dom
- restore-original.cjs
- rejected-implementation/utils/matching.test.mjs
- restore-original-root.cjs
- Interny implementation and slideshow delivery — September 5, 2026
- last-coverage.cjs
- user-design-direction.md
- expo-document-picker
- expo-video
- react-native-web

## God Nodes (most connected - your core abstractions)
1. `useUser()` - 37 edges
2. `computeMatchBreakdown()` - 30 edges
3. `computeMatchBreakdown()` - 24 edges
4. `getEffectiveDaysLeft()` - 23 edges
5. `getEffectiveDaysLeft()` - 23 edges
6. `useUser()` - 22 edges
7. `INTERNSHIPS` - 22 edges
8. `computeMatchBreakdown()` - 21 edges
9. `Colors` - 21 edges
10. `Typography` - 21 edges

## Surprising Connections (you probably didn't know these)
- `App Icon (Blue Arrow)` --references--> `app.json (Expo App Configuration)`  [INFERRED]
  assets/icon.png → app.json
- `app.json (Expo App Configuration)` --references--> `Android Adaptive Icon Foreground (Blue Chevron/Arrow)`  [INFERRED]
  app.json → assets/images/android-icon-foreground.png
- `ReminderTimingModal()` --references--> `react`  [EXTRACTED]
  .codex/implementation-baseline/ProfileScreen.js → package.json
- `SettingsRow()` --calls--> `useTourTarget()`  [EXTRACTED]
  screens/ProfileScreen.js → context/TourContext.js
- `EditProfileModal()` --references--> `react`  [EXTRACTED]
  .codex/implementation-baseline/ProfileScreen.js → package.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Theming System** — constants_theme, hooks_use_color_scheme, hooks_use_theme_color [EXTRACTED 1.00]
- **Navigation Structure** — app_layout, app_tabs_layout [EXTRACTED 1.00]

## Communities (131 total, 50 thin omitted)

### Community 0 - "isItemRemote"
Cohesion: 0.67
Nodes (4): isItemNationwide(), isItemRemote(), isLocationEligible(), isNationwideOrRemote()

### Community 1 - "explore.tsx"
Cohesion: 0.08
Nodes (30): unstable_settings, styles, styles, styles, TabLayout(), Partial React Logo (Atom Icon), React Logo Icon (PNG), React Logo (2x) Image Asset (+22 more)

### Community 2 - "screens/SavedScreen.js"
Cohesion: 0.08
Nodes (25): ClosedBadge(), CompanyLogo(), DeadlineBadge(), MatchBreakdownModal(), mbStyles, styles, SectionHeader(), styles (+17 more)

### Community 3 - "expo"
Cohesion: 0.12
Nodes (16): expo, icon, name, newArchEnabled, orientation, owner, runtimeVersion, scheme (+8 more)

### Community 4 - "screens/ProfileScreen.js"
Cohesion: 0.08
Nodes (25): Divider(), AGE_OPTIONS, ALL_INTERESTS, computeProfileStrength(), EditProfileModal(), extractStateAbbrev(), FORMAT_PREF_OPTIONS, GENDER_OPTIONS (+17 more)

### Community 5 - "utils/matching.js"
Cohesion: 0.08
Nodes (45): ChecklistCard(), CITY_COORDS, ADJACENCY_GROUPS, ageFitLevel(), ALL_STATE_ABBREVS, CITY_TO_STATE, computeMatchReasons(), describeLocationEntry() (+37 more)

### Community 6 - "devDependencies"
Cohesion: 0.18
Nodes (11): babel-preset-expo, eslint, eslint-config-expo, devDependencies, babel-preset-expo, eslint, eslint-config-expo, @types/react (+3 more)

### Community 7 - "screens/HomeScreen.js"
Cohesion: 0.18
Nodes (18): ClosingSoonScreen(), BehaviorCard(), buildDailyPickReason(), getDailySeed(), getGreeting(), getInitials(), HomeScreen(), InternshipCard (+10 more)

### Community 8 - "screens/SearchScreen.js"
Cohesion: 0.10
Nodes (27): buildStateRegex(), CategoryCard, CheckboxRow, COMPETITIVENESS_OPTIONS, dpStyles, FIELD_OPTIONS, FILTER_GROUPS, getDaysLeft() (+19 more)

### Community 9 - "implementation-baseline/matching.js"
Cohesion: 0.07
Nodes (58): ADJACENCY_GROUPS, ageFitLevel(), ageFromBirthday(), ALL_STATE_ABBREVS, CITY_TO_STATE, computeDaysLeft(), computeMatchBreakdown(), computeMatchReasons() (+50 more)

### Community 10 - "generate-carousels.cjs"
Cohesion: 0.21
Nodes (20): brand(), C, chip(), contactSheet(), cover(), esc(), footer(), fs (+12 more)

### Community 11 - "ChatScreen.js"
Cohesion: 0.10
Nodes (25): { height: SCREEN_H }, IDLE, sleep(), TourActionsContext, TourProvider(), TourStateContext, useTourTarget(), askGemini() (+17 more)

### Community 12 - "Architecture Overview"
Cohesion: 0.15
Nodes (11): Architecture Overview, Commands, Development, File-based Routing, graphify, Hooks and Utilities, Key Components, Navigation Structure (+3 more)

### Community 13 - "ErrorBoundary"
Cohesion: 0.20
Nodes (4): ErrorBoundary, Props, State, styles

### Community 14 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 15 - "parse-resume/index.ts"
Cohesion: 0.22
Nodes (3): CORS, GEMINI_API_KEYS, GEMINI_SUPPORTED_MIME_TYPES

### Community 17 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): expo/tsconfig.base, **/*.ts, **/*.tsx, compilerOptions, paths, strict, extends, include

### Community 18 - "gemini-chat/index.ts"
Cohesion: 0.40
Nodes (5): ADMIN_DEVICE_IDS, CORS, GEMINI_API_KEYS, isPremiumDevice(), json()

### Community 19 - "stripe-webhook/index.ts"
Cohesion: 0.60
Nodes (3): revokePremium(), sbHeaders(), upsertPremium()

### Community 20 - "app.json (Expo App Configuration)"
Cohesion: 0.67
Nodes (3): app.json (Expo App Configuration), App Icon (Blue Arrow), Android Adaptive Icon Foreground (Blue Chevron/Arrow)

### Community 22 - "ios"
Cohesion: 0.20
Nodes (10): ios, ITSAppUsesNonExemptEncryption, NSCalendarsFullAccessUsageDescription, NSCalendarsUsageDescription, NSRemindersUsageDescription, appleTeamId, buildNumber, bundleIdentifier (+2 more)

### Community 27 - "context/UserContext.js"
Cohesion: 0.09
Nodes (38): ACTIVE_STATUSES, DEFAULT_USER, makeId(), ONBOARDING_VERSION, NOTE: keep the setApplicationMap call OUTSIDE the setSavedIds updater,, STATUS_META, STATUSES, UserContext (+30 more)

### Community 39 - "Interny TikTok content system"
Cohesion: 0.17
Nodes (11): Admissions-stat post, Best repeatable series, Example six-slide carousel, Five-minute internship post, Generated work, Hook bank, Imported reference posts, Interny TikTok content system (+3 more)

### Community 40 - "permissions"
Cohesion: 0.15
Nodes (13): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, permissions, versionCode, android (+5 more)

### Community 41 - "Interny social creative brief"
Cohesion: 0.40
Nodes (4): Controlled test, Interny social creative brief, Required visual direction, Research basis

### Community 42 - "Premium / Payments / Essay Review — setup checklist"
Cohesion: 0.33
Nodes (5): 1. RevenueCat + in-app purchase (the $8 Premium unlock), 2. Chat rate limiting, 3. Essay review: real human pipeline, 4. More Premium upsell placements, Premium / Payments / Essay Review: setup checklist

### Community 43 - "revenuecat-webhook/index.ts"
Cohesion: 0.38
Nodes (5): ACTIVE_EVENTS, INACTIVE_EVENTS, revokePremium(), sbHeaders(), upsertPremium()

### Community 44 - "Internship Verification Workflow"
Cohesion: 0.33
Nodes (5): Internship Verification Workflow, `location_eligibility` entry format, Part 1: Master Prompt (source of truth, do not edit), Part 2: Structured-field addendum (REQUIRED on every pass), Part 3: Efficiency rules

### Community 45 - "notification"
Cohesion: 0.50
Nodes (4): notification, androidMode, color, icon

### Community 46 - "splash"
Cohesion: 0.50
Nodes (4): splash, backgroundColor, image, resizeMode

### Community 47 - "extra"
Cohesion: 0.40
Nodes (5): projectId, extra, eas, posthogApiKey, posthogHost

### Community 48 - "plugins"
Cohesion: 0.50
Nodes (4): plugins, expo-localization, expo-video, @react-native-community/datetimepicker

### Community 51 - "Q: Where are Interny's real brand assets and app screens for social creative?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Where are Interny's real brand assets and app screens for social creative?, Source Nodes

### Community 52 - "Photography prompts"
Cohesion: 0.50
Nodes (3): College profile cover, Internship search cover, Photography prompts

### Community 53 - "utils/matching.test.mjs"
Cohesion: 0.22
Nodes (5): baseUser, here, srcPath, tmpDir, tmpPath

### Community 56 - "dependencies"
Cohesion: 0.12
Nodes (17): expo, expo-calendar, expo-font, expo-notifications, dependencies, expo, expo-calendar, expo-font (+9 more)

### Community 58 - "rejected-implementation/utils/matching.js"
Cohesion: 0.09
Nodes (40): ADJACENCY_GROUPS, ageFitLevel(), ageFromBirthday(), ALL_STATE_ABBREVS, CITY_TO_STATE, describeLocationEntry(), detectGenderRequirement(), detectRaceRequirement() (+32 more)

### Community 61 - "implementation-baseline/utils/matching.js"
Cohesion: 0.09
Nodes (41): ADJACENCY_GROUPS, ageFitLevel(), ageFromBirthday(), ALL_STATE_ABBREVS, CITY_TO_STATE, describeLocationEntry(), detectGenderRequirement(), detectRaceRequirement() (+33 more)

### Community 66 - "Interny onboarding and match-score audit"
Cohesion: 0.08
Nodes (25): 10. Demographic purpose explanation does not cover analytics use — high, 1. Profile edits can leave Home and Search ranked using stale scores — high, 2. Unknown eligibility is displayed as a confident match — high, 3. “Stay local” does not establish a realistic commute — high, 4. School location is treated as home/residency — high, 5. Recommendation surfaces do not share one eligibility policy — high, 6. Missing answers receive invented fit points — medium/high, 7. “Prestige & selectivity” promises different behavior from the formula — medium (+17 more)

### Community 68 - "rejected-implementation/screens/ProfileScreen.js"
Cohesion: 0.08
Nodes (30): ProfileExtras(), s, useTourTarget(), AGE_OPTIONS, ALL_INTERESTS, computeProfileStrength(), EditProfileModal(), extractStateAbbrev() (+22 more)

### Community 73 - "rejected-implementation/screens/SearchScreen.js"
Cohesion: 0.10
Nodes (26): buildStateRegex(), CategoryCard, CheckboxRow, COMPETITIVENESS_OPTIONS, dpStyles, FIELD_OPTIONS, FILTER_GROUPS, getDaysLeft() (+18 more)

### Community 77 - "rejected-implementation/screens/HomeScreen.js"
Cohesion: 0.13
Nodes (25): DetailScreen(), BehaviorCard(), buildDailyPickReason(), getDailySeed(), getGreeting(), getInitials(), HomeScreen(), InternshipCard (+17 more)

### Community 78 - "rejected-implementation/context/UserContext.js"
Cohesion: 0.13
Nodes (19): ACTIVE_STATUSES, DEFAULT_USER, makeId(), ONBOARDING_VERSION, NOTE: keep the setApplicationMap call OUTSIDE the setSavedIds updater,, STATUS_META, STATUSES, UserContext (+11 more)

### Community 81 - "useUser"
Cohesion: 0.17
Nodes (16): ReminderTimingModal(), useUser(), react, react, AppPickerModal(), ESSAY_QUESTIONS, KIND_COLORS, MATERIAL_KINDS (+8 more)

### Community 82 - "App.js"
Cohesion: 0.10
Nodes (16): App(), ErrorBoundary, navigateToInternship(), parseInternshipIdFromUrl(), NOTE: no hardcoded height/paddingBottom, because overriding them, NOTE: loadInternships / subscribeToInternships are handled in App() below, RootNavigator(), Stack (+8 more)

### Community 83 - "implementation-baseline/OnboardingScreen.js"
Cohesion: 0.07
Nodes (20): BIRTHDAY_DEFAULT, BIRTHDAY_MAX, BIRTHDAY_MIN, birthdayToISO(), FORMAT_OPTIONS, formatBirthday(), GENDER_OPTIONS, GPA_OPTIONS (+12 more)

### Community 84 - "InterviewPrepScreen.js"
Cohesion: 0.31
Nodes (9): buildMockDeck(), InterviewPrepScreen(), shuffle(), styles, FIELD_ORDER, FIELD_QUESTIONS, FIELD_TIPS, GENERAL_QUESTIONS (+1 more)

### Community 85 - "computeMatchBreakdown"
Cohesion: 0.16
Nodes (20): { height: SCREEN_H }, IDLE, sleep(), TourActionsContext, TourProvider(), TourStateContext, buildFeatureTourSteps(), goTab() (+12 more)

### Community 86 - "screens/TrackerScreen.js"
Cohesion: 0.16
Nodes (16): APPLICATION_STATUSES, DECIDED_STATUSES, INTERNSHIPS, _listeners, loadInternships(), _notify(), refreshInternships(), rowToInternship() (+8 more)

### Community 87 - "review.js"
Cohesion: 0.47
Nodes (5): ReviewPromptModal(), getStoreReviewUrl(), openStoreReview(), requestNativeReview(), shouldShowReviewPrompt()

### Community 88 - "match-probes.mjs"
Cohesion: 0.29
Nodes (5): dir, program, results, root, student

### Community 89 - "implementation-baseline/screens/SearchScreen.js"
Cohesion: 0.10
Nodes (27): buildStateRegex(), CategoryCard, CheckboxRow, COMPETITIVENESS_OPTIONS, dpStyles, FIELD_OPTIONS, FILTER_GROUPS, getDaysLeft() (+19 more)

### Community 90 - "screens/OnboardingScreen.js"
Cohesion: 0.07
Nodes (23): BIRTHDAY_DEFAULT, BIRTHDAY_MAX, BIRTHDAY_MIN, birthdayToISO(), FORMAT_OPTIONS, formatBirthday(), GENDER_OPTIONS, GPA_OPTIONS (+15 more)

### Community 91 - "Q: Audit onboarding and match score in Interny"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Audit onboarding and match score in Interny, Source Nodes

### Community 92 - "screens/DetailScreen.js"
Cohesion: 0.14
Nodes (15): DETAIL_TABS, DetailScreen(), _FALLBACK_STATUS_META, _FALLBACK_STATUSES, matchColors(), matchLabel(), OverviewContent(), styles (+7 more)

### Community 93 - "implementation-baseline/ProfileScreen.js"
Cohesion: 0.08
Nodes (23): AGE_OPTIONS, ALL_INTERESTS, computeProfileStrength(), EditProfileModal(), extractStateAbbrev(), FORMAT_PREF_OPTIONS, GENDER_OPTIONS, getInitials() (+15 more)

### Community 94 - "implementation-baseline/screens/DetailScreen.js"
Cohesion: 0.09
Nodes (24): { height: SCREEN_H }, IDLE, sleep(), TourActionsContext, TourProvider(), TourStateContext, useTourTarget(), useUser() (+16 more)

### Community 95 - "implementation-baseline/context/UserContext.js"
Cohesion: 0.15
Nodes (21): ACTIVE_STATUSES, APPLICATION_STATUSES, DECIDED_STATUSES, DEFAULT_USER, makeId(), ONBOARDING_VERSION, NOTE: keep the setApplicationMap call OUTSIDE the setSavedIds updater,, STATUS_META (+13 more)

### Community 96 - "rejected-implementation/screens/DetailScreen.js"
Cohesion: 0.13
Nodes (14): MatchInsight(), MatchInsightModal(), s, ChecklistCard(), DETAIL_TABS, _FALLBACK_STATUS_META, _FALLBACK_STATUSES, OverviewContent() (+6 more)

### Community 97 - "computeMatchBreakdown"
Cohesion: 0.42
Nodes (9): computeMatchBreakdown(), priorityMult(), getCopy(), requestNotificationPermission(), resolveReminderDays(), scheduleAllReminders(), scheduleDiscoveryAlerts(), scheduleNewMatchAlerts() (+1 more)

### Community 98 - "implementation-baseline/screens/HomeScreen.js"
Cohesion: 0.16
Nodes (19): BehaviorCard(), buildDailyPickReason(), getDailySeed(), getGreeting(), getInitials(), HomeScreen(), InternshipCard, styles (+11 more)

### Community 99 - "computeMatchBreakdown"
Cohesion: 0.29
Nodes (9): buildFeatureTourSteps(), goTab(), computeMatchBreakdown(), getApplicationReadiness(), getProfileCoverage(), getRecommendationTier(), isItemExpired(), isRecommendable() (+1 more)

### Community 100 - "implement-matching.cjs"
Cohesion: 0.15
Nodes (12): ageEnd, ageStart, end, file, fs, locEnd, locStart, newScorer (+4 more)

### Community 101 - "implementation-baseline/matching.test.mjs"
Cohesion: 0.22
Nodes (5): baseUser, here, srcPath, tmpDir, tmpPath

### Community 102 - "root-updates.cjs"
Cohesion: 0.29
Nodes (6): file, fs, path, pkg, root, s

### Community 103 - "integrate-profile.cjs"
Cohesion: 0.33
Nodes (5): fs, p, path, root, s

### Community 104 - "catalog-polish.cjs"
Cohesion: 0.40
Nodes (4): a, b, fs, s

### Community 105 - "integrate-matching.cjs"
Cohesion: 0.40
Nodes (3): fs, path, root

### Community 106 - "refine-integration.cjs"
Cohesion: 0.40
Nodes (3): fs, path, root

### Community 107 - "ui-polish.cjs"
Cohesion: 0.40
Nodes (4): end, fs, s, start

### Community 108 - "rail-consistency.cjs"
Cohesion: 0.50
Nodes (3): fs, i, s

### Community 116 - "useUser"
Cohesion: 0.16
Nodes (12): APPLICATION_STATUSES, DECIDED_STATUSES, useUser(), ClosingSoonScreen(), styles, SavedScreen(), COLUMNS, getLiveDaysLeft() (+4 more)

### Community 119 - "package.json"
Cohesion: 0.22
Nodes (8): license, main, private, scripts, android, ios, start, web

### Community 122 - "restore-original.cjs"
Cohesion: 0.25
Nodes (6): archive, base, root, fs, path, s

### Community 123 - "rejected-implementation/utils/matching.test.mjs"
Cohesion: 0.29
Nodes (4): dir, here, item, user

### Community 125 - "Interny implementation and slideshow delivery — September 5, 2026"
Cohesion: 0.33
Nodes (5): Implemented, Interny implementation and slideshow delivery — September 5, 2026, Practical limits, Screenshot slideshow, Validation

### Community 126 - "last-coverage.cjs"
Cohesion: 0.50
Nodes (3): fs, i, s

## Ambiguous Edges - Review These
- `app/_layout.tsx` → `Partial React Logo (Atom Icon)`  [AMBIGUOUS]
  assets/images/partial-react-logo.png · relation: conceptually_related_to
- `app/_layout.tsx` → `React Logo (2x) Image Asset`  [AMBIGUOUS]
  assets/images/react-logo@2x.png · relation: conceptually_related_to

## Knowledge Gaps
- **563 isolated node(s):** `root`, `dir`, `student`, `program`, `results` (+558 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `app/_layout.tsx` and `Partial React Logo (Atom Icon)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `app/_layout.tsx` and `React Logo (2x) Image Asset`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `@react-native-community/datetimepicker` connect `plugins` to `screens/SearchScreen.js`, `rejected-implementation/screens/SearchScreen.js`, `implementation-baseline/OnboardingScreen.js`, `implementation-baseline/screens/SearchScreen.js`, `screens/OnboardingScreen.js`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `INTERNSHIPS` connect `screens/TrackerScreen.js` to `screens/SavedScreen.js`, `screens/HomeScreen.js`, `screens/SearchScreen.js`, `ChatScreen.js`, `rejected-implementation/context/UserContext.js`, `useUser`, `App.js`, `useUser`, `context/UserContext.js`, `implementation-baseline/context/UserContext.js`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `react` connect `useUser` to `dependencies`, `screens/ProfileScreen.js`, `rejected-implementation/screens/ProfileScreen.js`, `implementation-baseline/ProfileScreen.js`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `root`, `dir`, `student` to the rest of the system?**
  _563 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `explore.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07529411764705882 - nodes in this community are weakly interconnected._