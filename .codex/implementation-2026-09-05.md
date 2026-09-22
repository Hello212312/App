# Interny implementation and slideshow delivery — September 5, 2026

## Implemented

- Replaced the long onboarding sequence with four stages: basics, interests, practical limits, and a live-catalog preview. Drafts resume after interruption; skipping advances one question. Returning users keep their existing profile. Draft cleanup occurs only after the completed profile is saved.
- Separated home/base location from school attendance. Added format, commute distance, relocation/housing, and compensation preferences. School search, availability dates, and selectivity are optional profile details.
- Rebuilt matching as an explainable preference-fit percentage. Grade eligibility, practical constraints, and application readiness are separate. GPA, featured status, school mentions, and application materials no longer inflate the score. Incomplete core answers do not receive a fabricated percentage.
- Added explicit confirmation states for missing eligibility information, unknown compensation/location, age cutoff dates, and detected citizenship/GPA/coursework requirements. Written hybrid/on-site formats override contradictory remote flags. Closed programs and known practical/eligibility conflicts are excluded from recommendations.
- Updated Home, Search, closing-soon, similar/saved/tracker recommendations, feature-tour selection, and notification filtering to use the shared model. Profile changes and date changes invalidate matching calculations. Alerts require confirmed eligibility/practical checks and at least 70% preference fit.
- Added visible score explanations, profile completeness, and optional profile details. Detail screens show the program name before the fit card. The web navigation container now keeps scrolling content and footers within the viewport.
- Removed sensitive profile attributes from new analytics payloads and automatic touch capture. Existing historical analytics data was not changed.
- Added and synchronized dependencies needed to run and export the real web app. Existing unrelated workspace edits were preserved.

## Validation

- 57 behavior checks pass in utils/matching.test.mjs, covering incomplete profiles, hard/unknown eligibility, age cutoffs, commute limits, school versus residence, contradictory remote metadata, compensation, closed listings, recommendation consistency, and profile preservation.
- Targeted ESLint run: no errors; existing/advisory React hook and unused-variable warnings remain. Full output: implementation-lint.json.
- Production web export passes with two workers. An initial export exhausted memory with the default worker count; the bounded retry completed successfully.
- Actual browser flow verified: four-step onboarding, draft resume, preserved profile on editing, immediate interest-driven result updates, persistence after reload, saved item in Tracker, match modal, and mobile viewport scrolling. No runtime errors in the final verification session. Evidence: browser-verification.json.
- Updated the code graph. Its extractor does not cover SQL because the optional SQL parser is absent; no database schema changes were needed.

## Screenshot slideshow

Seven complete 1080 x 1920 PNG slides, original screenshots, a sequence preview, and finished post text are in assets/slideshow-2026-09-05/. The ZIP is the ready-to-download package.

The screenshots are genuine captures of the running local web app at a phone-sized viewport, not generated mockups. They use an unchanged snapshot of 811 real Supabase catalog rows fetched through a permitted connection because the screenshot browser could not access Supabase directly. The profile is a fresh demonstration profile entered through the app. Screenshot provenance and upload order are included in the package. No previous posts or videos were consulted.

## Practical limits

Native iOS/Android layouts, notification delivery, and keyboard behavior still need an on-device check; no emulator was available. Web export and browser interaction are verified. The preference percentage is a transparent comparison of declared preferences, not a trained or calibrated admission-probability model. Missing catalog requirements and dates remain confirmation checks; the matcher does not claim to parse every possible requirement from prose. No app deployment, database modification, or social publishing was performed.
