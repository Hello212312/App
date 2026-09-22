// utils/premiumTourSteps.js
// Step definitions + copy for the premium unlock tour (context/TourContext.js).
// Each step: { id, kind?, navigate?, pushesDetail?, targetId, scrollId?,
//              tries?, holePadding?, title, body, fallback? }
// targetId: null renders a centered card; `fallback` is the copy shown when a
// targeted element can't be measured (not mounted / virtualized away).

const goTab = (screen) => (nav) => nav?.navigate('Main', { screen });

export function buildPremiumTourSteps({ savedIds = [], internships = [] } = {}) {
  return [
    {
      id: 'intro',
      kind: 'intro',
      targetId: null,
      title: 'You’re Premium',
      body: 'Everything is unlocked. Take a 30-second tour of exactly where each premium tool lives.',
    },
    {
      id: 'ai-chat',
      navigate: goTab('Ask'),
      targetId: 'chat-input',
      holePadding: 6,
      title: 'Unlimited AI chat',
      body: 'The 3-questions-a-day limit is gone. Ask about deadlines, essays, or where to apply, as much as you want.',
    },
    {
      id: 'essay-review',
      navigate: goTab('Profile'),
      targetId: 'profile-essay',
      scrollId: 'profile-scroll',
      title: 'Essay review',
      body: 'Submit up to 2 essays a month. A human reviews them and emails you personal feedback within 3 to 5 days.',
    },
    {
      id: 'interview-prep',
      navigate: goTab('Profile'),
      targetId: 'profile-interview',
      scrollId: 'profile-scroll',
      title: 'Interview prep',
      body: '100+ practice questions with coaching hints for your field, plus a mock interview mode that quizzes you one question at a time.',
    },
    {
      id: 'guide',
      navigate: goTab('Profile'),
      targetId: 'profile-guide',
      scrollId: 'profile-scroll',
      title: 'How to apply',
      body: 'The full guide to landing an internship: requirements, application forms, resumes, a deep dive on essay writing, recommendations, and timing.',
    },
    {
      id: 'reminders',
      navigate: goTab('Profile'),
      targetId: 'profile-reminders',
      scrollId: 'profile-scroll',
      title: 'Smarter reminders',
      body: 'Reminders can now fire up to 30 days before a deadline. Tap Reminder timing to choose your schedule.',
    },
    {
      id: 'outro',
      kind: 'outro',
      targetId: null,
      title: 'That’s everything, enjoy!',
      body: 'You can find all of this anytime from your Profile. Good luck out there.',
    },
  ];
}
