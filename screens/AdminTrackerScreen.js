// screens/AdminTrackerScreen.js
// Hidden admin-only screen: aggregated view/save/apply stats across every
// device using the app. Reached via a secret tap on Profile > App version.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchAdminStats } from '../utils/analytics';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

const StatTile = ({ label, value }) => (
  <View style={styles.statTile}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const PersonRow = ({ person }) => {
  const detailBits = [
    person.user_grade,
    person.user_gpa_range && `GPA ${person.user_gpa_range}`,
    person.user_age != null && `${person.user_age}y`,
    person.user_gender,
    person.user_location || person.user_state || person.user_city,
    person.user_interests,
    person.user_travel_willingness && `travel: ${person.user_travel_willingness}`,
    person.user_format_preference && `pref: ${person.user_format_preference}`,
    person.user_remote_only ? 'remote-only' : null,
  ].filter(Boolean);

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {person.user_name || 'Unnamed user'}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {person.user_school ? `${person.user_school} · ` : ''}
          {person.device_id.slice(0, 8)}
          {person.referral_source ? ` · via ${person.referral_source}` : ''}
        </Text>
        {detailBits.length > 0 && (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {detailBits.join(' · ')}
          </Text>
        )}
      </View>
      <View style={styles.rowCounts}>
        <Text style={styles.rowCount}>{person.views} viewed</Text>
        <Text style={styles.rowCount}>{person.saves} saved</Text>
        <Text style={styles.rowCount}>{person.applies} applied</Text>
      </View>
    </View>
  );
};

const SourceRow = ({ source }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle} numberOfLines={1}>{source.referral_source}</Text>
    </View>
    <View style={styles.rowCounts}>
      <Text style={styles.rowCount}>{source.people} people</Text>
    </View>
  </View>
);

const ListingRow = ({ listing }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle} numberOfLines={1}>
        {listing.internship_title || listing.internship_id}
      </Text>
      <Text style={styles.rowSubtitle} numberOfLines={1}>{listing.company || ''}</Text>
    </View>
    <View style={styles.rowCounts}>
      <Text style={styles.rowCount}>{listing.views} viewed</Text>
      <Text style={styles.rowCount}>{listing.saves} saved</Text>
      <Text style={styles.rowCount}>{listing.applies} applied</Text>
    </View>
  </View>
);

export default function AdminTrackerScreen({ navigation }) {
  // Passphrase is entered fresh each session and only kept in memory here —
  // never persisted, never hardcoded. See utils/analytics.js fetchAdminStats.
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('people'); // 'people' | 'listings' | 'sources'

  const load = useCallback(async (secretToUse) => {
    setError('');
    const result = await fetchAdminStats(secretToUse);
    if (result.ok) {
      setStats(result.stats);
    } else {
      setError(result.error || 'Could not load stats.');
    }
    return result.ok;
  }, []);

  const handleUnlock = async () => {
    if (!secret.trim()) return;
    setAuthenticating(true);
    setLoading(true);
    const ok = await load(secret.trim());
    setAuthenticating(false);
    setLoading(false);
    if (ok) setUnlocked(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load(secret.trim());
    setRefreshing(false);
  };

  const totals = stats?.totals || { people: 0, views: 0, saves: 0, applies: 0 };
  const byDevice = stats?.by_device || [];
  const byListing = stats?.by_listing || [];
  const bySource = stats?.by_referral_source || [];

  if (!unlocked) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tracker</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centerFill}>
          <TextInput
            style={styles.secretInput}
            value={secret}
            onChangeText={setSecret}
            placeholder="Admin passphrase"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleUnlock}
          />
          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={handleUnlock}
            disabled={authenticating || !secret.trim()}
          >
            {authenticating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.unlockBtnText}>Unlock</Text>
            )}
          </TouchableOpacity>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracker</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
          <Ionicons name="refresh" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.statsRow}>
            <StatTile label="People" value={totals.people} />
            <StatTile label="Views" value={totals.views} />
            <StatTile label="Saves" value={totals.saves} />
            <StatTile label="Applies" value={totals.applies} />
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === 'people' && styles.tabActive]}
              onPress={() => setTab('people')}
            >
              <Text style={[styles.tabText, tab === 'people' && styles.tabTextActive]}>By person</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'listings' && styles.tabActive]}
              onPress={() => setTab('listings')}
            >
              <Text style={[styles.tabText, tab === 'listings' && styles.tabTextActive]}>By listing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'sources' && styles.tabActive]}
              onPress={() => setTab('sources')}
            >
              <Text style={[styles.tabText, tab === 'sources' && styles.tabTextActive]}>Sources</Text>
            </TouchableOpacity>
          </View>

          {tab === 'people' ? (
            byDevice.length === 0 ? (
              <Text style={styles.emptyText}>No activity logged yet.</Text>
            ) : (
              byDevice.map((p) => <PersonRow key={p.device_id} person={p} />)
            )
          ) : tab === 'listings' ? (
            byListing.length === 0 ? (
              <Text style={styles.emptyText}>No activity logged yet.</Text>
            ) : (
              byListing.map((l) => <ListingRow key={l.internship_id} listing={l} />)
            )
          ) : bySource.length === 0 ? (
            <Text style={styles.emptyText}>No onboarding sources logged yet.</Text>
          ) : (
            bySource.map((s) => <SourceRow key={s.referral_source} source={s} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  backBtn: { padding: Spacing[1] },
  headerTitle: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[6] },
  errorText: { fontSize: Typography.size.base, color: Colors.error, textAlign: 'center', marginTop: Spacing[3] },
  secretInput: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.size.base,
    color: Colors.text,
    marginBottom: Spacing[3],
    ...Shadows.sm,
  },
  unlockBtn: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  unlockBtnText: { color: '#FFFFFF', fontWeight: Typography.weight.semibold, fontSize: Typography.size.base },
  scrollContent: { padding: Spacing[4], paddingBottom: Spacing[10] },
  statsRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4] },
  statTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.bold, color: Colors.text },
  statLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[3] },
  tab: {
    flex: 1,
    paddingVertical: Spacing[2],
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  tabTextActive: { color: '#FFFFFF', fontWeight: Typography.weight.semibold },
  emptyText: { fontSize: Typography.size.base, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing[6] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    ...Shadows.sm,
  },
  rowTitle: { fontSize: Typography.size.sm, color: Colors.text, fontWeight: Typography.weight.semibold },
  rowSubtitle: { fontSize: Typography.size.xs, color: Colors.textSecondary, marginTop: 2 },
  rowCounts: { alignItems: 'flex-end' },
  rowCount: { fontSize: Typography.size.xs, color: Colors.textSecondary },
});
