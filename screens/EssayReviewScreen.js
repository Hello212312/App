// screens/EssayReviewScreen.js
// Premium: submit an essay for personal (human) review. Capped per month.
// Essays are inserted into the write-only essay_reviews table in Supabase;
// feedback is emailed back to the address captured at purchase.
//
// Cap note: the monthly cap is enforced client-side for now. When Stripe /
// the essay add-on billing lands, enforce it server-side too (edge function
// or a policy that counts this month's rows per device_id).

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import {
  ESSAY_MAX_CHARS,
  ESSAY_REVIEWS_PER_MONTH,
  ESSAY_REVIEW_TURNAROUND_COPY,
  essayUsageThisMonth,
  getDeviceId,
  getMonthKey,
  submitEssayReview,
} from '../utils/premium';

export default function EssayReviewScreen({ navigation }) {
  const {
    user,
    materials = [],
    essaySubmissions = [],
    addEssaySubmission,
    applicationList = [],
  } = useUser();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [program, setProgram] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  const isPremium = !!user?.premium;
  const used = essayUsageThisMonth(essaySubmissions);
  const remaining = Math.max(0, ESSAY_REVIEWS_PER_MONTH - used);

  const vaultEssays = useMemo(
    () => (materials || []).filter((m) => m.kind === 'essay' && (m.content || m.text || '').trim()),
    [materials]
  );

  const loadFromVault = (m) => {
    setTitle(m.title || m.name || 'Essay');
    setText(m.content || m.text || '');
  };

  const handleSubmit = async () => {
    const essay = text.trim();
    if (essay.length < 100) {
      Alert.alert('A bit short', 'Paste your full essay (at least 100 characters) so the feedback is actually useful.');
      return;
    }
    if (essay.length > ESSAY_MAX_CHARS) {
      Alert.alert('Too long', `Essays are capped at ${ESSAY_MAX_CHARS.toLocaleString()} characters. Split it up or trim it down.`);
      return;
    }
    if (remaining <= 0) {
      Alert.alert('Monthly limit reached', `You've used your ${ESSAY_REVIEWS_PER_MONTH} reviews for this month. Your count resets on the 1st.`);
      return;
    }
    setSending(true);
    try {
      const deviceId = await getDeviceId();
      const { ok, error } = await submitEssayReview({
        deviceId,
        email: user?.premiumEmail || '',
        essayTitle: title.trim() || null,
        essayText: essay,
        program: program.trim() || null,
        notes: notes.trim() || null,
      });
      if (!ok) {
        Alert.alert('Could not submit', 'Something went wrong sending your essay. Check your connection and try again.');
        console.warn('[EssayReview]', error);
        return;
      }
      addEssaySubmission({
        monthKey: getMonthKey(),
        title: title.trim() || 'Untitled essay',
        program: program.trim() || null,
        chars: essay.length,
        status: 'Submitted',
      });
      setTitle(''); setText(''); setProgram(''); setNotes('');
      Alert.alert(
        'Essay submitted!',
        `${ESSAY_REVIEW_TURNAROUND_COPY} Look out for it at ${user?.premiumEmail || 'your email'}.`,
      );
    } catch (err) {
      console.warn('[EssayReview]', err);
      Alert.alert('Could not submit', 'Something went wrong sending your essay. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Locked state for non-premium users ──
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
            <Ionicons name="school-outline" size={28} color={Colors.accent} />
          </View>
          <Text style={styles.lockedTitle}>Essay Review</Text>
          <Text style={styles.lockedSub}>
            Get personal, human feedback on up to {ESSAY_REVIEWS_PER_MONTH} essays a month, delivered to your email. Part of Interny Premium.
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation?.navigate('Paywall')} activeOpacity={0.85}>
            <Text style={styles.upgradeBtnText}>See Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.usagePill}>
            <Text style={styles.usagePillText}>{remaining} of {ESSAY_REVIEWS_PER_MONTH} left this month</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Essay Review</Text>
          <Text style={styles.subtitle}>{ESSAY_REVIEW_TURNAROUND_COPY}</Text>

          {/* Quick load from vault */}
          {vaultEssays.length > 0 && (
            <View style={{ marginBottom: Spacing[4] }}>
              <Text style={styles.fieldLabel}>Load from your Materials vault</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[2] }}>
                {vaultEssays.map((m) => (
                  <TouchableOpacity key={m.id} style={styles.vaultChip} onPress={() => loadFromVault(m)} activeOpacity={0.8}>
                    <Ionicons name="document-text-outline" size={14} color={Colors.accent} style={{ marginRight: 6 }} />
                    <Text style={styles.vaultChipText} numberOfLines={1}>{m.title || m.name || 'Essay'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.fieldLabel}>Essay title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Why NIH HiSTEP personal statement"
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={styles.fieldLabel}>Which program is it for? (optional)</Text>
          <TextInput
            style={styles.input}
            value={program}
            onChangeText={setProgram}
            placeholder={applicationList.length > 0 ? 'e.g. one of your tracked programs' : 'e.g. summer research program'}
            placeholderTextColor={Colors.textTertiary}
          />

          <Text style={styles.fieldLabel}>Your essay</Text>
          <TextInput
            style={[styles.input, styles.essayInput]}
            value={text}
            onChangeText={setText}
            placeholder="Paste your full essay here..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{text.length.toLocaleString()} characters</Text>

          <Text style={styles.fieldLabel}>Anything specific you want feedback on? (optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, paddingTop: Spacing[3] }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Is my opening strong enough? Does the ending land?"
            placeholderTextColor={Colors.textTertiary}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (sending || remaining <= 0) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={sending || remaining <= 0}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {sending ? 'Sending...' : remaining <= 0 ? 'Monthly limit reached' : 'Submit for review'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.privacyNote}>
            Your essay is sent securely along with your email ({user?.premiumEmail || 'not set'}) so feedback can be sent back to you. It is never shared or shown to other users.
          </Text>

          {/* Past submissions */}
          {essaySubmissions.length > 0 && (
            <View style={{ marginTop: Spacing[6] }}>
              <Text style={styles.fieldLabel}>Past submissions</Text>
              {essaySubmissions.map((s) => (
                <View key={s.id} style={styles.subRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subTitle} numberOfLines={1}>{s.title}</Text>
                    <Text style={styles.subMeta}>
                      {new Date(s.createdAt).toLocaleDateString()}{s.program ? ` · ${s.program}` : ''}
                    </Text>
                  </View>
                  <View style={styles.subStatus}>
                    <Text style={styles.subStatusText}>{s.status || 'Submitted'}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  usagePill: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  usagePillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
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
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.5,
    marginBottom: Spacing[5],
  },

  fieldLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: Spacing[2],
    marginTop: Spacing[2],
  },
  input: {
    minHeight: 52,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    marginBottom: Spacing[3],
  },
  essayInput: {
    height: 220,
    paddingTop: Spacing[3],
    lineHeight: Typography.size.md * 1.5,
    marginBottom: Spacing[1],
  },
  charCount: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginBottom: Spacing[2],
  },

  vaultChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 220,
  },
  vaultChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },

  submitBtn: {
    height: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[3],
  },
  submitBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.white,
  },
  privacyNote: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    lineHeight: Typography.size.xs * 1.5,
    marginTop: Spacing[3],
  },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    ...Shadows.card,
  },
  subTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },
  subMeta: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  subStatus: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  subStatusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
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
