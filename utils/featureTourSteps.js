// utils/featureTourSteps.js
// Step definitions + copy for the first-launch feature tour (context/TourContext.js).
// Same spotlight engine as the premium tour: each step navigates to the real
// screen and points at the element where the feature lives. Replaces the old
// video-slide FeatureTourModal.
// Step shape: { id, kind?, navigate?, pushesDetail?, targetId, scrollId?,
//               tries?, holePadding?, title, body, stats?, fallback? }
// stats: [{ label, points, max }] rendered as breakdown rows in the tour card.

import { computeMatchBreakdown, isItemExpired } from './matching';

const goTab = (screen) => (nav) => nav?.navigate('Main', { screen });

export function buildFeatureTourSteps({ internships = [], user = {} } = {}) {
  // Open a real listing for the Detail-screen steps: first program still
  // accepting applications (falls back to anything, then to centered cards).
  const demoItem = internships.find((i) => !isItemExpired(i)) || internships[0] || null;

  // The user's actual score breakdown for the demo listing — shown as
  // statistics rows inside the match-score tour card.
  const breakdown = demoItem ? computeMatchBreakdown(demoItem, user) : null;
  const matchStats = breakdown?.categories?.map((c) => ({
    label: c.label,
    points: c.points,
    max: c.max,
  }));

  const detailSteps = demoItem
    ? [
        {
          id: 'match',
          navigate: (nav) => nav?.navigate('Detail', { item: demoItem }),
          pushesDetail: true,
          targetId: 'detail-match',
          holePadding: 10,
          title: 'Your match score',
          body: matchStats?.length
            ? `Every internship is scored against your profile, here's how ${demoItem.company}'s score breaks down for you. Tap the % badge on any listing to see this.`
            : 'Every internship is scored against your grade, interests, and location. Tap the badge on any listing to see exactly why, the closer to 100, the better the fit.',
          stats: matchStats,
          fallback: {
            title: 'Your match score',
            body: 'Every internship is scored 0–100 against your grade, interests, and location. The badge at the top of any listing shows the full breakdown.',
          },
        },
        {
          id: 'checklist',
          targetId: 'detail-checklist',
          scrollId: 'detail-scroll',
          title: 'Know exactly what you need',
          body: 'Every listing has a checklist of the steps and documents required to apply. Check things off as you go, progress saves automatically.',
          fallback: {
            title: 'Know exactly what you need',
            body: 'Open any internship to find its Application Checklist: every step and document required to apply, with progress that saves as you check things off.',
          },
        },
        {
          id: 'track',
          targetId: 'detail-track',
          holePadding: 10,
          title: 'Track every application',
          body: 'Tap Track to set your status: Applying, Submitted, Interviewing, Accepted, and more. The Tracker tab keeps your whole pipeline in one place.',
          fallback: {
            title: 'Track every application',
            body: 'Tap the Track button on any internship to set your status: Applying, Submitted, Interviewing, Accepted, and the Tracker tab keeps your whole pipeline in one place.',
          },
        },
      ]
    : [
        {
          id: 'match',
          navigate: goTab('Home'),
          targetId: null,
          title: 'Your match score',
          body: 'Every internship is scored 0–100 against your grade, interests, and location. The badge at the top of any listing shows the full breakdown.',
        },
        {
          id: 'checklist',
          targetId: null,
          title: 'Know exactly what you need',
          body: 'Open any internship to find its Application Checklist: every step and document required to apply, with progress that saves as you check things off.',
        },
        {
          id: 'track',
          targetId: null,
          title: 'Track every application',
          body: 'Tap the Track button on any internship to set your status: Applying, Submitted, Interviewing, Accepted, and the Tracker tab keeps your whole pipeline in one place.',
        },
      ];

  return [
    {
      id: 'intro',
      kind: 'intro',
      targetId: null,
      title: 'Welcome to Interny',
      body: 'Take a 30-second tour of the essentials, we’ll point at exactly where each one lives.',
    },
    ...detailSteps,
    {
      id: 'ai-chat',
      navigate: goTab('Ask'),
      targetId: 'chat-input',
      holePadding: 6,
      title: 'Ask the AI anything',
      body: 'Stuck on deadlines, essays, or where to apply? Ask right here, you get 3 questions a day free.',
    },
    {
      id: 'deadlines',
      navigate: goTab('Profile'),
      targetId: 'profile-deadlines',
      scrollId: 'profile-scroll',
      title: 'Never miss a deadline',
      body: 'Upcoming deadlines sorts everything by urgency. And on any listing, Add to Calendar saves the date straight to your phone.',
    },
    {
      id: 'filters',
      navigate: goTab('Search'),
      targetId: 'search-filter',
      holePadding: 10,
      title: 'Find exactly what fits',
      body: 'Filter by field, pay, format, difficulty, and deadline window. Results sort by how well each program matches your profile.',
    },
    {
      id: 'outro',
      kind: 'outro',
      targetId: null,
      title: 'That’s the tour!',
      body: 'Start on Home for today’s picks, or Search to explore everything. Good luck out there.',
    },
  ];
}
