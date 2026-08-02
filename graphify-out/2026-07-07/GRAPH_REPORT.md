# Graph Report - .  (2026-07-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 473 nodes · 969 edges · 28 communities (19 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.62)
- Token cost: 951 input · 62 output

## Graph Freshness
- Built from commit: `3e2d01dc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- UI Design System
- App Navigation Layouts
- Core Navigation Logic
- Expo App Configuration
- Home Screen Components
- UserContext.js
- dependencies
- ProfileScreen.js
- SearchScreen.js
- ChatScreen.js
- OnboardingScreen.js
- ErrorBoundary
- reset-project.js
- index.ts
- tsconfig.json
- index.ts
- index.ts
- eslint_config.js
- metro_config.js
- index.ts
- Existing Companies List
- Adaptive Icon
- Splash Icon
- Tour Match UI Fragment
- Expo Internal README

## God Nodes (most connected - your core abstractions)
1. `useUser()` - 35 edges
2. `getEffectiveDaysLeft()` - 24 edges
3. `computeMatchScore()` - 19 edges
4. `Colors` - 18 edges
5. `Typography` - 18 edges
6. `expo` - 17 edges
7. `Spacing` - 17 edges
8. `Radii` - 17 edges
9. `SearchScreen()` - 16 edges
10. `Shadows` - 16 edges

## Surprising Connections (you probably didn't know these)
- `RootNavigator()` --calls--> `maybeRequestReview()`  [EXTRACTED]
  App.js → utils/review.js
- `TabLayout()` --indirect_call--> `HapticTab()`  [INFERRED]
  app/(tabs)/_layout.tsx → components/haptic-tab.tsx
- `UserProvider()` --calls--> `subscribeToInternships()`  [EXTRACTED]
  context/UserContext.js → data.js
- `ChatScreen()` --calls--> `useUser()`  [EXTRACTED]
  screens/ChatScreen.js → context/UserContext.js
- `ChecklistCard()` --calls--> `useUser()`  [EXTRACTED]
  screens/DetailScreen.js → context/UserContext.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Theming System** — constants_theme, hooks_use_color_scheme, hooks_use_theme_color [EXTRACTED 1.00]
- **Navigation Structure** — app_layout, app_tabs_layout [EXTRACTED 1.00]

## Communities (28 total, 9 thin omitted)

### Community 0 - "UI Design System"
Cohesion: 0.08
Nodes (39): ClosedBadge(), CompanyLogo(), DeadlineBadge(), Divider(), styles, Tag(), styles, BUCKET_COLORS (+31 more)

### Community 1 - "App Navigation Layouts"
Cohesion: 0.09
Nodes (26): unstable_settings, styles, styles, styles, TabLayout(), ExternalLink(), Props, HapticTab() (+18 more)

### Community 2 - "Core Navigation Logic"
Cohesion: 0.07
Nodes (33): ErrorBoundary, NOTE: no hardcoded height/paddingBottom — overriding them prevents, NOTE: loadInternships / subscribeToInternships are handled in App() below, RootNavigator(), Stack, Tab, TAB_ICONS, useUser() (+25 more)

### Community 3 - "Expo App Configuration"
Cohesion: 0.05
Nodes (41): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, package, permissions, versionCode, projectId (+33 more)

### Community 4 - "Home Screen Components"
Cohesion: 0.11
Nodes (39): SectionHeader(), OverviewContent(), buildDailyPickReason(), getDailySeed(), getGreeting(), getInitials(), HomeScreen(), InternshipCard (+31 more)

### Community 5 - "UserContext.js"
Cohesion: 0.10
Nodes (30): ACTIVE_STATUSES, APPLICATION_STATUSES, DECIDED_STATUSES, DEFAULT_USER, makeId(), STATUSES, UserContext, UserProvider() (+22 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (33): dependencies, expo, expo-calendar, expo-clipboard, expo-document-picker, expo-file-system, expo-linking, expo-notifications (+25 more)

### Community 7 - "ProfileScreen.js"
Cohesion: 0.10
Nodes (26): STATUS_META, EssayReviewScreen(), styles, ALL_INTERESTS, computeProfileStrength(), EditProfileModal(), extractStateAbbrev(), getInitials() (+18 more)

### Community 8 - "SearchScreen.js"
Cohesion: 0.11
Nodes (27): buildStateRegex(), CategoryCard, CheckboxRow, COMPETITIVENESS_OPTIONS, dpStyles, FIELD_OPTIONS, FILTER_GROUPS, getDaysLeft() (+19 more)

### Community 9 - "ChatScreen.js"
Cohesion: 0.12
Nodes (20): App(), _listeners, loadInternships(), _notify(), refreshInternships(), rowToInternship(), subscribeToInternships(), askGemini() (+12 more)

### Community 10 - "OnboardingScreen.js"
Cohesion: 0.12
Nodes (7): GPA_OPTIONS, GRADES, INTERESTS, OnboardingScreen(), READINESS_OPTIONS, styles, US_STATES

### Community 11 - "ErrorBoundary"
Cohesion: 0.20
Nodes (4): ErrorBoundary, Props, State, styles

### Community 12 - "reset-project.js"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 13 - "index.ts"
Cohesion: 0.25
Nodes (3): CORS, GEMINI_API_KEYS, GEMINI_SUPPORTED_MIME_TYPES

### Community 14 - "tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, paths, strict, extends, include, @/*

### Community 15 - "index.ts"
Cohesion: 0.40
Nodes (3): ADMIN_DEVICE_IDS, CORS, GEMINI_API_KEYS

## Knowledge Gaps
- **168 isolated node(s):** `Stack`, `Tab`, `TAB_ICONS`, `name`, `slug` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `Core Navigation Logic`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `react` connect `Core Navigation Logic` to `dependencies`, `ProfileScreen.js`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `useUser()` connect `Core Navigation Logic` to `UI Design System`, `Home Screen Components`, `UserContext.js`, `ProfileScreen.js`, `SearchScreen.js`, `ChatScreen.js`, `OnboardingScreen.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **What connects `Stack`, `Tab`, `TAB_ICONS` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Design System` be split into smaller, more focused modules?**
  _Cohesion score 0.07562008469449485 - nodes in this community are weakly interconnected._
- **Should `App Navigation Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.0851063829787234 - nodes in this community are weakly interconnected._
- **Should `Core Navigation Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.06871035940803383 - nodes in this community are weakly interconnected._