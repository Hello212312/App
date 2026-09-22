# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

### Development
- `npm install` - Install dependencies
- `npx expo start` - Start the Expo development server
- `npm run android` - Start Expo for Android
- `npm run ios` - Start Expo for iOS
- `npm run web` - Start Expo for web

### Project Management
- `npm run reset-project` - Reset to the starter template (moves current code to app-example and creates a blank app directory)

### Testing and Linting
- Linting: ESLint is configured with Expo's standard config. Run with `npx eslint .`
- Testing: No test framework is configured by default. Add one if needed.

## Architecture Overview

This is an Expo project using React Native with TypeScript. The app uses file-based routing via expo-router.

### Navigation Structure
- Root layout: `app/_layout.tsx` sets up the navigation container with theme provider and error boundary
- Tab navigation: `app/(tabs)/_layout.tsx` defines the bottom tab navigation (Home and Explore tabs)
- Routes are automatically created based on file structure in the `app` directory

### Theming
- Theme switching between light and dark modes
- Colors defined in `constants/theme.ts` with light/dark variants
- Theme provider wraps the entire app and uses the `useColorScheme` hook
- Fonts are platform-specific (iOS, Android, web)

### Key Components
- `ErrorBoundary` at the root level for error handling
- `HapticTab` for haptic feedback on tab presses
- `IconSymbol` for tab icons
- `useColorScheme` hook for theme detection

### Hooks and Utilities
- `useColorScheme` in `hooks/use-color-scheme.ts` for detecting system theme
- `useColorScheme.web.ts` for web implementation
- `useThemeColor` in `hooks/use-theme-color.ts` for theme-aware colors

### File-based Routing
- Routes are automatically generated from the `app` directory structure
- Special syntax: `(tabs)` creates a tab navigator, `[id]` creates dynamic routes

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
