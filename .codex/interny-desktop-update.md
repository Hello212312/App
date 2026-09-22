# Interny desktop update — 2026-09-08

Site: appgprj_6a9c41ce053c819193a96cbe707ce020
Checkout: .codex/interny-site-review
Saved version: 7
Version ID: appgprj_6a9c41ce053c819193a96cbe707ce020~appgver_a4b9d690a25081919c094fdf8f04aa82
Pushed commit: 1eb6ed258e468119f0407280d35c5959a87bbe28
Archive: .codex/interny-desktop-release.tar.gz

Desktop sidebar, responsive two-column feed, search categories and aligned results, tracker columns, split detail layout, bounded forms. All existing data/actions retained in the browser app. Onboarding uses profile state to conditionally register routes; stale restored onboarding routes cannot block completion, and blocked sessionStorage cannot interrupt navigation. Original native app is untouched.

Validation: five navigation regression tests passed; Expo export and Vinext production build passed; package helper succeeded and required archive files verified. Existing browser-app lint issues remain (native notification exports behind platform guards, existing compiler suppressions and typing rules). No interactive browser QA because Sites skill requires an explicit request for it. Graphify update completed.

NOT DEPLOYED. Sites tool instructions require explicit publishing authorization for an existing site; request it now that version 7 is saved. Access was verified owner-private (one owner, no groups/external visitors). After authorization re-read current site/access, publish the exact saved version 7, and wait for terminal status. Local preview started at http://localhost:3000/internships; open_in_codex returned queued. Dev session: 45979. Account usage last checked 61% five-hour / 25% weekly; user requires staying below 100%, with no reset or credit use authorized.

## Standing publishing authorization — 2026-09-09
User explicitly requested: always publish after making changes. For this Interny Site, publish completed updates automatically to its existing audience without asking again. Version 7 publication authorized.

Version 7 successfully published on 2026-09-09. Deployment: appgdep_6aa13ac218308191ad0f77e45b83634d. Live: https://interny-next-move.bru676741mango.chatgpt.site/internships. This supersedes the NOT DEPLOYED status above.
