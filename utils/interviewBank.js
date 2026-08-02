// utils/interviewBank.js
// Interview prep question bank, organized by the same canonical fields used
// across the app (matching the DB tags). Written for high school students
// interviewing for internships, research programs, and pre-college programs.
// All questions are practice prompts, not claims about any specific program.
//
// Shape: every question is { q, hint } — the hint is a short coaching note on
// what a strong answer includes, revealed in the app when the card is opened.

export const GENERAL_QUESTIONS = [
  {
    q: 'Tell me about yourself.',
    hint: 'Not your life story. Give 60 seconds: who you are now, one or two things you have actually done, and why you are sitting in this interview. End on the program, not on yourself.',
  },
  {
    q: 'Why do you want to join this program specifically?',
    hint: 'Name something real about them: a project, a lab, what interns actually do. "To gain experience" fits every program on earth, so it says nothing about this one.',
  },
  {
    q: 'What do you hope to learn or accomplish this summer?',
    hint: 'Pick one concrete skill or outcome, not a list. "I want to learn how real research handles messy data" beats five vague goals.',
  },
  {
    q: 'Tell me about a time you worked on a team. What was your role?',
    hint: 'Say what YOU did, not what the team did. One specific moment, a disagreement resolved, a task rescued, is worth more than a summary of the whole project.',
  },
  {
    q: 'Describe a challenge you faced and how you handled it.',
    hint: 'Use STAR: Situation, Task, Action, Result. The Action is the part they care about, so spend most of your time there, and end with what changed.',
  },
  {
    q: 'What is a project or activity you are most proud of, and why?',
    hint: 'The "why" is the actual question. Pick something where you can explain a decision you made, not just a result you got.',
  },
  {
    q: 'How do you manage your time between school, activities, and commitments?',
    hint: 'They are asking whether you will actually show up. Describe a real system you use (calendar, priorities, saying no to things), with one example of it working.',
  },
  {
    q: 'Tell me about a time you received criticism. How did you respond?',
    hint: 'Pick real criticism, not a humblebrag. Strong answers show you changed something specific afterward, which is the whole point of the question.',
  },
  {
    q: 'Tell me about a time you failed at something.',
    hint: 'Do not dodge with "I care too much." Name a real failure, take responsibility without excuses, and spend most of the answer on what you did differently next time.',
  },
  {
    q: 'Describe a time you had to learn something completely new on your own.',
    hint: 'Walk through your actual process: what you tried first, where you got stuck, what resource finally worked. This is a preview of how you will handle the internship.',
  },
  {
    q: 'What would your teachers or teammates say about you?',
    hint: 'Pick one or two traits and back each with a tiny piece of evidence. "My robotics captain would say I am the one who stays late to fix things" is credible; a list of adjectives is not.',
  },
  {
    q: 'Tell me about a time you disagreed with someone. What happened?',
    hint: 'They want to see you disagree without being difficult. Show that you listened, explained your reasoning, and accepted the outcome, whichever way it went.',
  },
  {
    q: 'Where do you see yourself in five years?',
    hint: 'Nobody expects a real plan at your age. Show a direction and how this program is a logical step toward it. Curiosity plus a rough trajectory is the right answer.',
  },
  {
    q: 'What is something you are curious about that has nothing to do with school?',
    hint: 'This is a genuine-interest check. Anything real works, a hobby, a rabbit hole, a skill, as long as you can talk about it with actual energy for a minute.',
  },
  {
    q: 'Why should we pick you over other applicants?',
    hint: 'Do not rank yourself against people you have not met. Give the two or three specific things you bring: a skill, a work habit, a relevant project, and let them do the comparing.',
  },
  {
    q: 'What questions do you have for us?',
    hint: 'Always have at least two. Ask about the intern experience ("what does a typical week look like?", "what do your best interns do in the first two weeks?"), not facts already on their website.',
  },
];

