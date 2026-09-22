# Graph Report - my_app  (2026-08-08)

## Corpus Check
- 80 files · ~111,479 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 648 nodes · 1262 edges · 55 communities (40 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eae0da2e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- theme.js
- explore.tsx
- DetailScreen.js
- expo
- ProfileScreen.js
- matching.js
- package.json
- TrackerScreen.js
- SearchScreen.js
- OnboardingScreen.js
- PremiumTourOverlay.js
- ChatScreen.js
- InterviewPrepScreen.js
- ErrorBoundary
- reset-project.js
- parse-resume/index.ts
- dependencies
- tsconfig.json
- gemini-chat/index.ts
- stripe-webhook/index.ts
- app.json (Expo App Configuration)
- create-checkout/index.ts
- ios
- App Icon (Interny) - Blue 'A' Boomerang/Chevron Mark
- Existing Companies List
- UserContext.js
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
- App.js
- android
- permissions
- Premium / Payments / Essay Review — setup checklist
- revenuecat-webhook/index.ts
- Internship Verification Workflow
- notification
- splash
- extra
- plugins
- eslint.config.js
- metro.config.js
- useUser
- DeadlinesScreen.js
- matching.test.mjs

## God Nodes (most connected - your core abstractions)
1. `useUser()` - 37 edges
2. `computeMatchBreakdown()` - 25 edges
3. `getEffectiveDaysLeft()` - 23 edges
4. `Colors` - 20 edges
5. `Typography` - 20 edges
6. `Spacing` - 19 edges
7. `Radii` - 19 edges
8. `Shadows` - 19 edges
9. `expo` - 17 edges
10. `INTERNSHIPS` - 17 edges

## Surprising Connections (you probably didn't know these)
- `App Icon (Blue Arrow)` --references--> `app.json (Expo App Configuration)`  [INFERRED]
  assets/icon.png → app.json
- `app.json (Expo App Configuration)` --references--> `Android Adaptive Icon Foreground (Blue Chevron/Arrow)`  [INFERRED]
  app.json → assets/images/android-icon-foreground.png
- `navigateToInternship()` --references--> `INTERNSHIPS`  [EXTRACTED]
  App.js → data.js
- `RootNavigator()` --calls--> `useUser()`  [EXTRACTED]
  App.js → context/UserContext.js
- `App()` --calls--> `loadInternships()`  [EXTRACTED]
  App.js → data.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Theming System** — constants_theme, hooks_use_color_scheme, hooks_use_theme_color [EXTRACTED 1.00]
- **Navigation Structure** — app_layout, app_tabs_layout [EXTRACTED 1.00]

## Communities (55 total, 15 thin omitted)

### Community 0 - "theme.js"
Cohesion: 0.21
Nodes (11): ReviewPromptModal(), styles, styles, styles, styles, Colors, Radii, Shadows (+3 more)

### Community 1 - "explore.tsx"
Cohesion: 0.08
Nodes (30): unstable_settings, styles, styles, styles, TabLayout(), Partial React Logo (Atom Icon), React Logo Icon (PNG), React Logo (2x) Image Asset (+22 more)

### Community 2 - "DetailScreen.js"
Cohesion: 0.06
Nodes (34): ClosedBadge(), Divider(), MatchBreakdownModal(), mbStyles, SectionHeader(), styles, Tag(), { height: SCREEN_H } (+26 more)

### Community 3 - "expo"
Cohesion: 0.15
Nodes (12): expo, icon, name, newArchEnabled, orientation, owner, scheme, slug (+4 more)

### Community 4 - "ProfileScreen.js"
Cohesion: 0.07
Nodes (37): useTourTarget(), EssayReviewScreen(), styles, AGE_OPTIONS, ALL_INTERESTS, computeProfileStrength(), EditProfileModal(), extractStateAbbrev() (+29 more)

### Community 5 - "matching.js"
Cohesion: 0.08
Nodes (59): buildDailyPickReason(), getDailySeed(), getGreeting(), getInitials(), HomeScreen(), InternshipCard, styles, TodaysPickCard() (+51 more)

### Community 6 - "package.json"
Cohesion: 0.11
Nodes (17): eslint, eslint-config-expo, devDependencies, eslint, eslint-config-expo, @types/react, typescript, license (+9 more)

### Community 7 - "TrackerScreen.js"
Cohesion: 0.14
Nodes (22): CompanyLogo(), DeadlineBadge(), APPLICATION_STATUSES, DECIDED_STATUSES, INTERNSHIPS, _listeners, loadInternships(), _notify() (+14 more)

### Community 8 - "SearchScreen.js"
Cohesion: 0.12
Nodes (25): buildStateRegex(), CategoryCard, CheckboxRow, COMPETITIVENESS_OPTIONS, dpStyles, FIELD_OPTIONS, FILTER_GROUPS, getDaysLeft() (+17 more)

### Community 9 - "OnboardingScreen.js"
Cohesion: 0.07
Nodes (23): BIRTHDAY_DEFAULT, BIRTHDAY_MAX, BIRTHDAY_MIN, birthdayToISO(), FORMAT_OPTIONS, formatBirthday(), GENDER_OPTIONS, GPA_OPTIONS (+15 more)

### Community 10 - "PremiumTourOverlay.js"
Cohesion: 0.29
Nodes (4): PremiumTourOverlay(), styles, { width: SCREEN_W, height: SCREEN_H }, useTour()

### Community 11 - "ChatScreen.js"
Cohesion: 0.16
Nodes (16): askGemini(), buildCatalog(), buildProfileSummary(), buildSystemPrompt(), buildTrackerSummary(), CHAT_MODES, ChatScreen(), extractIds() (+8 more)

### Community 12 - "InterviewPrepScreen.js"
Cohesion: 0.31
Nodes (9): buildMockDeck(), InterviewPrepScreen(), shuffle(), styles, FIELD_ORDER, FIELD_QUESTIONS, FIELD_TIPS, GENERAL_QUESTIONS (+1 more)

### Community 13 - "ErrorBoundary"
Cohesion: 0.20
Nodes (4): ErrorBoundary, Props, State, styles

### Community 14 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 15 - "parse-resume/index.ts"
Cohesion: 0.25
Nodes (3): CORS, GEMINI_API_KEYS, GEMINI_SUPPORTED_MIME_TYPES

### Community 16 - "dependencies"
Cohesion: 0.04
Nodes (47): expo, expo-calendar, expo-clipboard, expo-dev-client, expo-document-picker, expo-file-system, expo-linking, expo-notifications (+39 more)

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

### Community 27 - "UserContext.js"
Cohesion: 0.10
Nodes (33): ACTIVE_STATUSES, DEFAULT_USER, makeId(), NOTE: keep the setApplicationMap call OUTSIDE the setSavedIds updater —, STATUS_META, STATUSES, UserContext, UserProvider() (+25 more)

### Community 39 - "App.js"
Cohesion: 0.16
Nodes (10): App(), ErrorBoundary, navigateToInternship(), parseInternshipIdFromUrl(), NOTE: no hardcoded height/paddingBottom — overriding them prevents, NOTE: loadInternships / subscribeToInternships are handled in App() below, RootNavigator(), Stack (+2 more)

### Community 40 - "android"
Cohesion: 0.29
Nodes (7): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, versionCode, android

### Community 41 - "permissions"
Cohesion: 0.33
Nodes (6): permissions, android.permission.POST_NOTIFICATIONS, android.permission.READ_CALENDAR, android.permission.RECEIVE_BOOT_COMPLETED, android.permission.SCHEDULE_EXACT_ALARM, android.permission.WRITE_CALENDAR

### Community 42 - "Premium / Payments / Essay Review — setup checklist"
Cohesion: 0.33
Nodes (5): 1. RevenueCat + in-app purchase (the $8 Premium unlock), 2. Chat rate limiting, 3. Essay review — real human pipeline, 4. More Premium upsell placements, Premium / Payments / Essay Review — setup checklist

### Community 43 - "revenuecat-webhook/index.ts"
Cohesion: 0.47
Nodes (5): ACTIVE_EVENTS, INACTIVE_EVENTS, revokePremium(), sbHeaders(), upsertPremium()

### Community 44 - "Internship Verification Workflow"
Cohesion: 0.33
Nodes (5): Internship Verification Workflow, `location_eligibility` entry format, Part 1 — Master Prompt (source of truth, do not edit), Part 2 — Structured-field addendum (REQUIRED on every pass), Part 3 — Efficiency rules

### Community 45 - "notification"
Cohesion: 0.50
Nodes (4): notification, androidMode, color, icon

### Community 46 - "splash"
Cohesion: 0.50
Nodes (4): splash, backgroundColor, image, resizeMode

### Community 47 - "extra"
Cohesion: 0.67
Nodes (3): projectId, extra, eas

### Community 48 - "plugins"
Cohesion: 0.67
Nodes (3): plugins, expo-video, @react-native-community/datetimepicker

### Community 51 - "useUser"
Cohesion: 0.20
Nodes (14): useUser(), react, react, AppPickerModal(), ESSAY_QUESTIONS, KIND_COLORS, MATERIAL_KINDS, MaterialCard() (+6 more)

### Community 52 - "DeadlinesScreen.js"
Cohesion: 0.25
Nodes (6): BUCKET_COLORS, BUCKET_LABELS, BUCKET_ORDER, bucketFor(), DeadlinesScreen(), styles

### Community 53 - "matching.test.mjs"
Cohesion: 0.29
Nodes (4): baseUser, here, srcPath, tmpPath

## Ambiguous Edges - Review These
- `app/_layout.tsx` → `Partial React Logo (Atom Icon)`  [AMBIGUOUS]
  assets/images/partial-react-logo.png · relation: conceptually_related_to
- `app/_layout.tsx` → `React Logo (2x) Image Asset`  [AMBIGUOUS]
  assets/images/react-logo@2x.png · relation: conceptually_related_to

## Knowledge Gaps
- **234 isolated node(s):** `Stack`, `Tab`, `TAB_ICONS`, `name`, `slug` (+229 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `app/_layout.tsx` and `Partial React Logo (Atom Icon)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `app/_layout.tsx` and `React Logo (2x) Image Asset`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `dependencies` connect `dependencies` to `useUser`, `package.json`?**
  _High betweenness centrality (0.142) - this node is a cross-community bridge._
- **Why does `react` connect `useUser` to `dependencies`, `ProfileScreen.js`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `@react-native-community/datetimepicker` connect `plugins` to `SearchScreen.js`, `OnboardingScreen.js`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TAB_ICONS` to the rest of the system?**
  _234 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `explore.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07529411764705882 - nodes in this community are weakly interconnected._