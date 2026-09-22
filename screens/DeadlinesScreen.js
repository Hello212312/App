// screens/DeadlinesScreen.js
// Urgency-sorted view of all upcoming deadlines for active applications.

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompanyLogo } from '../components';
import { useUser } from '../context/UserContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

// ─── BUCKETS ─────────────────────────────────────────────────────────────────
// Group by urgency for quick scanning.

function bucketFor(daysLeft) {
  if (daysLeft <= 3) return 'urgent';
  if (daysLeft <= 7) return 'thisWeek';
  if (daysLeft <= 30) return 'thisMonth';
  return 'later';
}

const BUCKET_ORDER = ['urgent', 'thisWeek', 'thisMonth', 'later'];
const BUCKET_LABELS = {
  urgent: 'Urgent: closes in 3 days',
  thisWeek: 'This week',
  thisMonth: 'This month',
  later: 'Later',
};
const BUCKET_COLORS = {
  urgent: Colors.error,
  thisWeek: Colors.warning,
  thisMonth: Colors.accent,
  later: Colors.textTertiary,
};

// ─── DEADLINE ROW ────────────────────────────────────────────────────────────

const DeadlineRow = ({ app, onPress }) => {
  const meta = app.meta || {};
  const dl = app.daysLeft;
  const dlColor =
    dl <= 3 ? Colors.error : dl <= 7 ? Colors.warning : Colors.textPrimary;

  // checklist is stored as an object map { [key]: boolean } by DetailScreen,
  // but older entries may be arrays, so handle both shapes (calling .filter on
  // an object throws and crashed this screen).
  let checklistDone = 0;
  let checklistTotal = 0;
  if (Array.isArray(app.checklist)) {
    checklistTotal = app.checklist.length;
    checklistDone = app.checklist.filter((c) => c.done).length;
  } else if (app.checklist && typeof app.checklist === 'object') {
    const entries = Object.values(app.checklist);
    checklistTotal = entries.length;
    checklistDone = entries.filter(Boolean).length;
  }

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.95}>
      <CompanyLogo name={meta.company || '?'} size={44} color={meta.logoColor} />
      <View style={styles.rowText}>
        <Text style={styles.rowRole} numberOfLines={1}>
          {meta.role || 'Internship'}
        </Text>
        <Text style={styles.rowCompany} numberOfLines={1}>
          {meta.company || ''} · {meta.deadline || 'Rolling'}
        </Text>
        {checklistTotal > 0 && (
          <Text style={styles.rowChecklist}>
            {checklistDone}/{checklistTotal} steps complete
          </Text>
        )}
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.daysNum, { color: dlColor }]}>{dl}</Text>
        <Text style={styles.daysLabel}>day{dl !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

const EmptyState = ({ onBrowse }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name="calendar-outline" size={28} color={Colors.accent} />
    </View>
    <Text style={styles.emptyTitle}>No upcoming deadlines</Text>
    <Text style={styles.emptySub}>
      Save internships you're interested in and we'll surface their deadlines here, sorted by urgency.
    </Text>
    <TouchableOpacity style={styles.emptyBtn} onPress={onBrowse} activeOpacity={0.85}>
      <Text style={styles.emptyBtnText}>Browse internships</Text>
    </TouchableOpacity>
  </View>
);

// ─── DEADLINES SCREEN ────────────────────────────────────────────────────────

export default function DeadlinesScreen({ navigation }) {
  const { upcomingDeadlines } = useUser();

  // Group into buckets
  const buckets = useMemo(() => {
    const out = { urgent: [], thisWeek: [], thisMonth: [], later: [] };
    upcomingDeadlines.forEach((a) => {
      out[bucketFor(a.daysLeft)].push(a);
    });
    return out;
  }, [upcomingDeadlines]);

  if (upcomingDeadlines.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Deadlines</Text>
        </View>
        <EmptyState onBrowse={() => navigation?.navigate('Main', { screen: 'Home' })} />
      </SafeAreaView>
    );
  }

  const urgentCount = buckets.urgent.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deadlines</Text>
        {urgentCount > 0 && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentBadgeText}>
              {urgentCount} urgent
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BUCKET_ORDER.map((key) => {
          const items = buckets[key];
          if (!items.length) return null;
          return (
            <View key={key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: BUCKET_COLORS[key] }]} />
                <Text style={styles.sectionTitle}>{BUCKET_LABELS[key]}</Text>
                <Text style={styles.sectionCount}>{items.length}</Text>
              </View>
              {items.map((app) => (
                <DeadlineRow
                  key={app.id}
                  app={app}
                  onPress={() => navigation?.navigate('Detail', { item: app.meta })}
                />
              ))}
            </View>
          );
        })}
        <View style={{ height: Spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

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
  headerTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  urgentBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1] + 2,
    borderRadius: Radii.full,
  },
  urgentBadgeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.error,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.screenPadding },

  section: {
    marginBottom: Spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },

  // Row
  row: {
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
  rowText: {
    flex: 1,
  },
  rowRole: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowCompany: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  rowChecklist: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
  rowRight: {
    alignItems: 'center',
    minWidth: 56,
  },
  daysNum: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    letterSpacing: -0.5,
  },
  daysLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: Radii.xl,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[5],
  },
  emptyIconText: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.accent,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.6,
    marginBottom: Spacing[7],
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    ...Shadows.elevated,
  },
  emptyBtnText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.white,
  },
});