export const GENERAL_TIPS = [
  'Prepare 2 or 3 short stories from school, clubs, or projects that you can adapt to almost any behavioral question.',
  'Use the STAR structure for behavioral answers: Situation, Task, Action, Result. Keep each answer under 2 minutes.',
  'Reread the program page the night before. Interviewers often ask why you chose them, and a specific answer stands out.',
  'Always bring at least two questions to ask. Asking nothing can read as low interest.',
  'Practice out loud, not in your head. Answers that sound fine silently often fall apart the first time you say them.',
  'It is fine to pause for a few seconds before answering. A thoughtful pause reads far better than a fast ramble.',
  'If you do not know something, say so and then say how you would find out. Bluffing is the one unforced error interviewers always catch.',
  'For virtual interviews, test your camera and microphone, look into the camera when speaking, and pick a quiet spot.',
  'Send a short thank you email within 24 hours. Mention one specific thing you discussed.',
];

export const FIELD_QUESTIONS = {
  Medicine: [
    {
      q: 'Why are you interested in medicine or healthcare?',
      hint: 'Anchor it in a real moment: a person, an experience, a class, not a general desire to help people. Everyone says they want to help people.',
    },
    {
      q: 'What do you think is the biggest challenge facing healthcare today?',
      hint: 'There is no right answer; they want to see you have thought about the field at all. Pick one issue you can actually say two or three informed sentences about.',
    },
    {
      q: 'How would you handle seeing something upsetting in a clinical or lab setting?',
      hint: 'They are screening for maturity, not toughness. Acknowledge it would affect you, then describe staying functional: focusing on the task, debriefing with a supervisor after.',
    },
    {
      q: 'Tell me about a time you showed empathy toward someone.',
      hint: 'Small and real beats big and vague. Noticing a struggling classmate and quietly acting on it is a better story than a generic volunteering summary.',
    },
    {
      q: 'What area of medicine interests you most right now, and why?',
      hint: '"Right now" is your permission slip: you are allowed to be unsure. Name one area and one concrete reason it caught your attention.',
    },
    {
      q: 'How do you handle situations where you have to follow strict rules or protocols?',
      hint: 'Healthcare runs on protocol, so do not present yourself as a rule-breaker. Show you understand WHY protocols exist (safety, consistency) with one example of following one carefully.',
    },
    {
      q: 'How do you handle being around people who are stressed, scared, or in pain?',
      hint: 'Show calm plus warmth: staying steady yourself while acknowledging the other person’s feelings. A babysitting, lifeguarding, or family-care example works fine.',
    },
    {
      q: 'A patient or family member is frustrated and raising their voice. What do you do?',
      hint: 'Stay calm, listen without interrupting, do not take it personally, and get a supervisor when it is beyond you. Knowing when to escalate IS the right answer at your level.',
    },
    {
      q: 'What have you done to explore medicine so far?',
      hint: 'Anything counts if you frame it honestly: biology classes, first-aid training, volunteering, books, shadowing. What matters is showing initiative, not access.',
    },
    {
      q: 'Why does patient confidentiality matter, and how would you handle overhearing private information?',
      hint: 'Simple and firm: private information stays private, even from friends and family, even when the story is interesting. Mentioning HIPAA by name is a nice touch, not a requirement.',
    },
  ],
  Engineering: [
    {
      q: 'Tell me about something you have built, fixed, or designed.',
      hint: 'Walk through decisions, not just the finished thing: what constraint you hit, what you tried, what you changed. The mess in the middle is the interesting part.',
    },
    {
      q: 'Walk me through how you approach a problem you have never seen before.',
      hint: 'Describe a repeatable process: break it down, find what you DO know, test the smallest piece first, ask for help at the right moment. Then attach one real example.',
    },
    {
      q: 'Describe a project that failed or did not work the first time. What did you change?',
      hint: 'Every engineer has these; pretending you do not is the wrong move. Name the failure plainly, diagnose the cause, and spend most of the answer on the fix.',
    },
    {
      q: 'What tools, software, or equipment have you used before?',
      hint: 'Be honest about your level with each: "comfortable", "used a few times", "just started". Inflating skill here backfires the first day they hand you the tool.',
    },
    {
      q: 'How do you balance doing something fast versus doing it right?',
      hint: 'The mature answer: it depends on what breaks if you are wrong. A prototype can be rough; anything safety-related or hard to undo cannot. Give an example of each if you can.',
    },
    {
      q: 'What kind of engineering interests you most, and what drew you to it?',
      hint: 'One field, one honest reason, one thing you have done about it. "Mechanical, because of robotics, and I have been the build lead for two seasons" is a complete answer.',
    },
    {
      q: 'How do you make sure something you built actually works?',
      hint: 'They are asking about testing. Talk about trying to break your own work, edge cases, and checking against requirements, not just "it worked when I ran it."',
    },
    {
      q: 'Tell me about a time you had to work within a constraint: budget, materials, time, or rules.',
      hint: 'Constraints are the job. Show that the limit forced a more creative or simpler design, not just a worse one.',
    },
    {
      q: 'If your design works but a teammate insists their approach is better, what do you do?',
      hint: 'Move it from opinions to evidence: compare against the requirements, test both if cheap, and commit to whichever wins. Show you can lose that argument gracefully too.',
    },
    {
      q: 'How do you document your work so someone else could pick it up?',
      hint: 'Any honest system counts: build logs, labeled diagrams, commented files, photos of wiring. The point is that you think about the next person at all.',
    },
  ],
  Science: [
    {
      q: 'What science topic could you talk about for ten minutes without preparing?',
      hint: 'This is an enthusiasm check. Pick the thing you actually go down rabbit holes about, and let them see the energy. Depth matters more than the topic being impressive.',
    },
    {
      q: 'Describe an experiment you did in class or on your own. What was your hypothesis?',
      hint: 'Use the structure: hypothesis, method, result, conclusion. Bonus points for naming a flaw in your own setup, since that is what real scientists do.',
    },
    {
      q: 'How would you explain a complicated concept to someone with no science background?',
      hint: 'Actually do it, live, with a concept you know. Use an analogy from everyday life. They are testing whether you understand it well enough to simplify it.',
    },
    {
      q: 'Tell me about a time your results surprised you. What did you do next?',
      hint: 'The right instinct: check for error first, then get curious. A surprising result is either a mistake or a discovery, and you find out by re-running, not by assuming.',
    },
    {
      q: 'Why is careful data recording important in research?',
      hint: 'Reproducibility. If it is not written down, it did not happen: no one can verify, repeat, or build on it. An example of a time sloppy notes cost you makes this concrete.',
    },
    {
      q: 'What would you do if your data did not support your hypothesis?',
      hint: 'The trap is saying you would find a way to make it fit. A negative result IS a result. Report it honestly, figure out why, and adjust the hypothesis, never the data.',
    },
    {
      q: 'What makes an experiment well-designed?',
      hint: 'Hit the basics in plain words: change one variable at a time, use a control, repeat the measurement, keep everything else constant. One example from a lab you did seals it.',
    },
    {
      q: 'How do you decide whether a scientific claim you read online is trustworthy?',
      hint: 'Source, evidence, replication: who published it, is there actual data, has anyone else found the same thing. Show you distinguish a study from a headline about a study.',
    },
    {
      q: 'Research involves a lot of repetition and failure. How do you handle tedious work?',
      hint: 'Do not pretend to love tedium. Say you understand WHY the repetition matters (reliable data) and describe how you stay accurate through it: checklists, breaks, routine.',
    },
    {
      q: 'If you could investigate any scientific question, what would it be?',
      hint: 'Any genuine question works, but make it a question, not a topic. "Why do some people never get cavities" is better than "teeth." Explain what hooked you on it.',
    },
  ],
  'Computer Science': [
    {
      q: 'What programming languages or tools have you used, and what did you make with them?',
      hint: 'Lead with what you BUILT, not the list. "Python: I made a bot that tracks sneaker prices" beats naming four languages you touched once in class.',
    },
    {
      q: 'Walk me through a coding project you are proud of. What was the hardest part?',
      hint: 'Structure it: what it does, one hard problem you hit, how you solved it. The hardest part is the actual question, so do not skip to the happy ending.',
    },
    {
      q: 'How do you debug something when you are stuck?',
      hint: 'Show a method: reproduce it, isolate it, read the error, print or step through, search precisely, then ask for help with what you already tried. That last part matters most.',
    },
    {
      q: 'Have you ever worked with version control or collaborated on code? How did it go?',
      hint: 'If yes, mention a real moment: a merge conflict, a code review, dividing work. If no, say so plainly and mention anything adjacent, like sharing a Replit or Google Colab.',
    },
    {
      q: 'What area of computing excites you most right now?',
      hint: 'Go one level deeper than the buzzword. "AI" is a headline; "I got curious how recommendation systems decide what I see" is a thought you actually had.',
    },
    {
      q: 'How do you learn a new technology or framework on your own?',
      hint: 'Describe your real loop: docs or tutorial, then immediately building something small and dumb with it. Learning by building is the answer they are hoping to hear.',
    },
    {
      q: 'Tell me about a bug that took you a long time to find. What was it?',
      hint: 'Every programmer has one and interviewers love this story. Tell it like a mystery: the symptom, the false leads, the moment you found it, and what you check for now.',
    },
    {
      q: 'How do you use AI coding tools, and where do you draw the line?',
      hint: 'Honesty wins here. Strong answer: you use them to learn and unblock, but you make sure you understand what the code does, because you are the one who has to debug it.',
    },
    {
      q: 'If your code works, why bother making it readable?',
      hint: 'Because code is read far more than it is written, by teammates and by you in three months. If you have ever been confused by your own old code, say so; that is the proof.',
    },
    {
      q: 'How would you explain what an algorithm is to someone who has never coded?',
      hint: 'Use a real-world analogy, a recipe, directions to school, then one concrete computing example. They are testing communication, not vocabulary.',
    },
  ],
  Arts: [
    {
      q: 'Walk me through a piece in your portfolio. What choices did you make and why?',
      hint: 'Pick the piece with the best story, not the prettiest result. Talk about decisions: what you tried, rejected, and kept, because "choices" is the actual question.',
    },
    {
      q: 'How do you handle creative feedback you disagree with?',
      hint: 'Show you can separate the note from your ego: understand what problem the feedback is pointing at, even if you solve it differently than suggested.',
    },
    {
      q: 'Describe your creative process from idea to finished work.',
      hint: 'Be honest about the messy middle: gathering references, false starts, revision. A real process with detours is more credible than a clean five-step system.',
    },
    {
      q: 'Which artists, designers, or creators influence you, and how does it show in your work?',
      hint: 'The second half is the real question. Name someone and point to a specific element of your work, a color habit, a composition, a technique, that traces back to them.',
    },
    {
      q: 'Tell me about a piece that pushed you outside your comfort zone.',
      hint: 'Growth is the theme: new medium, new scale, new subject. Say what scared you about it and what capability you walked away with.',
    },
    {
      q: 'How do you meet deadlines when the creative work is not flowing?',
      hint: 'Professionals ship anyway. Talk about your version of showing up: working in passes, lowering the stakes of a first draft, switching tasks, with one deadline you actually hit.',
    },
    {
      q: 'How do you know when a piece is finished?',
      hint: 'There is no right answer, which is why they ask it. Having ANY thoughtful criterion, the idea reads clearly, more polish stops adding, shows you reflect on your work.',
    },
    {
      q: 'Tell me about a piece that failed. What did you learn from it?',
      hint: 'Treat failed work as tuition. Name what specifically did not work: composition, concept, execution, and show that lesson appearing in a later piece.',
    },
    {
      q: 'How would you handle making work that fits someone else’s vision instead of your own?',
      hint: 'This is what commissioned and studio work IS. Strong answer: constraints are a creative puzzle, and you find room for your voice inside the brief, not instead of it.',
    },
    {
      q: 'What are you deliberately trying to get better at right now?',
      hint: 'Specific skill, current effort: "hands and foreshortening, so I do figure studies twice a week." It proves you practice deliberately instead of just producing.',
    },
  ],
  Business: [
    {
      q: 'Tell me about a time you led something, organized something, or sold something.',
      hint: 'Numbers make this answer: how many people, how much raised, what grew. Even small numbers ("we doubled bake sale revenue to $400") beat no numbers.',
    },
    {
      q: 'What business, brand, or company do you find interesting right now, and why?',
      hint: 'Go past liking the product; say something about HOW they operate: their pricing, their marketing, a decision they made. That is the difference between a customer and a business mind.',
    },
    {
      q: 'How would you prioritize tasks if you were given more work than time?',
      hint: 'Show a system: figure out what actually matters most (deadline, impact, who is blocked waiting on you), communicate early about what will slip, then execute. Not just "work harder."',
    },
    {
      q: 'Describe a time you had to persuade someone. What was your approach?',
      hint: 'The best persuasion stories start with listening. Show that you understood what the OTHER person cared about and framed your case in their terms.',
    },
    {
      q: 'What does good customer service look like to you?',
      hint: 'Ground it in one specific experience you had or delivered, then extract the principle: being heard, being helped fast, someone owning the problem to the end.',
    },
    {
      q: 'If you started a business tomorrow, what would it be and what is the first thing you would do?',
      hint: 'The second half is the test. "Talk to potential customers before building anything" is a first step that instantly signals you think like an operator, not a dreamer.',
    },
    {
      q: 'Tell me about a time something you organized went wrong. What did you do in the moment?',
      hint: 'Events and projects always break somewhere. Show calm triage: fix what is fixable now, communicate, and do the post-mortem after, not panic or blame.',
    },
    {
      q: 'How would you convince someone to buy something they were unsure about?',
      hint: 'Careful: the wrong answer is pressure. The right one: understand their hesitation, address it honestly, and accept that the right product for them might not be yours.',
    },
    {
      q: 'You are given a small budget to promote a school event. How do you spend it?',
      hint: 'Think out loud: who is the audience, where are they already looking, what is cheap but visible. There is no correct allocation; they want to hear structured reasoning.',
    },
    {
      q: 'What is something you saved up for or budgeted for? How did you manage it?',
      hint: 'Personal finance counts as business experience at your age. A concrete story about earning, saving, and trade-offs shows the instincts every business role needs.',
    },
  ],
  'Law/Advocacy': [
    {
      q: 'What issue do you care about, and what have you actually done about it?',
      hint: 'The word "actually" is the whole question. One real action, organizing, volunteering, writing, showing up, carries more weight than eloquent concern.',
    },
    {
      q: 'Tell me about a time you argued a position. How did you support it?',
      hint: 'Show the machinery: evidence gathered, sources checked, the strongest counterargument acknowledged. Winning is optional; arguing well is not.',
    },
    {
      q: 'How do you engage with people who strongly disagree with you?',
      hint: 'The skill on trial is steelmanning: can you state their view fairly before answering it? Contempt for the other side reads as a weakness in this field, not loyalty.',
    },
    {
      q: 'Describe a time you noticed something unfair. What did you do?',
      hint: 'Small and real wins: an excluded classmate, an unevenly enforced rule. What matters is that noticing turned into action, even a modest one.',
    },
    {
      q: 'Why does this kind of work matter to you personally?',
      hint: '"Personally" is the key word. Connect it to something you have seen or lived, not an abstract principle. Personal stake is what sustains people in this field.',
    },
    {
      q: 'How do you research a topic to make sure your information is reliable?',
      hint: 'Name real habits: primary sources over summaries, checking who funds or publishes a claim, reading the strongest version of both sides before forming a view.',
    },
    {
      q: 'Could you argue a side you personally disagree with? How?',
      hint: 'The answer they want is yes: understanding the best case for the other side is how lawyers and advocates prepare. Frame it as sharpening, not betraying, your position.',
    },
    {
      q: 'What is the difference between what is legal and what is right? Can you give an example?',
      hint: 'Any historical example works: segregation was legal, sheltering the persecuted has been illegal. They want to see you hold the two ideas apart and reason about the gap.',
    },
    {
      q: 'Tell me about a time you changed your own position on something.',
      hint: 'This tests intellectual honesty. Name what you believed, what evidence or conversation moved you, and what you think now. Never having changed your mind is the bad answer.',
    },
    {
      q: 'How would you make a complicated issue understandable to someone hearing about it for the first time?',
      hint: 'Advocacy IS translation. Pick an issue you know and actually do it in three or four sentences: the stakes, the sides, why it matters to the listener.',
    },
  ],
  Environment: [
    {
      q: 'What environmental issue matters most to you, and why?',
      hint: 'Local and specific beats global and vague. The creek behind your school is a better anchor than "climate change," and you can connect the local to the global from there.',
    },
    {
      q: 'Tell me about any hands-on outdoor, field, or sustainability work you have done.',
      hint: 'Cleanups, gardening, scouting, recycling drives, even hiking with observation: it all counts. If you have little, show eagerness for fieldwork honestly instead of padding.',
    },
    {
      q: 'Are you comfortable with physical outdoor work in different weather conditions?',
      hint: 'This is a practical staffing question, so answer it practically. A yes backed by one real example (sports, camping, yard work in July) is all they need.',
    },
    {
      q: 'How would you get people your age to care about an environmental issue?',
      hint: 'Skip guilt and doom, say so, in fact. Talk about making it local, social, and doable: what teens can touch, see, and do together this month.',
    },
    {
      q: 'Describe a time you worked on something bigger than yourself.',
      hint: 'The theme is contribution without credit: showing up for a goal you did not own and would not be praised for. Say what kept you motivated anyway.',
    },
    {
      q: 'What do you know about the local environment or ecosystems where you live?',
      hint: 'Anything genuine counts: your watershed, native trees, where the storm drains go, what got developed. Curiosity about your own square mile is exactly the trait they want.',
    },
    {
      q: 'How do you balance environmental protection against jobs and economic needs?',
      hint: 'Refusing to see the tension is the weak answer. Acknowledge the trade-off is real for real families, then talk about looking for solutions that serve both.',
    },
    {
      q: 'Field data collection means repeating the same measurement many times. How will you stay accurate?',
      hint: 'Connect boredom to stakes: one sloppy measurement can poison a whole dataset. Mention routines that protect accuracy: checklists, double-checking, consistent method.',
    },
    {
      q: 'What is one change you have made in your own life for environmental reasons?',
      hint: 'Small and true beats big and aspirational. One real change, plus honesty about what is hard to change, shows integrity rather than performance.',
    },
    {
      q: 'If you had funding to fix one environmental problem in your town, what would you do?',
      hint: 'Show a plan shape: name a specific local problem, a first step, and who you would need on board. Practicality is the impressive part, not the size of the vision.',
    },
  ],
  Journalism: [
    {
      q: 'What story in the news right now do you find most interesting, and why?',
      hint: 'Have one loaded and go a layer deeper than the headline: what question is still unanswered, what angle is being missed. That gap is where journalists live.',
    },
    {
      q: 'Tell me about something you have written, recorded, or published.',
      hint: 'School paper, a blog, a podcast, a long Instagram caption that did numbers: it counts. Walk through the making of it: the idea, the work, the response.',
    },
    {
      q: 'How would you approach interviewing someone who does not want to talk to you?',
      hint: 'Respect plus persistence: explain why their voice matters to the story, start with easy questions, accept a no gracefully, and know that pressuring sources backfires.',
    },
    {
      q: 'How do you check whether a source or claim is trustworthy?',
      hint: 'Name the craft: find the original source, confirm with a second independent one, check dates, ask who benefits from the claim spreading. Verification is the job.',
    },
    {
      q: 'Describe a time you had to meet a hard deadline.',
      hint: 'Journalism deadlines do not move, so show a story where you shipped on time, including what you cut or simplified to make it. Shipping imperfect beats missing perfect.',
    },
    {
      q: 'What makes a story worth telling?',
      hint: 'Have a personal answer: affects many people, reveals something hidden, gives voice to the unheard. Then attach one example story that fits your definition.',
    },
    {
      q: 'What is the difference between reporting and opinion writing?',
      hint: 'Reporting establishes what happened, verified; opinion argues what it means, labeled as such. Show you respect the line: blurring it is how outlets lose trust.',
    },
    {
      q: 'A friend is involved in a newsworthy story at school. Do you report it?',
      hint: 'A real ethics question with no painless answer. Strong response: disclose the conflict to your editor and hand the story off. Recognizing the conflict is the win.',
    },
    {
      q: 'You published something and then found an error in it. What do you do?',
      hint: 'Correct it fast, visibly, and without excuses: a correction note, not a quiet edit. How a writer handles being wrong is most of their credibility.',
    },
    {
      q: 'How do you get a good quote out of an interview?',
      hint: 'Ask open questions, then be quiet: silence pulls better quotes than follow-ups. Mention listening for the moment someone stops reciting and starts talking.',
    },
  ],
  History: [
    {
      q: 'What period or event in history fascinates you most, and why?',
      hint: 'Go narrow and get specific: one figure, one decision, one document. "The 1918 flu response in one city" reads as a historian; "World War 2" reads as a syllabus.',
    },
    {
      q: 'Tell me about a research paper or project you worked on. How did you find your sources?',
      hint: 'The methods are the answer: where you searched, how you judged what was credible, a dead end you hit. The hunt matters more than the topic.',
    },
    {
      q: 'What is the difference between a primary and secondary source, and why does it matter?',
      hint: 'Define both in one sentence each, then the "why": every secondary source is an interpretation, so historians go to the original whenever they can. An example makes it stick.',
    },
    {
      q: 'How do you evaluate whether a historical source is reliable?',
      hint: 'Interrogate it like a witness: who wrote it, when, for whom, and what did they want the reader to believe? Every source has a perspective, and reliability means accounting for it.',
    },
    {
      q: 'Why do you think studying history matters today?',
      hint: 'Skip "doomed to repeat it"; they have heard it a thousand times. Better: history explains why the present looks the way it does. One current issue with visible roots proves it.',
    },
    {
      q: 'Describe a time you changed your mind after learning new information.',
      hint: 'This is the historian’s core discipline: following evidence even when it costs you your thesis. A research example is ideal, but any honest reversal works.',
    },
    {
      q: 'Can history ever be told completely objectively? Why or why not?',
      hint: 'The nuanced answer: pure objectivity is impossible (every historian chooses what to include), but rigor, evidence, and owning your perspective get you close. Take a position.',
    },
    {
      q: 'Two primary sources describe the same event completely differently. What do you do?',
      hint: 'Do not just pick one. Ask why they differ: position, loyalty, timing, audience, and use the disagreement itself as evidence. That move IS historical thinking.',
    },
    {
      q: 'What do you think historians will say about the period we are living through now?',
      hint: 'A creative-thinking check: pick one or two defining threads and argue for them. There is no wrong answer, only an unreasoned one.',
    },
    {
      q: 'How is studying history different from memorizing dates and names?',
      hint: 'The difference is questions versus answers: history is arguing about causes and meaning from evidence. If a class or book flipped this switch for you, tell that story.',
    },
  ],
};

