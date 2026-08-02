// screens/PaywallScreen.js
// Interny Premium paywall: one-time purchase via RevenueCat (App/Play Store
// in-app purchase), email capture, feature list.
//
// Real purchase flow: fetches the current offering's package from
// RevenueCat on mount, then purchases it through StoreKit/Play Billing when
// tapped. activatePremium() is only called after the store confirms the
// purchase (or restore) actually went through — see utils/revenuecat.js for
// the one-time dashboard setup this depends on.

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ESSAY_REVIEWS_PER_MONTH,
  PREMIUM_FEATURES,
  PREMIUM_PRICE,
} from '../utils/premium';
import { getPremiumPackage, purchasePremiumPackage, restorePurchases } from '../utils/revenuecat';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PaywallScreen({ navigation }) {
  const { user, activatePremium } = useUser();
  const [email, setEmail] = useState(user?.premiumEmail || '');
  const [working, setWorking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pkg, setPkg] = useState(null);
  const [pkgLoading, setPkgLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPremiumPackage().then((p) => {
      if (!cancelled) {
        setPkg(p);
        setPkgLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const emailValid = EMAIL_RE.test(email.trim());
  const priceLabel = pkg?.product?.priceString || PREMIUM_PRICE.price;

  const handlePurchase = async () => {
    if (!emailValid) {
      Alert.alert('Email needed', 'Enter a valid email so we can send your receipt and essay review feedback.');
      return;
    }
    if (!pkg) {
      Alert.alert(
        'Store not reachable',
        "We couldn't reach the App/Play Store just now. Check your connection and try again in a moment."
      );
      return;
    }
    setWorking(true);
    const result = await purchasePremiumPackage(pkg);
    setWorking(false);
    if (result.cancelled) return;
    if (!result.ok) {
      Alert.alert('Purchase failed', result.error || 'Something went wrong completing your purchase. You have not been charged.');
      return;
    }
    activatePremium({ email: email.trim() });
    // No success alert — TourContext sees premium flip true and launches the
    // spotlight tour over the app right after this screen pops.
    navigation?.goBack();
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.ok) {
      activatePremium({ email: email.trim() || user?.premiumEmail });
      navigation?.goBack();
    } else {
      Alert.alert('Nothing to restore', result.error || "We couldn't find a previous purchase on this store account.");
    }
  };

  if (user?.premium) {
    // Already premium — show a simple confirmation instead of the sell screen
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.alreadyWrap}>
          <View style={styles.heroIcon}>
            <Ionicons name="checkmark-circle" size={30} color={Colors.success} />
          </View>
          <Text style={styles.alreadyTitle}>You already have Premium</Text>
          <Text style={styles.alreadySub}>
            Manage your plan and premium features from your Profile.
          </Text>
          <TouchableOpacity style={styles.buyBtn} onPress={() => navigation?.goBack()} activeOpacity={0.85}>
            <Text style={styles.buyBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation?.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={26} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.heroIcon}>
            <Ionicons name="rocket-outline" size={28} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Interny Premium</Text>
          <Text style={styles.subtitle}>
            Everything in Interny stays free. Premium adds the tools that get applications finished and submitted.
          </Text>

          {/* Features */}
          <View style={styles.featureCard}>
            {PREMIUM_FEATURES.map((f, i) => (
              <View key={f.title} style={[styles.featureRow, i > 0 && styles.featureRowBorder]}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={18} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Price */}
          <Text style={styles.sectionLabel}>Price</Text>
          <View style={styles.priceCard}>
            <View style={styles.planPriceRow}>
              <Text style={styles.planPrice}>{priceLabel}</Text>
              <Text style={styles.planPer}>{PREMIUM_PRICE.label}</Text>
            </View>
            <Text style={styles.planSub}>{PREMIUM_PRICE.sub}</Text>
          </View>

          {/* Email */}
          <Text style={styles.sectionLabel}>Your email</Text>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.emailHint}>
            Interny has no accounts, so your email is how receipts and essay review feedback reach you. It stays on this device and is only attached to essays you choose to submit.
          </Text>

          {/* Essay add-on note */}
          <View style={styles.addonNote}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.addonNoteText}>
              Essay review is human, not AI, so it is capped at {ESSAY_REVIEWS_PER_MONTH} essays per month.
            </Text>
          </View>

          <View style={{ height: Spacing[6] }} />
        </ScrollView>

        {/* Purchase bar */}
        <View style={styles.buyBar}>
          <TouchableOpacity
            style={[styles.buyBtn, (!emailValid || working || pkgLoading) && { opacity: 0.5 }]}
            onPress={handlePurchase}
            disabled={!emailValid || working || pkgLoading}
            activeOpacity={0.85}
          >
            {working ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buyBtnText}>
                {pkgLoading ? 'Loading...' : `Get Premium — ${priceLabel} one time`}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={{ marginTop: Spacing[2] }}>
            <Text style={[styles.finePrint, { color: Colors.accent }]}>
              {restoring ? 'Restoring…' : 'Restore purchase'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.finePrint}>One-time payment. No renewals, no subscription.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[3],
  },
  scrollContent: { paddingHorizontal: Spacing.screenPadding },

  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: Spacing[2],
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.5,
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[2],
  },

  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[6],
    ...Shadows.card,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing[3] + 2,
    gap: Spacing[3],
  },
  featureRowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.45,
  },

  sectionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  priceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    padding: Spacing[4],
    marginBottom: Spacing[6],
  },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  planPrice: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  planPer: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    marginBottom: 3,
    marginLeft: 2,
  },
  planSub: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    lineHeight: Typography.size.xs * 1.4,
  },

  emailInput: {
    height: 52,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  emailHint: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    lineHeight: Typography.size.sm * 1.5,
    marginTop: Spacing[2],
    marginBottom: Spacing[4],
  },

  addonNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radii.lg,
    padding: Spacing[3],
  },
  addonNoteText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.45,
  },

  buyBar: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  buyBtn: {
    height: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.white,
  },
  finePrint: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing[2],
  },

  alreadyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[3],
  },
  alreadyTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  alreadySub: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.5,
    marginBottom: Spacing[3],
  },
});
