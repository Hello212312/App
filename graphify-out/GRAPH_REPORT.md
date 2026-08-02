# Graph Report - .  (2026-07-08)

## Corpus Check
- 52 files · ~96,389 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 530 nodes · 956 edges · 39 communities (25 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.7)
- Token cost: 574,220 input · 0 output

## Community Hubs (Navigation)
- App Core & User Data
- Expo Router Boilerplate & Theming
- Internship Detail & Matching Screens
- Expo App Configuration
- Profile, Premium & Notifications
- Internship Matching Engine
- Package Dependencies
- Shared UI Components & Playbook/Deadlines
- Search Screen
- Onboarding Flow
- Premium Tour Feature
- AI Chat Screen
- Interview Prep Feature
- Error Boundary Component
- Reset Project Script
- Resume Parsing Edge Function
- Feature Tour Modal
- TypeScript Config
- Gemini Chat Edge Function
- Stripe Webhook Edge Function
- App Icon Assets
- Stripe Checkout Edge Function
- Supabase Client Setup
- Brand Icon Concept
- Company Data & README
- Adaptive Icon Asset
- Favicon Asset
- Android Icon Background Asset
- Android Monochrome Icon Asset
- Web Favicon Asset
- Splash Icon Asset
- Notification Icon Asset
- Root Splash Icon Asset
- Tour Match Asset
- Expo Readme

