// screens/TrackerScreen.js
// Merged Saved + Tracker view.
// Top tabs: Saved · Pipeline

import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompanyLogo, DeadlineBadge } from '../components';
import {
  APPLICATION_STATUSES,
  DECIDED_STATUSES,
  useUser,
} from '../context/UserContext';
import { INTERNSHIPS, subscribeToInternships } from '../data';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import {
  getEffectiveDaysLeft,
  getSimilarRecommendations,
  computeMatchBreakdown,
  getMatchLabel,
} from '../utils/matching';

// ─── COLUMN CONFIG ───────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'Saved',        label: 'Saved',        color: Colors.textTertiary },
  { key: 'Applying',     label: 'Applying',     color: Colors.warning },
  { key: 'Submitted',    label: 'Submitted',    color: Colors.accent },
  { key: 'Interviewing', label: 'Interviewing', color: Colors.accent },
  { key: 'Accepted',     label: 'Accepted',     color: Colors.success },
  { key: 'Rejected',     label: 'Rejected',     color: Colors.error },
  { key: 'Waitlisted',   label: 'Waitlisted',   color: Colors.textSecondary },
];




// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getLiveDaysLeft(app) {
  const internshipId = app.meta?.id || app.id;
  if (internshipId) {
    const live = INTERNSHIPS.find((i) => i.id === internshipId);
    if (live) {
      const days = getEffectiveDaysLeft(live);
      if (days !== null) return days;
    }
  }
  const stored = app.meta?.daysLeft;
  if (typeof stored === 'number') return stored;
  return null;
}

// ─── STATS HEADER ────────────────────────────────────────────────────────────

