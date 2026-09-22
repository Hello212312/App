import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompanyLogo } from '../components';
import { INTERNSHIPS, subscribeToInternships } from '../data';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import { getEffectiveDaysLeft, isRecommendable, computeMatchBreakdown, getMatchLabel } from '../utils/matching';

import { useUser } from '../context/UserContext';

export default function ClosingSoonScreen({ navigation }) {
  const {user}=useUser();
  const [internships, setInternships] = useState(INTERNSHIPS);

  useEffect(() => {
    const unsub = subscribeToInternships((data) => setInternships(data));
    return unsub;
  }, []);

  const closingSoon = internships
    .map((item) => ({ item, daysLeft: getEffectiveDaysLeft(item) }))
    .filter(({ item, daysLeft }) => daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && isRecommendable(item,user))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Closing Soon</Text>
        <View style={styles.backBtn} />
      </View>

      {closingSoon.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing closing soon</Text>
          <Text style={styles.emptySub}>No programs within your current limits are closing in the next 30 days.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.subtitle}>{closingSoon.length} internship{closingSoon.length !== 1 ? 's' : ''} closing within 30 days</Text>
          {closingSoon.map(({ item, daysLeft }) => {
            const dlColor = daysLeft <= 3 ? Colors.error : daysLeft <= 7 ? Colors.warning : Colors.textPrimary;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => navigation?.navigate('Detail', { item })}
                activeOpacity={0.95}
              >
                <CompanyLogo name={item.company} size={44} color={item.logoColor} />
                <View style={styles.cardText}>
                  <Text style={styles.cardRole} numberOfLines={1}>{item.role}</Text>
                  <Text style={styles.cardCompany} numberOfLines={1}>{item.company}</Text>
                  <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
                  <Text style={styles.cardLocation}>{getMatchLabel(computeMatchBreakdown(item,user))}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.daysNum, { color: dlColor }]}>{daysLeft}</Text>
                  <Text style={styles.daysLabel}>day{daysLeft !== 1 ? 's' : ''}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: Spacing[10] }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing[4],
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.screenPadding },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
    ...Shadows.card,
  },
  cardText: { flex: 1 },
  cardRole: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginBottom: 2 },
  cardCompany: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginBottom: 2 },
  cardLocation: { fontSize: Typography.size.xs, color: Colors.textTertiary },
  cardRight: { alignItems: 'center', minWidth: 48 },
  daysNum: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, letterSpacing: -0.5 },
  daysLabel: { fontSize: Typography.size.xs, color: Colors.textTertiary, fontWeight: Typography.weight.medium, textTransform: 'uppercase', letterSpacing: 0.3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8] },
  emptyTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  emptySub: { fontSize: Typography.size.md, color: Colors.textSecondary, textAlign: 'center' },
});