## God Nodes (most connected - your core abstractions)
1. `useUser()` - 39 edges
2. `getEffectiveDaysLeft()` - 24 edges
3. `computeMatchScore()` - 20 edges
4. `expo` - 17 edges
5. `SearchScreen()` - 16 edges
6. `INTERNSHIPS` - 15 edges
7. `HomeScreen()` - 15 edges
8. `computeMatchReasons()` - 14 edges
9. `DetailScreen()` - 13 edges
10. `subscribeToInternships()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `App Icon (Blue Arrow)` --references--> `app.json (Expo App Configuration)`  [INFERRED]
  assets/icon.png → app.json
- `app.json (Expo App Configuration)` --references--> `Android Adaptive Icon Foreground (Blue Chevron/Arrow)`  [INFERRED]
  app.json → assets/images/android-icon-foreground.png
- `TabLayout()` --indirect_call--> `HapticTab()`  [INFERRED]
  app/(tabs)/_layout.tsx → components/haptic-tab.tsx
- `DeadlinesScreen()` --calls--> `useUser()`  [EXTRACTED]
  screens/DeadlinesScreen.js → context/UserContext.js
- `EssayReviewScreen()` --calls--> `useUser()`  [EXTRACTED]
  screens/EssayReviewScreen.js → context/UserContext.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Theming System** — constants_theme, hooks_use_color_scheme, hooks_use_theme_color [EXTRACTED 1.00]
- **Navigation Structure** — app_layout, app_tabs_layout [EXTRACTED 1.00]

## Communities (39 total, 14 thin omitted)

### Community 0 - "App Core & User Data"
Cohesion: 0.06
Nodes (49): App(), ErrorBoundary, NOTE: no hardcoded height/paddingBottom — overriding them prevents, NOTE: loadInternships / subscribeToInternships are handled in App() below, RootNavigator(), Stack, Tab, TAB_ICONS (+41 more)

### Community 1 - "Expo Router Boilerplate & Theming"
Cohesion: 0.08
Nodes (30): unstable_settings, styles, styles, styles, TabLayout(), Partial React Logo (Atom Icon), React Logo Icon (PNG), React Logo (2x) Image Asset (+22 more)

### Community 2 - "Internship Detail & Matching Screens"
Cohesion: 0.09
Nodes (36): DETAIL_TABS, DetailScreen(), _FALLBACK_STATUS_META, _FALLBACK_STATUSES, matchColors(), matchLabel(), OverviewContent(), styles (+28 more)

### Community 3 - "Expo App Configuration"
Cohesion: 0.05
Nodes (41): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, permissions, versionCode, projectId (+33 more)

### Community 4 - "Profile, Premium & Notifications"
Cohesion: 0.08
Nodes (34): useTourTarget(), EssayReviewScreen(), PaywallScreen(), styles, ALL_INTERESTS, computeProfileStrength(), EditProfileModal(), extractStateAbbrev() (+26 more)

### Community 5 - "Internship Matching Engine"
Cohesion: 0.11
Nodes (39): ChecklistCard(), ADJACENCY_GROUPS, ALL_STATE_ABBREVS, CITY_TO_STATE, computeMatchReasons(), computeMatchScore(), detectGenderRequirement(), detectPayType() (+31 more)

### Community 6 - "Package Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, expo, expo-calendar, expo-clipboard, expo-document-picker, expo-file-system, expo-linking, expo-notifications (+27 more)

### Community 7 - "Shared UI Components & Playbook/Deadlines"
Cohesion: 0.11
Nodes (17): CompanyLogo(), styles, BUCKET_COLORS, BUCKET_LABELS, BUCKET_ORDER, bucketFor(), DeadlinesScreen(), styles (+9 more)

### Community 8 - "Search Screen"
Cohesion: 0.11
Nodes (27): buildStateRegex(), CategoryCard, CheckboxRow, COMPETITIVENESS_OPTIONS, dpStyles, FIELD_OPTIONS, FILTER_GROUPS, getDaysLeft() (+19 more)

### Community 9 - "Onboarding Flow"
Cohesion: 0.11
Nodes (10): GENDER_OPTIONS, GPA_OPTIONS, GRADES, INTERESTS, OnboardingScreen(), RACE_OPTIONS, READINESS_OPTIONS, SchoolStep() (+2 more)

### Community 10 - "Premium Tour Feature"
Cohesion: 0.16
Nodes (12): PremiumTourOverlay(), styles, { width: SCREEN_W, height: SCREEN_H }, { height: SCREEN_H }, IDLE, sleep(), TourActionsContext, TourProvider() (+4 more)

### Community 11 - "AI Chat Screen"
Cohesion: 0.21
Nodes (11): askGemini(), buildCatalog(), buildSystemPrompt(), ChatScreen(), extractIds(), getDeviceId(), getLoadingText(), sleep() (+3 more)

### Community 12 - "Interview Prep Feature"
Cohesion: 0.31
Nodes (9): buildMockDeck(), InterviewPrepScreen(), shuffle(), styles, FIELD_ORDER, FIELD_QUESTIONS, FIELD_TIPS, GENERAL_QUESTIONS (+1 more)

### Community 13 - "Error Boundary Component"
Cohesion: 0.20
Nodes (4): ErrorBoundary, Props, State, styles

### Community 14 - "Reset Project Script"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 15 - "Resume Parsing Edge Function"
Cohesion: 0.25
Nodes (3): CORS, GEMINI_API_KEYS, GEMINI_SUPPORTED_MIME_TYPES

### Community 16 - "Feature Tour Modal"
Cohesion: 0.29
Nodes (3): SLIDES, styles, { width: SCREEN_W, height: SCREEN_H }

### Community 17 - "TypeScript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, @/*

### Community 18 - "Gemini Chat Edge Function"
Cohesion: 0.40
Nodes (5): ADMIN_DEVICE_IDS, CORS, GEMINI_API_KEYS, isPremiumDevice(), json()

### Community 19 - "Stripe Webhook Edge Function"
Cohesion: 0.60
Nodes (3): revokePremium(), sbHeaders(), upsertPremium()

### Community 20 - "App Icon Assets"
Cohesion: 0.67
Nodes (3): app.json (Expo App Configuration), App Icon (Blue Arrow), Android Adaptive Icon Foreground (Blue Chevron/Arrow)

## Ambiguous Edges - Review These
- `_layout.tsx` → `Partial React Logo (Atom Icon)`  [AMBIGUOUS]
  assets/images/partial-react-logo.png · relation: conceptually_related_to
- `_layout.tsx` → `React Logo (2x) Image Asset`  [AMBIGUOUS]
  assets/images/react-logo@2x.png · relation: conceptually_related_to

## Knowledge Gaps
- **194 isolated node(s):** `styles`, `styles`, `unstable_settings`, `styles`, `styles` (+189 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `_layout.tsx` and `Partial React Logo (Atom Icon)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `_layout.tsx` and `React Logo (2x) Image Asset`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `useUser()` connect `App Core & User Data` to `Internship Detail & Matching Screens`, `Profile, Premium & Notifications`, `Internship Matching Engine`, `Shared UI Components & Playbook/Deadlines`, `Search Screen`, `Onboarding Flow`, `Premium Tour Feature`, `AI Chat Screen`, `Interview Prep Feature`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Dependencies` to `App Core & User Data`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `react` connect `App Core & User Data` to `Profile, Premium & Notifications`, `Package Dependencies`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `styles`, `styles`, `unstable_settings` to the rest of the system?**
  _197 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Core & User Data` be split into smaller, more focused modules?**
  _Cohesion score 0.05563093622795115 - nodes in this community are weakly interconnected._