const StatsHeader = ({ apps }) => {
  const counts = useMemo(() => {
    // Saved is a wishlist, not an application, so count it separately so
    // "Applied" style stats only reflect real pipeline movement.
    const c = { saved: 0, applying: 0, submitted: 0, decided: 0 };
    apps.forEach((a) => {
      if (a.status === 'Saved') c.saved += 1;
      if (a.status === 'Applying') c.applying += 1;
      if (a.status === 'Submitted' || a.status === 'Interviewing') c.submitted += 1;
      if (DECIDED_STATUSES.has(a.status)) c.decided += 1;
    });
    return c;
  }, [apps]);

  return (
    <View style={styles.statsRow}>
      {[
        { label: 'Saved', value: counts.saved },
        { label: 'Applying', value: counts.applying },
        { label: 'Submitted', value: counts.submitted },
        { label: 'Decided', value: counts.decided },
      ].map((s, i, arr) => (
        <View key={s.label} style={[styles.statCell, i < arr.length - 1 && styles.statBorder]}>
          <Text style={styles.statValue}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── PIPELINE CARD ───────────────────────────────────────────────────────────

const PipelineCard = ({ app, onPress, onAdvance, onRemove }) => {
  const meta = app.meta || {};
  let checklistDone = 0, checklistTotal = 0;
  if (app.checklist && typeof app.checklist === 'object' && !Array.isArray(app.checklist)) {
    const entries = Object.values(app.checklist);
    checklistTotal = entries.length;
    checklistDone = entries.filter(Boolean).length;
  } else if (Array.isArray(app.checklist)) {
    checklistTotal = app.checklist.length;
    checklistDone = app.checklist.filter((c) => c.done).length;
  }
  const pct = checklistTotal > 0 ? checklistDone / checklistTotal : 0;
  const daysLeft = getLiveDaysLeft(app);
  const idx = APPLICATION_STATUSES.indexOf(app.status);
  const next = idx >= 0 && idx < APPLICATION_STATUSES.length - 1 ? APPLICATION_STATUSES[idx + 1] : null;
  const showAdvance = next && ['Applying', 'Submitted'].includes(app.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.cardHeader}>
        <CompanyLogo name={meta.company || '?'} size={38} color={meta.logoColor} />
        <View style={styles.cardText}>
          <Text style={styles.cardRole} numberOfLines={1}>{meta.role || 'Internship'}</Text>
          <Text style={styles.cardCompany} numberOfLines={1}>{meta.company || ''}</Text>
        </View>
        {daysLeft !== null && <DeadlineBadge daysLeft={daysLeft} />}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={(e) => { e.stopPropagation?.(); onRemove?.(); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${meta.role || 'internship'} from tracker`}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {checklistTotal > 0 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{checklistDone}/{checklistTotal}</Text>
        </View>
      )}

      {showAdvance && (
        <TouchableOpacity
          style={styles.advanceBtn}
          onPress={(e) => { e.stopPropagation?.(); onAdvance(next); }}
          activeOpacity={0.7}
        >
          <Text style={styles.advanceText}>Move to {next} →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

// ─── COLUMN ──────────────────────────────────────────────────────────────────

const Column = ({ column, apps, onCardPress, onAdvance, onRemove }) => {
  if (apps.length === 0) return null;
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <View style={[styles.columnDot, { backgroundColor: column.color }]} />
        <Text style={styles.columnTitle}>{column.label}</Text>
        <Text style={styles.columnCount}>{apps.length}</Text>
      </View>
      {apps.map((app) => (
        <PipelineCard
          key={app.id}
          app={app}
          onPress={() => onCardPress(app)}
          onAdvance={(next) => onAdvance(app.id, next, app.meta)}
          onRemove={() => onRemove(app.meta?.id || app.id)}
        />
      ))}
    </View>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

const EmptyState = ({ onBrowse, message }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyTitle}>{message || 'Nothing here yet'}</Text>
    <Text style={styles.emptySub}>
      Browse internships, save the ones you like, and track your progress here.
    </Text>
    <TouchableOpacity style={styles.emptyBtn} onPress={onBrowse} activeOpacity={0.85}>
      <Text style={styles.emptyBtnText}>Browse internships</Text>
    </TouchableOpacity>
  </View>
);

// ─── TRACKER SCREEN ──────────────────────────────────────────────────────────

export default function TrackerScreen({ navigation }) {
  const { applicationList, savedIds, setApplicationStatus, toggleSaved, user } = useUser();
  const [pipelineFilter, setPipelineFilter] = useState('active');

  // INTERNSHIPS is module state that may still be empty when this screen first
  // mounts (cold start straight to this tab), so bump a version when it loads so
  // the memos below recompute with real data.
  const [internshipsVersion, setInternshipsVersion] = useState(0);
  useEffect(() => subscribeToInternships(() => setInternshipsVersion((v) => v + 1)), []);

  // ── SIMILAR RECOMMENDATIONS (based on saved items) ──
  const savedItems = useMemo(
    () => savedIds.map((id) => INTERNSHIPS.find((i) => i.id === id)).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedIds, internshipsVersion]
  );
  const similarRecs = useMemo(() => {
    if (savedItems.length === 0) return [];
    return getSimilarRecommendations(savedItems, INTERNSHIPS, 6, user);
  }, [savedItems,user]);

  // ── PIPELINE TAB DATA ──
  const filtered = useMemo(() => {
    if (pipelineFilter === 'active') return (applicationList || []).filter((a) => !DECIDED_STATUSES.has(a.status));
    if (pipelineFilter === 'decided') return (applicationList || []).filter((a) => DECIDED_STATUSES.has(a.status));
    return applicationList || [];
  }, [applicationList, pipelineFilter]);

  const byStatus = useMemo(() => {
    const map = {};
    APPLICATION_STATUSES.forEach((s) => (map[s] = []));
    filtered.forEach((a) => {
      if (map[a.status]) map[a.status].push(a);
      else if (map['Saved']) map['Saved'].push(a);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => {
        const da = getLiveDaysLeft(a) ?? 9999;
        const db = getLiveDaysLeft(b) ?? 9999;
        return da - db;
      })
    );
    return map;
  // getLiveDaysLeft reads module INTERNSHIPS, so resort when that data loads
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, internshipsVersion]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tracker</Text>
        <TouchableOpacity
          style={styles.materialsBtn}
          onPress={() => navigation?.navigate('Materials')}
          activeOpacity={0.7}
        >
          <Text style={styles.materialsBtnText}>Materials</Text>
        </TouchableOpacity>
      </View>

      {/* ── PIPELINE ── */}
      <>
        {applicationList && applicationList.length > 0 && (
          <StatsHeader apps={applicationList} />
        )}
        <View style={styles.filterRow}>
          {[
            ['active', 'Active'],
            ['decided', 'Decided'],
            ['all', 'All'],
          ].map(([val, label]) => (
            <TouchableOpacity
              key={val}
              style={[styles.filterChip, pipelineFilter === val && styles.filterChipActive]}
              onPress={() => setPipelineFilter(val)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, pipelineFilter === val && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {(!applicationList || applicationList.length === 0) ? (
          <EmptyState onBrowse={() => navigation?.navigate('Search')} message="No applications tracked yet" />
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {COLUMNS.map((col) => (
              <Column
                key={col.key}
                column={col}
                apps={byStatus[col.key] || []}
                onCardPress={(app) => {
                  // Prefer the live Supabase record over the frozen snapshot
                  // captured when the item was first saved.
                  const liveId = app.meta?.id || app.id;
                  const live = INTERNSHIPS.find((i) => i.id === liveId);
                  navigation?.navigate('Detail', { item: live || app.meta || {} });
                }}
                onAdvance={(id, next, meta) => setApplicationStatus(id, next, meta)}
                onRemove={(id) => toggleSaved(id)}
              />
            ))}
            {similarRecs.length > 0 && (
              <View style={styles.similarSection}>
                <Text style={styles.similarTitle}>You might also like</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
                  {similarRecs.map((item) => (
                    <TouchableOpacity
                      key={`sim-${item.id}`}
                      style={styles.similarCard}
                      onPress={() => navigation?.navigate('Detail', { item })}
                      activeOpacity={0.9}
                    >
                      <CompanyLogo name={item.company} size={28} color={item.logoColor} />
                      <Text style={styles.similarRole} numberOfLines={2}>{item.role}</Text>
                      <Text style={styles.similarCompany} numberOfLines={1}>{item.company}</Text>
                      <Text style={styles.similarCompany}>{getMatchLabel(computeMatchBreakdown(item,user))}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={{ height: Spacing[8] }} />
          </ScrollView>
        )}
      </>

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
    paddingBottom: Spacing[2],
  },
  materialsBtn: {
    paddingHorizontal: Spacing[3] + 2,
    paddingVertical: Spacing[2],
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
  },
  materialsBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.accent,
  },
  headerTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },

  // Stats
  statsRow: {
    marginHorizontal: Spacing.screenPadding,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    paddingVertical: Spacing[2] + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[3],
    ...Shadows.card,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.divider },
  statValue: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },

  // Filter chips (pipeline)
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: Typography.weight.semibold },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.screenPadding },

  // Column (pipeline)
  column: { marginBottom: Spacing[4] },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  columnDot: { width: 8, height: 8, borderRadius: 4 },
  columnTitle: { flex: 1, fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  columnCount: { fontSize: Typography.size.sm, color: Colors.textTertiary, fontWeight: Typography.weight.medium },

  // Card (shared)
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing[3] + 2,
    marginBottom: Spacing[2] + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  cardText: { flex: 1 },
  cardRole: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
  cardCompany: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  cardLocation: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 1 },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing[1],
  },
  removeIcon: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.semibold,
  },

  // Saved card
  savedCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2], marginBottom: Spacing[2] },
  savedCardText: { flex: 1 },
  unsaveBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  unsaveIcon: { fontSize: 16 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing[1] },
  cardTags: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 },
  compBadge: { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 2 },
  compBadgeText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },

  statusBanner: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: Spacing[2],
  },
  statusBannerText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.accent },

  // Progress & advance (pipeline cards)
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: Spacing[2] },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.surfaceSecondary, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  progressText: { fontSize: Typography.size.xs, color: Colors.textTertiary, fontWeight: Typography.weight.medium, minWidth: 40, textAlign: 'right' },
  advanceBtn: {
    marginTop: Spacing[2],
    paddingVertical: 6,
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.accentMuted,
  },
  advanceText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.accent },

  // Similar
  similarSection: { marginTop: Spacing[4], paddingTop: Spacing[4], borderTopWidth: 1, borderTopColor: Colors.divider },
  similarTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  similarScroll: { gap: Spacing[3] },
  similarCard: {
    width: 140,
    minHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[3],
    gap: 4,
    ...Shadows.card,
  },
  similarRole: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginTop: 4 },
  similarCompany: { fontSize: Typography.size.xs, color: Colors.textTertiary },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8] },
  emptyIcon: {
    width: 56, height: 56, borderRadius: Radii.xl,
    backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyIconText: { fontSize: 28 },
  emptyTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing[2], textAlign: 'center' },
  emptySub: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.size.sm * 1.6, marginBottom: Spacing[5] },
  emptyBtn: { backgroundColor: Colors.accent, borderRadius: Radii.lg, paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], ...Shadows.elevated },
  emptyBtnText: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.white },

});
