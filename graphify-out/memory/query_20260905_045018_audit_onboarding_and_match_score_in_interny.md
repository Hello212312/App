---
type: "query"
date: "2026-09-05T04:50:18.095328+00:00"
question: "Audit onboarding and match score in Interny"
contributor: "graphify"
outcome: "useful"
source_nodes: ["computeMatchScore()", "getEligibilityStatus()", "OnboardingScreen.js"]
---

# Q: Audit onboarding and match score in Interny

## Answer

Expanded from graph vocabulary: onboarding match score profile eligibility interests grade. Audit only. Existing 34 checks pass; 15 read-only synthetic probes reproduce unknown eligibility hidden by scores, same-state commute overrating, grade-only 54 percent, featured boost, age text parsed as grade, ambiguous city state contamination. Source review confirms incomplete Home/Search scoring dependencies, Skip ends all setup, no draft resume, school location conflated with home. Full evidence in .codex/audits/2026-09-05/AUDIT.md. No app changes; screenshot slideshow pending audit review.

## Outcome

- Signal: useful

## Source Nodes

- computeMatchScore()
- getEligibilityStatus()
- OnboardingScreen.js