# Internship Verification Workflow

This is the single source of truth for the recurring internship verification
process. It has three parts:

1. **Master Prompt**: the original verification instructions, unchanged.
2. **Structured-field addendum**: new columns every verification pass must
   also populate (added 2026-08-02; they power age, location, gender, and
   housing matching in the app).
3. **Efficiency rules**: how to spend fewer tokens per pass without reducing
   recommendation quality.

Run state lives in `internship_batch_tracker` (single row, `current_batch_start`).
Each run verifies 5 ids starting there, then advances the tracker. When past the
last id, reset the tracker to 0. Verification is never "finished"; cycles
continue indefinitely.

---

## Part 1: Master Prompt (source of truth, do not edit)

For id's 0-190: Research: go thru the __-__ id internshiup in supabase and verify that every single piece of information that u say is true. i dont want u to assume that it is true, i need u to factually verify it. idc how long u take but all of the information from them shud be true. It also shudnt be largely accurate, everypiece iof information shud be true. Thepdates shudnt be key findingfs, they shud be all findings. The url shud be accurate and verify the url is accurate by testing it and going to the website and seeing if it is accurate. location shud be 1 word answer unless it is in person where u write the place(the place should have the 2 letter abbreviationb e.g VA, FL). Only fill out grades(for this, only put the grades nothing else(e.g 9-12), thats it), acceptance rate, opens, deadline, field, tags, location. DONT FILL OUT SANYTHJIHNGN ELSE. The deadline should be accurate no matter what and if the deadline is rollin, keep the deadline date null. If the internship is not rolling, the Internship should have a deadline date no matter what. It should be your best estimate, either from the website or from what they had last year or something you can deduce based off of what they gave. In the text that you write, make sure there are NO EM DASHES AND NO \n showing. samwe for the fields. only fields shud be these: Medicine', 'Engineering', 'Science', 'Computer Science', 'Arts', 'Business', 'Law/Advocacy', 'Environment', Journalism, History, Astronomy, Social Science, and Psychology.  If it says multi-field, make sure to include all the fields inside the tags if it si multi field. after ur done with everything. veify u have met all requirements. Then, update in supabase

For id's 190-the end:

Research: go thru the 1-6 id internshiup in supabase and verify that every single piece of information that u say is true. i dont want u to assume that it is true, i need u to factually verify it. idc how long u take but all of the information from them shud be true. i dont want just the overview to be accurate, i want every single column to be accurate. It also shudnt be largely accurate, everypiece iof information shud be true. Thepdates shudnt be key findingfs, they shud be all findings. FILL OUT EVERY FIELD NO MATTER WHAT THE CODE SAYS AND DO IT ACCURATELY. The url shud be accurate and verify the url is accurate by testing it and going to the website and seeing if it is accurate. location shud be 1 word answer unless it is in person where u write the place(the place should have the 2 letter abbreviationb e.g VA, FL). fill out all columns. anything where the student gets paid means stipend so an horuly wage is tipend and not paaid. paid is where the students give the money. remove the tags that are not fields(e.g paid, remote, in person). try to make the fields that are not very long short answers(grades, paid, unpaid). For grades, only write the grades(e.g 9-12), nothing else, no extra info, everything else will be in requirements. LOOK AT MASTER PROMPTS AND LEARN EVEYRTHING ABT HOW TO SELECT FIELDS AND TAGS AND TERMS. learn where the application checklist field comes from and what it does in detailscreen.js. make it so that the application checklist is not directly derived from detail screen and actually makes sense. also, it shud be able to fit on the screen and not be ... at the end. The deadline should be accurate no matter what and if the deadline is rollin, keep the deadline date null. If the internship is not rolling, the Internship should have a deadline date no matter what. It should be your best estimate, either from the website or from what they had last year or something you can deduce based off of what they gave. In the text that you write, make sure there are NO EM DASHES AND NO \n showing. Also fill out required state so if like u are required to live in a state or a city or a place, then fill it out, if not then keep it null. Even though im not using it in the code rn, ill chnage it later so still populate it accurately. samwe for the fields. only fields shud be these: Medicine', 'Engineering', 'Science', 'Computer Science', 'Arts', 'Business', 'Law/Advocacy', 'Environment', Journalism, History, Astronomy, Social Science, and Psychology after ur done with everything. veify u have met all requirements. Then, update in supabase

start at the id of 40 so first time u run, internship batch tracker in supaabse should be set to 40 and each itme just do 5 id's each. also no matter what, don't think veirfiynng is ever finishe d bc half the info is hallucinated by u. even if every field is full, keep verifying. if u reached the last id of the supabase, reset teh tracker to 0.

here is master prompts:

All stuff on application checklist must be less than 42 char

Defining each Term:

Remote: Anything online where you DO not have to go somewhere. This can include any Hybrid internships too

In-person: Anything in-person where you DO not doit online. This can include any Hybrid internships too

Beginner Friendly: Program immediately accepts students into their program after they apply.(e.g Stem-E Internship)

Moderate: Program does take applicants but also has a selection process to take in applicants. It is moderately hard to get in, but it is not very hard to get in(e.g EDIT AI)

Competitive: Program is VERY HARD to get in. These are the top and most prestigious programs(e.g Anson Clark Scholars program)

