// screens/ApplicationGuideScreen.js
// Premium: a single, complete reference on how to apply to internships well.
// Weighted deliberately: most of the guide is about applying and essay
// writing, because that's where applications are won or lost.

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

function Section({ icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={16} color={Colors.accent} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Bullet({ children }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function DoDont({ dos, donts }) {
  return (
    <View style={styles.doDontWrap}>
      <View style={[styles.doDontCol, { marginRight: Spacing[2] }]}>
        <View style={styles.doDontHeader}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={[styles.doDontLabel, { color: Colors.success }]}>Do</Text>
        </View>
        {dos.map((d, i) => <Text key={i} style={styles.doDontText}>{d}</Text>)}
      </View>
      <View style={styles.doDontCol}>
        <View style={styles.doDontHeader}>
          <Ionicons name="close-circle" size={14} color={Colors.error} />
          <Text style={[styles.doDontLabel, { color: Colors.error }]}>Don’t</Text>
        </View>
        {donts.map((d, i) => <Text key={i} style={styles.doDontText}>{d}</Text>)}
      </View>
    </View>
  );
}

export default function ApplicationGuideScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.proPill}>
          <Ionicons name="rocket" size={11} color={Colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.proPillText}>PREMIUM</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How to Actually Get an Internship</Text>
        <Text style={styles.subtitle}>
          The full playbook -- how to pick targets, get every requirement right, and write essays that get read twice.
        </Text>

        <Section icon="compass-outline" title="1. Pick targets, don't spray">
          <Text style={styles.body}>
            Applying to 40 programs with the same generic answers loses to applying to 8
            programs you can speak specifically about. Reviewers read hundreds of
            applications a season -- the ones that name their actual lab, actual product,
            or actual local chapter stand out immediately.
          </Text>
          <Bullet>Build a list of 6-10 programs sorted into reach / match / safety, the same way you’d think about colleges.</Bullet>
          <Bullet>For each one, write one sentence on why *this* program specifically -- not “gain experience,” but the actual thing they do that you want to learn.</Bullet>
          <Bullet>Rolling-admission programs (open, first-come) reward speed. Selective ones reward depth. Know which kind you’re applying to before you decide how much time to spend.</Bullet>
        </Section>

        <Section icon="reader-outline" title="2. Read the requirements before anything else">
          <Text style={styles.body}>
            More applications die on missed requirements than on weak essays. Before you
            write a word, read the full listing twice and build a checklist per program.
          </Text>
          <Bullet>Check eligibility first: grade level, age, location, citizenship or residency, GPA cutoffs. If you don’t qualify, no essay fixes that -- move on and save the hours.</Bullet>
          <Bullet>List every required item: essays (with word limits), transcript, recommendation letters, resume, portfolio, parent/guardian forms. Miss one and many programs never review the rest.</Bullet>
          <Bullet>Request your transcript early -- school offices can take a week or more, and they’re slowest right before common deadlines.</Bullet>
          <Bullet>Note the format each item needs (PDF vs. pasted text, file size limits, naming rules). Fixing format at the deadline is how uploads fail.</Bullet>
          <Bullet>Keep one folder per program with everything in it, and track status in this app’s Tracker so nothing slips.</Bullet>
        </Section>

        <Section icon="clipboard-outline" title="3. The application form itself">
          <Text style={styles.body}>
            The form fields around your essay get read too, and sloppy ones undercut a
            strong essay. Treat every box as part of the application.
          </Text>
          <Bullet>Use one consistent, professional email address across every application -- ideally firstname.lastname, not a joke handle from middle school.</Bullet>
          <Bullet>Fill optional fields. “Optional” short answers are extra chances to be specific; leaving them blank reads as low effort next to applicants who used them.</Bullet>
          <Bullet>Write activity descriptions like resume lines: action verb + what you did + a number. You usually get 150 characters -- spend them on results, not titles.</Bullet>
          <Bullet>Use “Additional information” only for real context (a schedule conflict, an access limitation, a grade dip with a reason) -- not for a second essay.</Bullet>
          <Bullet>Proofread the form as carefully as the essay. A misspelled program name in a form field is the most common self-inflicted wound.</Bullet>
        </Section>

        <Section icon="document-text-outline" title="4. The resume">
          <Text style={styles.body}>
            One page. Reverse-chronological. A program reviewer spends roughly 20-30
            seconds on a first pass -- the format has to make your best line easy to find,
            not force them to hunt.
          </Text>
          <DoDont
            dos={[
              '"Led a 4-person team that built a robot placing top 10 at states"',
              '"Tutored 12 students weekly; average grade rose one letter"',
              'Lead with a strong action verb + a number when you have one',
            ]}
            donts={[
              '"Responsible for helping with robotics club"',
              '"Did well in tutoring program"',
              'A vague duty with no result attached',
            ]}
          />
          <Text style={[styles.body, { marginTop: Spacing[2] }]}>
            No photo, no objective paragraph, no font smaller than 10pt. List activities
            newest first within each section (Experience, Activities, Awards). If two
            lines say roughly the same thing, cut the weaker one -- density beats length.
            It’s normal for a high school resume to be short; a half page of real results
            beats a full page of filler.
          </Text>
        </Section>

        <Section icon="create-outline" title="5. Essays: what reviewers are actually looking for">
          <Text style={styles.body}>
            The essay is usually the highest-weighted thing you control, and it’s read
            fast -- often in under two minutes on the first pass. Three things decide
            whether it works:
          </Text>
          <Bullet><Text style={styles.boldInline}>It answers the exact prompt asked.</Text> A great essay for the wrong question reads as not having read carefully -- an instant strike.</Bullet>
          <Bullet><Text style={styles.boldInline}>It’s specific.</Text> Reviewers can’t verify your passion, but they can verify detail. Names, numbers, moments, and mistakes are what make an essay believable.</Bullet>
          <Bullet><Text style={styles.boldInline}>It sounds like a real person.</Text> The safest-sounding essay -- formal, thesaurus-heavy, adult-voiced -- is the most forgettable one in the pile. Write closer to how you’d explain it to a teacher you like.</Bullet>
          <Text style={[styles.body, { marginTop: Spacing[2] }]}>
            One more thing reviewers notice: whether you wrote it. Essays that read
            nothing like a teenager wrote them raise flags, and many programs now ask
            about AI use directly. Use tools to brainstorm or check grammar if you want,
            but the voice and the stories have to be yours.
          </Text>
        </Section>

        <Section icon="git-branch-outline" title="6. A structure that works">
          <Text style={styles.body}>
            You don’t need a clever structure -- you need a clear one. This shape fits
            almost every internship essay from 150 to 650 words:
          </Text>
          <Bullet><Text style={styles.boldInline}>Open on a specific moment.</Text> A line of dialogue, a failed experiment, a number that surprised you. First sentences that could open anyone’s essay (“Ever since I was young...”) get skimmed.</Bullet>
          <Bullet><Text style={styles.boldInline}>Tell one story, not three.</Text> One real problem you worked on, with enough detail that the reviewer can picture it. Depth on one thing beats a montage of everything.</Bullet>
          <Bullet><Text style={styles.boldInline}>Show the change.</Text> What you understood, could do, or wanted after that you didn’t before. This is the actual point of the essay -- don’t leave it implied.</Bullet>
          <Bullet><Text style={styles.boldInline}>Land on them.</Text> Close by connecting your story to what this program specifically does. One sentence is enough; it’s the difference between an essay and an application essay.</Bullet>
          <DoDont
            dos={[
              'Open mid-scene: "The third prototype caught fire too."',
              'One concrete story with a visible change in you',
              'End on why this program is the logical next step',
            ]}
            donts={[
              '"Ever since I was young, I have been passionate about..."',
              'Restating your resume in paragraph form',
              'A closing paragraph of generic gratitude',
            ]}
          />
        </Section>

        <Section icon="help-circle-outline" title="7. The prompts you'll actually see">
          <Text style={styles.body}>
            Most programs ask a version of the same four questions. Knowing what each is
            really asking lets you write once and adapt everywhere:
          </Text>
          <Bullet><Text style={styles.boldInline}>“Why do you want to join this program?”</Text> is really: did you do your homework? Name the specific thing they do that you want to learn -- a project, a method, a mentorship model. If your answer fits another program unchanged, it’s not done.</Bullet>
          <Bullet><Text style={styles.boldInline}>“Tell us about yourself”</Text> is really: pick what matters. Don’t chronicle -- choose the two or three things that explain why you’re applying, and skip the rest.</Bullet>
          <Bullet><Text style={styles.boldInline}>“Describe a challenge you overcame”</Text> is really: show us how you operate under difficulty. The challenge can be small; what they’re grading is your actions and honesty, not the drama.</Bullet>
          <Bullet><Text style={styles.boldInline}>“What do you hope to gain?”</Text> is really: are your expectations realistic? Name one skill and one experience you want, tied to what interns there actually do -- not “exposure” or a career epiphany.</Bullet>
          <Text style={[styles.body, { marginTop: Spacing[2] }]}>
            Build one strong 500-650 word “core essay” about your best story. Nearly
            every prompt above can be answered by re-angling it -- rewrite the opening
            and closing for each program, keep the middle.
          </Text>
        </Section>

        <Section icon="color-wand-outline" title="8. Drafting, revising, cutting">
          <Text style={styles.body}>
            Good essays aren’t written; they’re rewritten. The process matters more than
            talent here, and it has a rhythm:
          </Text>
          <Bullet><Text style={styles.boldInline}>Draft fast and rough.</Text> Write the first version in one sitting without judging it. A bad complete draft is infinitely more useful than a perfect first paragraph.</Bullet>
          <Bullet><Text style={styles.boldInline}>Let it sit at least a day.</Text> You cannot see your own essay clearly the day you wrote it.</Bullet>
          <Bullet><Text style={styles.boldInline}>Cut 15% on the second pass.</Text> Almost every early draft is over-written. Kill adjectives, throat-clearing openers, and any sentence that repeats a point already made.</Bullet>
          <Bullet><Text style={styles.boldInline}>Read it out loud.</Text> Anywhere you stumble or run out of breath, the sentence needs work. This catches more than any grammar checker.</Bullet>
          <Bullet><Text style={styles.boldInline}>Get one outside reader.</Text> Ask them two questions only: “Where did you get bored?” and “What do you remember?” Their answers tell you exactly what to fix.</Bullet>
          <Text style={[styles.body, { marginTop: Spacing[2] }]}>Before you submit, run the final checklist:</Text>
          <Bullet>Does the first sentence make someone want the second?</Bullet>
          <Bullet>Does every paragraph answer the prompt that was actually asked?</Bullet>
          <Bullet>Is there at least one detail no other applicant could have written?</Bullet>
          <Bullet>Is it under the word limit -- and is the program name spelled right, in the right essay? (Copy-pasting another program’s name in is the classic fatal error.)</Bullet>
        </Section>

        <Section icon="people-outline" title="9. Recommendation letters">
          <Bullet>Ask at least 3 weeks before the deadline, in person or by a real email -- never a mass text.</Bullet>
          <Bullet>Ask someone who can speak to specifics, not just whoever gave you the highest grade. A teacher who watched you debug something for two weeks writes a better letter than one who only saw your final grade.</Bullet>
          <Bullet>Give them a one-page “brag sheet”: the program name and deadline, 2-3 specific projects or moments you’d want mentioned, and your resume. This is standard practice, not an imposition -- it makes their letter better and faster to write.</Bullet>
          <Bullet>Send a calendar reminder a few days before the deadline, and a short thank-you note after -- you’ll likely ask this person again.</Bullet>
        </Section>

        <Section icon="time-outline" title="10. Work backward from the deadline">
          <Text style={styles.body}>Rough timeline for a competitive program (essays + recommendations + transcript):</Text>
          <Bullet><Text style={styles.boldInline}>3-4 weeks out --</Text> ask recommenders, start essay outline, request transcript</Bullet>
          <Bullet><Text style={styles.boldInline}>2 weeks out --</Text> first full essay draft done, resume finalized</Bullet>
          <Bullet><Text style={styles.boldInline}>1 week out --</Text> essay revised from outside feedback, all documents assembled in one folder</Bullet>
          <Bullet><Text style={styles.boldInline}>2-3 days out --</Text> submit. Never submit in the final hour -- portals crash and uploads fail exactly when everyone else is submitting too.</Bullet>
          <Text style={[styles.body, { marginTop: Spacing[2] }]}>
            For rolling/open programs, compress all of this -- the cost of waiting a week
            is real seats filling, not a stronger application.
          </Text>
        </Section>

        <Section icon="chatbubbles-outline" title="11. If there's an interview">
          <Bullet>Prepare 2-3 specific questions to ask them -- “what does a typical week look like for an intern” beats “what does your company do,” which you should already know from the website.</Bullet>
          <Bullet>Have one clear story ready for “tell me about a time you solved a problem” -- pick something small and real over something you think sounds impressive.</Bullet>
          <Bullet>Know why this program over similar ones. If you can’t answer that, revisit step 1.</Bullet>
          <Bullet>Test your camera, mic, and lighting the day before if it’s a video call. Log in 5 minutes early.</Bullet>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation?.navigate('InterviewPrep')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Ionicons name="mic-outline" size={15} color={Colors.accent} />
            <Text style={styles.linkBtnText}>Practice with Interview Prep</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
          </TouchableOpacity>
        </Section>

        <Section icon="checkmark-done-outline" title="12. After you hit submit">
          <Bullet>Track every application in this app’s Tracker so nothing falls through when three programs reply the same week.</Bullet>
          <Bullet>Silence past a stated decision date is normal for high-volume programs -- one polite follow-up email a few days after that date is plenty.</Bullet>
          <Bullet>Rejected? Selective programs turn down strong applicants constantly. Apply to your next program the same day, reusing your core essay for the new prompt -- momentum beats mourning.</Bullet>
          <Bullet>Accepted? Confirm before their deadline (offers do get rescinded to slow responders), withdraw politely from programs you’re dropping, and ask what to prepare before day one.</Bullet>
        </Section>

        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textPrimary,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: Colors.white,
    letterSpacing: 0.8,
  },
  scrollContent: { paddingHorizontal: Spacing.screenPadding },
  title: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: Typography.size.md * 1.4,
    marginBottom: Spacing[5],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: Typography.size.md * 1.55,
  },
  boldInline: {
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing[2],
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
    marginTop: 7,
    marginRight: Spacing[2] + 2,
  },
  bulletText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.55,
  },
  doDontWrap: {
    flexDirection: 'row',
    marginTop: Spacing[3],
  },
  doDontCol: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radii.lg,
    padding: Spacing[3],
  },
  doDontHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing[2],
  },
  doDontLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  doDontText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.size.xs * 1.5,
    marginBottom: Spacing[2],
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing[3],
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  linkBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
  },
});