// Short field-specific advice shown alongside the general tips.
export const FIELD_TIPS = {
  Medicine: [
    'Programs know you are not a doctor yet. They are screening for maturity, reliability, and comfort around people, so lead with those.',
    'If you have any patient-adjacent experience (volunteering, caregiving, first aid), work it into at least one answer.',
    'Never guess on medical facts in an interview. "I don’t know, but here is how I would find out" is the professional answer.',
  ],
  Engineering: [
    'Bring the story of one build you know inside out. Most engineering questions can be answered through it.',
    'Photos or a short video of something you built, ready on your phone, can turn a good interview answer into a memorable one (ask before showing).',
    'Say "I tested it by..." at least once. Testing is the habit that separates builders from assemblers.',
  ],
  Science: [
    'Know your one best experiment cold: hypothesis, method, result, and, most impressively, its flaws.',
    'Curiosity is the trait being screened for. Let yourself be visibly excited about something specific.',
    'If asked about a concept you do not know, reason out loud from what you do know. Process beats trivia.',
  ],
  'Computer Science': [
    'Have one project you can whiteboard-explain in two minutes: what it does, how it works, the hardest bug.',
    'A link to your GitHub, Replit, or a live demo in your follow-up email is worth a paragraph of self-description.',
    'Be ready for the AI-tools question: nearly every CS interview now asks it. Honest and thoughtful beats defensive.',
  ],
  Arts: [
    'Curate your portfolio for the program: 5-8 strong, relevant pieces beat 20 mixed ones. Lead with your best.',
    'Practice talking about your work out loud. Describing visual decisions verbally is its own skill, and it is the one being tested.',
    'Bring one work-in-progress. Discussing unfinished work shows process, which interviews about art are really about.',
  ],
  Business: [
    'Attach a number to every story you can: people led, dollars raised, percent grown. Numbers are the language of the field.',
    'Know one real thing about the organization’s business, how it makes money, who its customers are, before you walk in.',
    'Trade-off thinking impresses: "we chose X, which cost us Y, because Z mattered more" sounds like an operator.',
  ],
  'Law/Advocacy': [
    'Precision of language is being graded the whole time. Avoid absolutes like "always" and "everyone knows."',
    'Practice stating the opposing side of your issue fairly. You will very likely be asked to.',
    'One story of concrete action on an issue outweighs any amount of passion expressed in the abstract.',
  ],
  Environment: [
    'Learn three concrete facts about your local environment: your watershed, a native species, a local issue. Local knowledge reads as genuine.',
    'Dress for the interview, but make clear you are ready for mud, heat, and repetition. Fieldwork reliability is a real screening factor.',
    'Frame environmental problems with solutions attached. Programs want builders, not mourners.',
  ],
  Journalism: [
    'Read the organization’s recent stories before the interview and reference one. It is the single easiest way to stand out.',
    'Bring writing samples, even informal ones. Evidence of writing beats claims about writing.',
    'Show curiosity about people, not just topics. Journalism interviews reward the applicant who asks good questions back.',
  ],
  History: [
    'Name-drop specifics: an era, a historian, a primary source you have actually read. Specificity is the field’s currency.',
    'Be ready to describe HOW you research, not just what you researched: archives, databases, evaluating sources.',
    'If you can connect your historical interest to a present-day question, do it. It shows you see history as alive.',
  ],
};

export const FIELD_ORDER = [
  'Medicine',
  'Engineering',
  'Science',
  'Computer Science',
  'Arts',
  'Business',
  'Law/Advocacy',
  'Environment',
  'Journalism',
  'History',
];
