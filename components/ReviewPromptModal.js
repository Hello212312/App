// components/ReviewPromptModal.js
// Custom in-app "leave a review" prompt. Shown after enough engagement
// (see utils/review.js for thresholds) instead of relying solely on the
// native StoreKit / Play In-App Review popup, which both platforms throttle
// and never guarantee will actually appear.

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../context/UserContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import { openStoreReview, requestNativeReview } from '../utils/review';

export default function ReviewPromptModal() {
  const { reviewPromptVisible, dismissReviewPrompt } = useUser();
  const [step, setStep] = useState('ask'); // 'ask' | 'positive' | 'negative'

  const close = () => {
    dismissReviewPrompt();
    // Reset for the (unlikely) case this component stays mounted across
    // future modal opens: it won't re-open once reviewRequested is true.
    setTimeout(() => setStep('ask'), 300);
  };

  const handlePositive = () => {
    requestNativeReview(); // best-effort, may or may not visibly appear
    setStep('positive');
  };

  const handleRateNow = () => {
    openStoreReview();
    close();
  };

  const handleNegative = () => setStep('negative');

  if (!reviewPromptVisible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {step === 'ask' && (
            <>
              <View style={styles.icon}>
                <Ionicons name="star" size={26} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Enjoying Interny?</Text>
              <Text style={styles.body}>
                Your feedback helps us keep improving the app for students like you.
              </Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleNegative} activeOpacity={0.8}>
                  <Text style={styles.secondaryBtnText}>Not really</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handlePositive} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>Yes!</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'positive' && (
            <>
              <View style={styles.icon}>
                <Ionicons name="heart" size={26} color={Colors.accent} />
              </View>
              <Text style={styles.title}>That means a lot!</Text>
              <Text style={styles.body}>
                Would you mind leaving a quick review? It really helps other students find Interny.
              </Text>
              <TouchableOpacity style={styles.primaryBtnFull} onPress={handleRateNow} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Rate Interny</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={close} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
                <Text style={styles.skipText}>Maybe later</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'negative' && (
            <>
              <View style={styles.icon}>
                <Ionicons name="chatbubble-ellipses" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Thanks for letting us know</Text>
              <Text style={styles.body}>
                We're always working to make Interny better. Feel free to reach out with any
                feedback from Profile → Help & support.
              </Text>
              <TouchableOpacity style={styles.primaryBtnFull} onPress={close} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Got it</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing[5],
    alignItems: 'center',
    ...Shadows.elevated,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  body: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
    marginBottom: Spacing[4],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
    width: '100%',
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnFull: {
    width: '100%',
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.medium,
  },
  skipText: {
    fontSize: Typography.size.md,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
});
