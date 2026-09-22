// screens/InterviewPrepScreen.js
// Premium: interview prep question bank per field, plus general questions
// and practical tips. Content lives in utils/interviewBank.js.
//
// Each question card expands to reveal a coaching hint (what a strong answer
// includes) and counts as practiced once opened. Mock Interview mode runs a
// shuffled 5-question session, one question at a time.

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { posthog } from '../utils/posthog';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import {
  FIELD_ORDER,
  FIELD_QUESTIONS,
  FIELD_TIPS,
  GENERAL_QUESTIONS,
  GENERAL_TIPS,
} from '../utils/interviewBank';

const GENERAL_KEY = 'General';
const MOCK_LENGTH = 5;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 field questions + 2 general (or 5 general when on the General tab). */
function buildMockDeck(field) {
  if (field === GENERAL_KEY) return shuffle(GENERAL_QUESTIONS).slice(0, MOCK_LENGTH);
  const fromField = shuffle(FIELD_QUESTIONS[field] || []).slice(0, 3);
  const fromGeneral = shuffle(GENERAL_QUESTIONS).slice(0, MOCK_LENGTH - fromField.length);
  return shuffle([...fromField, ...fromGeneral]);
}

export default function InterviewPrepScreen({ route, navigation }) {
  const { user } = useUser();
  const isPremium = !!user?.premium;

  // Start on the field passed in via route params, else the user's first
  // interest, else General.
  const initialField = (() => {
    const fromRoute = route?.params?.field;
    if (fromRoute && FIELD_QUESTIONS[fromRoute]) return fromRoute;
    const firstInterest = (user?.interests || []).find((i) => FIELD_QUESTIONS[i]);
    return firstInterest || GENERAL_KEY;
  })();

  const [field, setField] = useState(initialField);
  const [openQ, setOpenQ] = useState(null); // question text currently expanded
  const [practiced, setPracticed] = useState({}); // { [`${field}:${q}`]: true }
  const [mock, setMock] = useState(null); // { deck, idx, hintShown, done }

  const questions = useMemo(
    () => (field === GENERAL_KEY ? GENERAL_QUESTIONS : FIELD_QUESTIONS[field] || []),
    [field]
  );
  const fieldTips = field === GENERAL_KEY ? [] : FIELD_TIPS[field] || [];

  const practicedCount = questions.filter((item) => practiced[`${field}:${item.q}`]).length;

  const handleQuestionPress = (item) => {
    const key = `${field}:${item.q}`;
    if (openQ === item.q) {
      setOpenQ(null);
    } else {
      setOpenQ(item.q);
      if (!practiced[key]) posthog.capture('interview_question_practiced', { field });
      setPracticed((prev) => ({ ...prev, [key]: true }));
    }
  };

  const startMock = () => setMock({ deck: buildMockDeck(field), idx: 0, hintShown: false, done: false });
  const nextMock = () => {
    setMock((m) => {
      if (!m) return m;
      if (m.idx + 1 >= m.deck.length) return { ...m, done: true };
      return { ...m, idx: m.idx + 1, hintShown: false };
    });
  };

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.lockedWrap}>
          <View style={styles.lockedIcon}>
            <Ionicons name="chatbubbles-outline" size={28} color={Colors.accent} />
          </View>
          <Text style={styles.lockedTitle}>Interview Prep</Text>
          <Text style={styles.lockedSub}>
            100+ practice questions with coaching hints for every field, field-specific tips, and a mock interview mode. Part of Interny Premium.
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation?.navigate('Paywall')} activeOpacity={0.85}>
            <Text style={styles.upgradeBtnText}>See Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Mock interview session ────────────────────────────────────────────────
  if (mock) {
    const current = mock.deck[mock.idx];
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={() => setMock(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Exit mock interview"
          >
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
          {!mock.done && (
            <Text style={styles.mockCounter}>
              Question {mock.idx + 1} of {mock.deck.length}
            </Text>
          )}
        </View>

        {mock.done ? (
          <View style={styles.mockDoneWrap}>
            <View style={styles.lockedIcon}>
              <Ionicons name="checkmark-circle" size={30} color={Colors.success} />
            </View>
            <Text style={styles.lockedTitle}>Session complete</Text>
            <Text style={styles.lockedSub}>
              {mock.deck.length} questions down. Run it again for a fresh shuffle: repetition out loud is what makes the real one feel easy.
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={startMock} activeOpacity={0.85}>
              <Text style={styles.upgradeBtnText}>Run it again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mockExitBtn} onPress={() => setMock(null)} activeOpacity={0.85}>
              <Text style={styles.mockExitBtnText}>Back to questions</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mockWrap}>
            {/* progress dots */}
            <View style={styles.mockDots}>
              {mock.deck.map((_, i) => (
                <View key={i} style={[styles.mockDot, i <= mock.idx && styles.mockDotActive]} />
              ))}
            </View>

            <View style={styles.mockCard}>
              <Text style={styles.mockQuestion}>{current.q}</Text>
              <Text style={styles.mockInstruction}>Answer out loud. Aim for under 2 minutes.</Text>
              {mock.hintShown ? (
                <View style={styles.hintBox}>
                  <View style={styles.hintHeader}>
                    <Ionicons name="bulb" size={13} color={Colors.warning} />
                    <Text style={styles.hintLabel}>What they’re listening for</Text>
                  </View>
                  <Text style={styles.hintText}>{current.hint}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.hintBtn} onPress={() => setMock((m) => ({ ...m, hintShown: true }))} activeOpacity={0.8}>
                  <Ionicons name="bulb-outline" size={15} color={Colors.accent} />
                  <Text style={styles.hintBtnText}>Show hint</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.upgradeBtn} onPress={nextMock} activeOpacity={0.85}>
              <Text style={styles.upgradeBtnText}>
                {mock.idx + 1 >= mock.deck.length ? 'Finish' : 'Next question'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── Question bank ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: Spacing.screenPadding }}>
        <Text style={styles.title}>Interview Prep</Text>
        <Text style={styles.subtitle}>
          Tap a question to see what interviewers listen for. Answer out loud, keep it under 2 minutes.
        </Text>
      </View>

      {/* Field chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {[GENERAL_KEY, ...FIELD_ORDER].map((f) => {
            const active = field === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => { setField(f); setOpenQ(null); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mock interview launcher */}
        <TouchableOpacity style={styles.mockLauncher} onPress={startMock} activeOpacity={0.85}>
          <View style={styles.mockLauncherIcon}>
            <Ionicons name="mic-outline" size={18} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.mockLauncherTitle}>Mock interview</Text>
            <Text style={styles.mockLauncherSub}>
              {MOCK_LENGTH} shuffled questions, one at a time, like the real thing.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {practicedCount} of {questions.length} practiced
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${questions.length ? Math.round((practicedCount / questions.length) * 100) : 0}%` },
              ]}
            />
          </View>
        </View>

        {questions.map((item, i) => {
          const key = `${field}:${item.q}`;
          const done = !!practiced[key];
          const open = openQ === item.q;
          return (
            <TouchableOpacity
              key={item.q}
              style={[styles.qCard, done && !open && styles.qCardDone]}
              onPress={() => handleQuestionPress(item)}
              activeOpacity={0.85}
            >
              <View style={styles.qTopRow}>
                <View style={[styles.qNum, done && { backgroundColor: Colors.successLight }]}>
                  {done ? (
                    <Ionicons name="checkmark" size={14} color={Colors.success} />
                  ) : (
                    <Text style={styles.qNumText}>{i + 1}</Text>
                  )}
                </View>
                <Text style={[styles.qText, done && !open && { color: Colors.textTertiary }]}>{item.q}</Text>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.textTertiary}
                  style={{ marginLeft: Spacing[2] }}
                />
              </View>
              {open && (
                <View style={styles.hintBox}>
                  <View style={styles.hintHeader}>
                    <Ionicons name="bulb" size={13} color={Colors.warning} />
                    <Text style={styles.hintLabel}>What they’re listening for</Text>
                  </View>
                  <Text style={styles.hintText}>{item.hint}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Field-specific tips */}
        {fieldTips.length > 0 && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="ribbon-outline" size={16} color={Colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.tipsTitle}>{field} tips</Text>
            </View>
            {fieldTips.map((t, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.tipText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* General tips */}
        <View style={[styles.tipsCard, { backgroundColor: Colors.warningLight }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={16} color={Colors.warning} style={{ marginRight: 6 }} />
            <Text style={styles.tipsTitle}>Interview tips</Text>
          </View>
          {GENERAL_TIPS.map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{t}</Text>
            </View>
          ))}
        </View>

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
  title: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.5,
    marginBottom: Spacing[3],
  },
  chipRow: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing[3],
    gap: Spacing[2],
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
  },
  chipTextActive: { color: Colors.white },

  scrollContent: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing[1] },

  mockLauncher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.accent,
    padding: Spacing[3] + 2,
    marginBottom: Spacing[3],
    gap: Spacing[3],
    ...Shadows.card,
  },
  mockLauncherIcon: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockLauncherTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  mockLauncherSub: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.size.xs * 1.4,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  progressText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.full,
    backgroundColor: Colors.accent,
  },

  qCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[3] + 2,
    marginBottom: Spacing[2],
    ...Shadows.card,
  },
  qCardDone: { backgroundColor: Colors.background, borderColor: Colors.divider },
  qTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qNum: {
    width: 26,
    height: 26,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  qNumText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.accent,
  },
  qText: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: Typography.size.md * 1.4,
  },

  hintBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radii.md,
    padding: Spacing[3],
    marginTop: Spacing[3],
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing[1],
  },
  hintLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.55,
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  hintBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
  },

  mockCounter: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  mockWrap: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[4],
  },
  mockDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  mockDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  mockDotActive: { backgroundColor: Colors.accent },
  mockCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[5],
    marginBottom: Spacing[5],
    ...Shadows.card,
  },
  mockQuestion: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    lineHeight: Typography.size.xl * 1.35,
    marginBottom: Spacing[2],
  },
  mockInstruction: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
  mockDoneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
  },
  mockExitBtn: {
    marginTop: Spacing[3],
    paddingVertical: Spacing[2],
  },
  mockExitBtnText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
  },

  tipsCard: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.xl,
    padding: Spacing[4],
    marginTop: Spacing[4],
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  tipsTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing[2],
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: Radii.full,
    backgroundColor: Colors.warning,
    marginTop: 7,
    marginRight: Spacing[2] + 2,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.5,
  },

  lockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
  },
  lockedIcon: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  lockedTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
  },
  lockedSub: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.5,
    marginBottom: Spacing[5],
  },
  upgradeBtn: {
    height: 50,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
  },
  upgradeBtnText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.white,
  },
});