Paid: Any program you have to pay tuition for and it doesnt matter if their is financial aid, you write paid if you have to pay money

Unpiad: Any pprgoram where you dont pay the program and they dont pay you

Stipend: A program where the program pays you and you dont pay the prgogram

Multi-Field: Any internship program that takes in multiple students from different majors. For example Anson Clark program lets you choose bio, cs, etc. You have to put this as a tag and if you put this as a tag, put everything else as a tag so like ["Multi-Field", Computer Scien, Medicine, etc] or smth like that.

Required_State: List the place if it is a city or a state, just list it. Only do it if the internship requires you to stay in a specific place, otherwise keep it null. Try to keep it like just the Abbreivation of the state like VA or if their is a citry do Aldie, VA.

Required_Race: List the race only if it is required to join the program, otherwise keep it null. Try to keep it simple like black, white, asian, hispanic etc.

Pre-college programs are academic enrichment courses hosted by universities that let high school students live on campus and experience college-level academics.

High school internships are temporary professional work experiences that allow students to develop real-world skills and complete projects within an actual working environment. [1, 2]

---

## Part 2: Structured-field addendum (REQUIRED on every pass)

Every time an internship is verified or reverified, ALSO populate these
columns from what the program's website actually says. These directly drive
match scores in the app, so accuracy here matters as much as deadlines.

| Column | Type | Rule |
|---|---|---|
| `min_age` | smallint | Minimum age required (e.g. 16 for "must be 16+"). NULL if the program states no age minimum. Do NOT infer from grades; only set when age is explicitly required. |
| `max_age` | smallint | Maximum age allowed (rare, e.g. "under 18"). NULL if none. |
| `required_gender` | text | `female` \| `male` \| `nonbinary`, ONLY when the program explicitly restricts to that gender (e.g. "girls only", "must identify as female"). NULL otherwise. A program that merely *encourages* a group is NOT restricted, so leave NULL. |
| `location_eligibility` | jsonb | JSON array of the places a student may live or attend school to be eligible; matching ANY entry qualifies. NULL if no residency restriction. This is the structured replacement for `Required_State` (still fill `Required_State` per the Master Prompt for backward compatibility). |
| `housing` | text | For in-person programs: `provided` (dorms/housing included), `optional` (housing available for a fee or on request), `none` (student must commute daily or arrange own housing). NULL for remote programs or when the website doesn't say. |
| `verified_at` | timestamptz | Set to `now()` at the end of the pass. |
| `verification_count` | integer | Increment by 1 at the end of the pass. |

### `location_eligibility` entry format

`{"type": "<state|city|county|zip|district|region>", "value": "<name or zip>", "state": "XX"}`

`state` is the 2-letter state context for every non-state type. Examples:

- Must live in Virginia → `[{"type":"state","value":"VA"}]`
- CA, NV, or AZ residents → `[{"type":"state","value":"CA"},{"type":"state","value":"NV"},{"type":"state","value":"AZ"}]`
- Boston or Cambridge residents → `[{"type":"city","value":"Boston","state":"MA"},{"type":"city","value":"Cambridge","state":"MA"}]`
- Broward County students → `[{"type":"county","value":"Broward County","state":"FL"}]`
- Fairfax County Public Schools students → `[{"type":"district","value":"Fairfax County Public Schools","state":"VA"}]`
- Within 40 miles of Bethesda, MD → `[{"type":"region","value":"within 40 mi of Bethesda","state":"MD"}]` (plus separate state entries for each state that falls in range, e.g. DC/MD/VA)
- Specific ZIP codes → `[{"type":"zip","value":"10027","state":"NY"}]`

"US citizens/residents only" is NOT a location restriction, so leave NULL.
A congressional-district requirement (e.g. House internships) is
`[{"type":"region","value":"your congressional district"}]` with no state.

---

## Part 3: Efficiency rules

Goal: keep every pass cheap while never letting matching-critical data go stale.

**Tier A: verify EVERY pass (matching-critical):**
`url` (test it), `deadline` + `deadline_date`, `Grades`, `min_age`/`max_age`,
`location(Remote/InPerson,Hybrid)`, `location_eligibility` + `Required_State`,
`required_gender`, `Required_Race`, `housing`, `Paid/Unpaid/Stipend`,
`competitiveness`, `field` + `tags`, `Opens`, `AcceptanceRate`.

**Tier B: verify only while `verification_count < 3` (cosmetic/stable):**
`overview` wording, `requirements` prose polish, `how_to_apply`,
`ApplicationChecklist` phrasing, `duration`, `role`/`company` naming,
`PreCollege/Internship`. After a row has survived 3 full passes, only touch a
Tier B field if a Tier A check reveals the program materially changed (new
website, new format, program renamed or discontinued).

**Always:**
- If the program is discontinued or the URL is dead with no replacement, note it
  in the row rather than inventing data.
- Never consider verification finished. When the tracker passes the last id,
  reset `current_batch_start` to 0 and start the next cycle.
- Set `verified_at = now()` and `verification_count = verification_count + 1`
  on every row touched, even when nothing needed changing; that's what lets
  the Tier B skip rule work.
- Keep batches at 5 ids per run.
