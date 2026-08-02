// screens/HomeScreen.js
// Main internship browse feed — personalized sort by user interests + location.
//
// NEW FEATURES:
// • "Today's Pick For You" — one daily counselor-style highlight with personal reason
// • "Because you looked at X…" — behavioral recommendations based on viewedIds
// • Match reason tags on each card (why this matches your profile)
// • Competitiveness badge on each card (Open / Moderate / Competitive)
// • College major alignment hint on featured card

import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClosedBadge, CompanyLogo, DeadlineBadge, PremiumUpsellBanner, SectionHeader, Tag } from '../components';
import { useUser } from '../context/UserContext';
import { INTERNSHIPS, refreshInternships, subscribeToInternships } from '../data';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import {
  computeMatchReasons,
  computeMatchScore,
  computeSimilarityScore,
  getCompetitivenessConfig,
  getCompetitivenessLevel,
  getEffectiveDaysLeft,
  getEligibilityStatus,
  isItemExpired,
  isNationwideOrRemote,
} from '../utils/matching';

// HELPERS 

function getGreeting() {
 const h = new Date().getHours();
 if (h < 12) return 'Good morning';
 if (h < 17) return 'Good afternoon';
 return 'Good evening';
}

function getInitials(name) {
 if (!name || name.trim() === '') return '?';
 return name.trim().split(/\s+/).map((n) => n[0].toUpperCase()).slice(0, 2).join('');
}

function getDailySeed() {
 const d = new Date();
 return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// Builds a human-readable reason sentence for the "Today's Pick" card
function buildDailyPickReason(item, user) {
 const reasons = computeMatchReasons(item, user);
 if (reasons.length === 0) return `${item.company} is a great program worth exploring.`;
 const firstName = user.name ? user.name.split(' ')[0] : null;
 const intro = firstName ? `${firstName}, based on your profile` : 'Based on your profile';
 if (reasons.length === 1) return `${intro}: ${reasons[0].toLowerCase()}.`;
 return `${intro}: ${reasons[0].toLowerCase()} and ${reasons[1].toLowerCase()}.`;
}

// INTERNSHIP CARD 

const InternshipCard = memo(({ item, onPress, onSave, saved, isTopPick, user }) => {
 const daysLeft = getEffectiveDaysLeft(item);
 const closed = isItemExpired(item);
 const safeUser = user || {};
 // Location eligibility — same hard gate that zeroes the match score
 const locStatus = getEligibilityStatus(item, safeUser);
 return (
 <TouchableOpacity
  style={[styles.card, closed && styles.cardClosed]}
  onPress={onPress}
  activeOpacity={0.97}
  accessibilityRole="button"
  accessibilityLabel={`${item.role} at ${item.company}${closed ? ', applications closed' : ''}`}
 >
 <View style={styles.cardHeader}>
 <CompanyLogo name={item.company} size={44} color={item.logoColor} />
 <View style={styles.cardHeaderText}>
 <View style={styles.cardRoleRow}>
 {isTopPick && <Text style={styles.starIcon}>★</Text>}
 <Text style={styles.cardRole} numberOfLines={1}>{item.role}</Text>
 </View>
 <Text style={styles.cardCompany} numberOfLines={1}>{item.company}</Text>
 </View>
 <TouchableOpacity
 onPress={onSave}
 activeOpacity={0.7}
 style={styles.saveButton}
 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
 accessibilityRole="button"
 accessibilityLabel={saved ? 'Remove from saved' : 'Save internship'}
 accessibilityState={{ selected: saved }}
 >
 <Ionicons
 name={saved ? 'bookmark' : 'bookmark-outline'}
 size={20}
 color={saved ? Colors.accent : Colors.textTertiary}
 />
 </TouchableOpacity>
 </View>

 <Text style={styles.cardLocation}>{item.location}</Text>

 {!locStatus.eligible && (
 <View style={styles.reasonRow}>
 <View style={[styles.reasonTag, styles.ineligibleLocRow]}>
 <Text style={[styles.reasonTagText, { color: Colors.error }]}>
 0% match, not eligible
 </Text>
 <TouchableOpacity
 onPress={() =>
 Alert.alert(
 'Eligibility requirement not met',
 locStatus.reason ||
 'This program has an eligibility requirement your profile doesn’t meet.',
 [{ text: 'OK' }],
 )
 }
 hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
 accessibilityRole="button"
 accessibilityLabel="Why am I not eligible?"
 >
 <Ionicons name="information-circle-outline" size={14} color={Colors.error} />
 </TouchableOpacity>
 </View>
 </View>
 )}

 <View style={styles.cardFooter}>
 <View style={styles.cardTags}>
 {(item.tags || []).filter((tag) => tag !== 'Paid').slice(0, 2).map((tag) => (
 <Tag key={tag} label={tag} variant={tag} />
 ))}
 </View>
 {closed ? <ClosedBadge /> : (daysLeft !== null && <DeadlineBadge daysLeft={daysLeft} />)}
 </View>
 </TouchableOpacity>
 );
});
InternshipCard.displayName = 'InternshipCard';

// TODAY'S PICK CARD 

const TodaysPickCard = ({ item, onPress, user }) => {
 const daysLeft = getEffectiveDaysLeft(item);
 const reason = buildDailyPickReason(item, user || {});
 const compLevel = getCompetitivenessLevel(item);
 const compConfig = getCompetitivenessConfig(compLevel);

 return (
 <TouchableOpacity style={styles.todayCard} onPress={onPress} activeOpacity={0.95}>
 <View style={styles.todayCardTop}>
 <View style={styles.todayBadge}>
 <Text style={styles.todayBadgeText}>Today's Pick</Text>
 </View>
 <View style={[styles.compBadge, { backgroundColor: compConfig.bg }]}>
 <Text style={[styles.compBadgeText, { color: compConfig.color }]}>
 {compConfig.label}
 </Text>
 </View>
 </View>
 <View style={styles.todayCardBody}>
 <CompanyLogo name={item.company} size={48} color={item.logoColor} />
 <View style={styles.todayCardText}>
 <Text style={styles.todayRole} numberOfLines={2}>{item.role}</Text>
 <Text style={styles.todayCompany}>{item.company}</Text>
 <Text style={styles.todayLocation} numberOfLines={1}>{item.location}</Text>
 </View>
 </View>
 <View style={styles.todayReason}>
 <Text style={styles.todayReasonText}>{reason}</Text>
 </View>
 <View style={styles.todayCardFooter}>
 {(item.tags || []).slice(0, 2).map((tag) => (
 <Tag key={tag} label={tag} variant={tag} />
 ))}
 {daysLeft !== null && <DeadlineBadge daysLeft={daysLeft} />}
 </View>
 </TouchableOpacity>
 );
};

// BEHAVIORAL RECO CARD 

const BehaviorCard = ({ item, onPress, sourceName }) => {
 const daysLeft = getEffectiveDaysLeft(item);
 return (
 <TouchableOpacity
 style={styles.behaviorCard}
 onPress={onPress}
 activeOpacity={0.9}
 >
 <CompanyLogo name={item.company} size={32} color={item.logoColor} />
 <Text style={styles.behaviorRole} numberOfLines={2}>{item.role}</Text>
 <Text style={styles.behaviorCompany} numberOfLines={1}>{item.company}</Text>
 {daysLeft !== null && (
 <View style={{ marginTop: 'auto', paddingTop: 8 }}>
 <DeadlineBadge daysLeft={daysLeft} />
 </View>
 )}
 </TouchableOpacity>
 );
};

// HOME SCREEN 

export default function HomeScreen({ navigation }) {
 const { user = {}, savedIds = [], viewedIds = [], topPickIds = [], toggleSaved } = useUser();
 const [refreshing, setRefreshing] = useState(false);
 const [internships, setInternships] = useState(INTERNSHIPS);
 const [isLoading, setIsLoading] = useState(INTERNSHIPS.length === 0);

 useEffect(() => {
 const unsub = subscribeToInternships((data) => {
 setInternships(data);
 setIsLoading(false);
 });
 return unsub;
 }, []);

 const safeUser = user || {};
 const hasInterests = Array.isArray(safeUser.interests) && safeUser.interests.length > 0;
 const hasLocation = !!(safeUser.location || safeUser.state);
 const userName = safeUser.name || '';
 const userLocation = safeUser.location || '';
 const isRemoteOnly = safeUser.remoteOnly || false;

 const greeting = getGreeting();
 const greetingName = userName ? `, ${userName.split(' ')[0]}` : '';

 const headerSubtitle = (() => {
 if (isRemoteOnly) return 'Remote internships';
 if (hasLocation && !hasInterests) return `Near ${userLocation || safeUser.state}`;
 if (hasInterests) return (safeUser.interests || []).slice(0, 3).join(' · ');
 return 'Find your internship';
 })();

 // Cache match scores so computeMatchScore() runs once per internship when user/data changes,
 // not redundantly during sort comparisons (sort calls comparator O(n log n) times).
 const matchScoreCache = useMemo(() => {
   const cache = {};
   for (const item of internships) {
     cache[item.id] = computeMatchScore(item, safeUser) ?? 0;
   }
   return cache;
 }, [internships, safeUser.grade, safeUser.interests, safeUser.location, safeUser.state, safeUser.remoteOnly, safeUser.gpaRange, safeUser.readiness]);

 const sorted = useMemo(() => {
  const pool = internships.filter((item) => {
 // remoteOnly users: only show remote/nationwide items
 if (isRemoteOnly) return isNationwideOrRemote(item);
 // All other users see everything — scoring sorts by proximity
 return true;
 });
 return [...pool].sort((a, b) => {
 // Closed programs always rank last, regardless of match score
 const aExp = isItemExpired(a) ? 1 : 0;
 const bExp = isItemExpired(b) ? 1 : 0;
 if (aExp !== bExp) return aExp - bExp;
 const aScore = matchScoreCache[a.id] ?? 0;
 const bScore = matchScoreCache[b.id] ?? 0;
 if (bScore !== aScore) return bScore - aScore;
 if (a.featured !== b.featured) return a.featured ? -1 : 1;
 const aDays = getEffectiveDaysLeft(a) ?? 9999;
 const bDays = getEffectiveDaysLeft(b) ?? 9999;
 if (aDays !== bDays) return aDays - bDays;
 return (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0);
 });
 }, [internships, isRemoteOnly, matchScoreCache, hasInterests]);

 // O(1) Set lookups instead of O(n) .includes() per card render
 const savedSet = useMemo(() => new Set(savedIds || []), [savedIds]);
 const topPickSet = useMemo(() => new Set(topPickIds || []), [topPickIds]);

  // TODAY'S PICK: stable per day, top scoring item — never a closed program
  const todaysPick = useMemo(() => {
    if (sorted.length === 0) return null;
    const seed = getDailySeed();
    const top = sorted.filter((i) => !isItemExpired(i)).slice(0, 8);
    if (top.length === 0) return null;
    return top[seed % top.length];
  }, [sorted]);

 const closingSoon = useMemo(() => {
 return internships
 .map((item) => ({ item, daysLeft: getEffectiveDaysLeft(item) }))
 .filter(({ daysLeft }) => daysLeft !== null && daysLeft > 0 && daysLeft <= 14)
 .sort((a, b) => a.daysLeft - b.daysLeft)
 .slice(0, 5)
 .map(({ item }) => item);
 }, [internships]);

 // Full count within the 30-day window the ClosingSoon screen shows —
 // the rail above is capped at 5, so its length would understate the stat.
 const closingSoonCount = useMemo(() => {
 return internships.filter((item) => {
 const d = getEffectiveDaysLeft(item);
 return d !== null && d > 0 && d <= 30;
 }).length;
 }, [internships]);

 const recentlyViewed = useMemo(() => {
 if (!viewedIds || viewedIds.length === 0) return [];
 return viewedIds
 .slice(0, 6)
 .map((id) => internships.find((i) => i.id === id))
 .filter(Boolean);
 }, [viewedIds, internships]);

 // BECAUSE YOU LOOKED AT X…: similarity-based behavioral recommendations
 const becauseYouLookedAt = useMemo(() => {
 if (!viewedIds || viewedIds.length === 0) return { sourceName: null, items: [] };
 // Use the most recently viewed item as the source
 const sourceId = viewedIds[0];
 const source = internships.find((i) => i.id === sourceId);
 if (!source) return { sourceName: null, items: [] };
 const savedSet = new Set(savedIds || []);
 const candidates = internships
 .filter((item) => item.id !== sourceId && !savedSet.has(item.id) && !isItemExpired(item))
 .map((item) => ({ item, sim: computeSimilarityScore(source, item) }))
 .filter(({ sim }) => sim >= 30)
 .sort((a, b) => b.sim - a.sim)
 .slice(0, 5)
 .map(({ item }) => item);
 return { sourceName: source.role, items: candidates };
 }, [viewedIds, internships, savedIds]);

 const onRefresh = useCallback(async () => {
   setRefreshing(true);
   try {
     await refreshInternships();
   } catch (_) {}
   setRefreshing(false);
 }, []);

 const renderCard = useCallback(({ item }) => (
   <InternshipCard
     item={item}
     user={safeUser}
     onPress={() => navigation?.navigate('Detail', { item })}
     onSave={() => toggleSaved(item.id)}
     saved={savedSet.has(item.id)}
     isTopPick={topPickSet.has(item.id)}
   />
 ), [navigation, toggleSaved, savedSet, topPickSet, safeUser]);

 const keyExtractor = useCallback((item) => item.id, []);

 const listHeader = useMemo(() => (
   <>
     {/* Header */}
     <View style={styles.header}>
       <View style={styles.headerLeft}>
         <Text style={styles.headerGreeting}>{greeting}{greetingName}</Text>
         <Text style={styles.headerTitle} numberOfLines={1}>{headerSubtitle}</Text>
       </View>
       <TouchableOpacity
         style={styles.avatarBtn}
         onPress={() => navigation?.navigate('Profile')}
         accessibilityRole="button"
         accessibilityLabel="Open your profile"
       >
         <Text style={styles.avatarText}>{getInitials(userName)}</Text>
       </TouchableOpacity>
     </View>

     {/* Sticky Search Bar */}
     <View style={styles.searchWrapper}>
       <TouchableOpacity
         style={styles.searchBar}
         activeOpacity={0.85}
         onPress={() => navigation?.navigate('Search', { focusToken: Date.now() })}
         accessibilityRole="search"
         accessibilityLabel="Search roles and companies"
       >
         <Ionicons name="search" size={18} color={Colors.textTertiary} style={{ marginRight: 6 }} />
         <Text style={styles.searchInputPlaceholder}>Search roles, companies...</Text>
       </TouchableOpacity>
     </View>

     {/* Personalization banner */}
     {hasInterests && (
       <View style={styles.personalizationBanner}>
         <Text style={styles.personalizationLabel}>Personalized for you</Text>
         <View style={styles.personalizationPills}>
           {(safeUser.interests || []).slice(0, 3).map((interest) => (
             <View key={interest} style={styles.interestPill}>
               <Text style={styles.interestPillText}>{interest}</Text>
             </View>
           ))}
         </View>
       </View>
     )}

     {/* Quick stats strip */}
     {(savedIds.length > 0 || viewedIds.length > 0) && (
       <View style={styles.quickStats}>
         <TouchableOpacity
           style={styles.quickStatBox}
           onPress={() => navigation?.navigate('Tracker')}
           activeOpacity={0.7}
         >
           <Text style={styles.quickStatValue}>{(savedIds || []).length}</Text>
           <Text style={styles.quickStatLabel}>Saved</Text>
         </TouchableOpacity>
         <View style={styles.quickStatDivider} />
         <TouchableOpacity
           style={styles.quickStatBox}
           onPress={() => navigation?.navigate('Tracker')}
           activeOpacity={0.7}
         >
           <Text style={styles.quickStatValue}>{(topPickIds || []).length}</Text>
           <Text style={styles.quickStatLabel}>Top picks</Text>
         </TouchableOpacity>
         <View style={styles.quickStatDivider} />
         <TouchableOpacity
           style={styles.quickStatBox}
           onPress={() => navigation?.navigate('ClosingSoon')}
           activeOpacity={0.7}
         >
           <Text style={styles.quickStatValue}>{closingSoonCount}</Text>
           <Text style={styles.quickStatLabel}>Closing soon</Text>
         </TouchableOpacity>
       </View>
     )}

     {/* TODAY'S PICK */}
     {todaysPick && (
       <View style={styles.section}>
         <SectionHeader title="Today's Pick For You" />
         <TodaysPickCard
           item={todaysPick}
           user={safeUser}
           onPress={() => navigation?.navigate('Detail', { item: todaysPick })}
         />
       </View>
     )}

     {/* Closing soon */}
     {closingSoon.length > 0 && (
       <View style={styles.section}>
         <SectionHeader
           title="Closing soon"
           action="See all"
           onAction={() => navigation?.navigate('ClosingSoon')}
         />
         <ScrollView
           horizontal
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={{ gap: Spacing[3], paddingRight: Spacing.screenPadding }}
         >
           {closingSoon.map((item) => {
             const daysLeft = getEffectiveDaysLeft(item);
             return (
               <TouchableOpacity
                 key={item.id}
                 style={styles.closingSoonCard}
                 onPress={() => navigation?.navigate('Detail', { item })}
                 activeOpacity={0.9}
               >
                 <CompanyLogo name={item.company} size={36} color={item.logoColor} />
                 <Text style={styles.closingSoonRole} numberOfLines={2}>{item.role}</Text>
                 <Text style={styles.closingSoonCompany} numberOfLines={1}>{item.company}</Text>
                 <View style={{ flex: 1 }} />
                 {daysLeft !== null && <DeadlineBadge daysLeft={daysLeft} />}
               </TouchableOpacity>
             );
           })}
         </ScrollView>
       </View>
     )}

     {/* Premium upsell */}
     {!safeUser.premium && (
       <View style={[styles.section, { marginTop: closingSoon.length > 0 ? 0 : Spacing[2] }]}>
         <PremiumUpsellBanner
           icon="rocket-outline"
           title="Unlock Interny Premium"
           sub="Unlimited AI chat, essay review, interview prep, and more."
           onPress={() => navigation?.navigate('Paywall')}
         />
       </View>
     )}

     {/* BECAUSE YOU LOOKED AT X… */}
     {becauseYouLookedAt.items.length > 0 && (
       <View style={styles.section}>
         <SectionHeader
           title={`Because you looked at ${becauseYouLookedAt.sourceName || 'a recent listing'}`}
         />
         <ScrollView
           horizontal
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={{ gap: Spacing[3], paddingRight: Spacing.screenPadding }}
         >
           {becauseYouLookedAt.items.map((item) => (
             <BehaviorCard
               key={`bec-${item.id}`}
               item={item}
               sourceName={becauseYouLookedAt.sourceName}
               onPress={() => navigation?.navigate('Detail', { item })}
             />
           ))}
         </ScrollView>
       </View>
     )}

     {/* Recently viewed */}
     {recentlyViewed.length > 0 && (
       <View style={styles.section}>
         <SectionHeader title="Pick up where you left off" />
         <ScrollView
           horizontal
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={{ gap: Spacing[2], paddingRight: Spacing.screenPadding }}
         >
           {recentlyViewed.map((item) => (
             <TouchableOpacity
               key={item.id}
               style={styles.recentMiniCard}
               onPress={() => navigation?.navigate('Detail', { item })}
               activeOpacity={0.85}
             >
               <CompanyLogo name={item.company} size={32} color={item.logoColor} />
               <Text style={styles.recentMiniRole} numberOfLines={1}>{item.role}</Text>
               <Text style={styles.recentMiniCompany} numberOfLines={1}>{item.company}</Text>
             </TouchableOpacity>
           ))}
         </ScrollView>
       </View>
     )}

     {/* Main listings section header */}
     <View style={[styles.section, { marginBottom: 0 }]}>
       <SectionHeader
         title={hasInterests ? 'For You' : 'All Internships'}
         action={`${sorted.length} found`}
       />
     </View>
   </>
 ), [
   greeting, greetingName, headerSubtitle, userName, hasInterests, safeUser,
   savedIds, viewedIds, topPickIds, closingSoon, closingSoonCount, todaysPick,
   becauseYouLookedAt, recentlyViewed, sorted.length, navigation, safeUser.premium,
 ]);

 const listFooter = useMemo(() => <View style={{ height: Spacing[8] }} />, []);

 const listEmpty = useMemo(() => (
   <View style={[styles.section, styles.emptyState]}>
     <Text style={styles.emptyTitle}>No internships found</Text>
     <Text style={styles.emptySubtitle}>
       Try adjusting your search or update your preferences in Profile
     </Text>
   </View>
 ), []);

 if (isLoading) {
   return (
     <SafeAreaView style={styles.safe} edges={['top']}>
       <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
       <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color={Colors.accent} />
         <Text style={styles.loadingText}>Finding internships for you…</Text>
       </View>
     </SafeAreaView>
   );
 }

 return (
   <SafeAreaView style={styles.safe} edges={['top']}>
     <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
     <FlatList
       style={styles.scroll}
       contentContainerStyle={styles.scrollContent}
       data={sorted}
       keyExtractor={keyExtractor}
       renderItem={renderCard}
       ListHeaderComponent={listHeader}
       ListFooterComponent={listFooter}
       ListEmptyComponent={listEmpty}
       showsVerticalScrollIndicator={false}
       removeClippedSubviews={true}
       maxToRenderPerBatch={8}
       windowSize={10}
       initialNumToRender={6}
       refreshControl={
         <RefreshControl
           refreshing={refreshing}
           onRefresh={onRefresh}
           tintColor={Colors.accent}
         />
       }
     />
   </SafeAreaView>
 );
}

// STYLES 

const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor: Colors.background },
 loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
 loadingText: { fontSize: Typography.size.sm, color: Colors.textTertiary },
 scroll: { flex: 1 },
 scrollContent: { paddingBottom: Spacing[12] },

 header: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: Spacing.screenPadding,
 paddingTop: Spacing[4],
 paddingBottom: Spacing[4],
 backgroundColor: Colors.background,
 },
 headerLeft: { flex: 1, marginRight: Spacing[3] },
 headerGreeting: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.medium,
 color: Colors.textTertiary,
 letterSpacing: 0.2,
 marginBottom: 2,
 },
 headerTitle: {
 fontSize: Typography.size['2xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 letterSpacing: -0.4,
 },
 avatarBtn: {
 width: 40,
 height: 40,
 borderRadius: Radii.full,
 backgroundColor: Colors.accentLight,
 alignItems: 'center',
 justifyContent: 'center',
 flexShrink: 0,
 },
 avatarText: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.bold,
 color: Colors.accent,
 },

 searchWrapper: {
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[2],
 backgroundColor: Colors.background,
 },
 searchBar: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 borderWidth: 1,
 borderColor: Colors.border,
 paddingHorizontal: Spacing[3],
 height: 48,
 ...Shadows.card,
 },
 searchIcon: { fontSize: Typography.size.md, color: Colors.textTertiary },
 searchInputPlaceholder: {
 flex: 1,
 fontSize: Typography.size.md,
 color: Colors.textTertiary,
 paddingVertical: 0,
 },

 personalizationBanner: {
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[2],
 backgroundColor: Colors.accentLight,
 borderBottomWidth: 1,
 borderBottomColor: Colors.border,
 gap: Spacing[2],
 },
 personalizationLabel: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 color: Colors.accent,
 letterSpacing: 0.2,
 },
 personalizationPills: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
 interestPill: {
 paddingHorizontal: 8,
 paddingVertical: 3,
 borderRadius: Radii.full,
 backgroundColor: Colors.accent,
 },
 interestPillText: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 color: Colors.white,
 },

 quickStats: {
 flexDirection: 'row',
 marginHorizontal: Spacing.screenPadding,
 marginTop: Spacing[3],
 backgroundColor: Colors.surface,
 borderRadius: Radii.lg,
 borderWidth: 1,
 borderColor: Colors.border,
 paddingVertical: Spacing[3],
 ...Shadows.card,
 },
 quickStatBox: { flex: 1, alignItems: 'center' },
 quickStatValue: {
 fontSize: Typography.size.xl,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 quickStatLabel: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.medium,
 color: Colors.textTertiary,
 textTransform: 'uppercase',
 letterSpacing: 0.3,
 },
 quickStatDivider: {
 width: 1,
 backgroundColor: Colors.divider,
 marginVertical: Spacing[1],
 },

 section: {
 paddingHorizontal: Spacing.screenPadding,
 marginTop: Spacing[5],
 },

 // Today's Pick card
 todayCard: {
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 padding: Spacing[4],
 borderWidth: 1.5,
 borderColor: Colors.accent,
 ...Shadows.elevated,
 },
 todayCardTop: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: Spacing[2],
 marginBottom: Spacing[3],
 },
 todayBadge: {
 backgroundColor: Colors.accent,
 borderRadius: Radii.full,
 paddingHorizontal: 10,
 paddingVertical: 4,
 },
 todayBadgeText: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.bold,
 color: Colors.white,
 letterSpacing: 0.3,
 },
 todayCardBody: {
 flexDirection: 'row',
 alignItems: 'flex-start',
 gap: Spacing[3],
 marginBottom: Spacing[3],
 },
 todayCardText: { flex: 1 },
 todayRole: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 marginBottom: 2,
 letterSpacing: -0.2,
 },
 todayCompany: {
 fontSize: Typography.size.base,
 color: Colors.textSecondary,
 marginBottom: 2,
 },
 todayLocation: { fontSize: Typography.size.sm, color: Colors.textTertiary },
 todayReason: {
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.lg,
 padding: Spacing[3],
 marginBottom: Spacing[3],
 },
 todayReasonText: {
 fontSize: Typography.size.sm,
 color: Colors.accent,
 lineHeight: Typography.size.sm * 1.5,
 fontStyle: 'italic',
 },
 todayCardFooter: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: Spacing[2],
 flexWrap: 'wrap',
 },

 // Featured card
 featuredCard: {
 backgroundColor: Colors.accent,
 borderRadius: Radii.xl,
 padding: Spacing[5],
 ...Shadows.elevated,
 },
 featuredBadge: {
 alignSelf: 'flex-start',
 backgroundColor: 'rgba(255,255,255,0.2)',
 borderRadius: Radii.full,
 paddingHorizontal: 10,
 paddingVertical: 4,
 marginBottom: Spacing[3],
 },
 featuredBadgeText: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 color: Colors.white,
 letterSpacing: 0.5,
 textTransform: 'uppercase',
 },
 featuredRole: {
 fontSize: Typography.size['2xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.white,
 marginBottom: 4,
 letterSpacing: -0.3,
 },
 featuredCompany: {
 fontSize: Typography.size.md,
 color: 'rgba(255,255,255,0.75)',
 marginBottom: 4,
 },
 featuredMajors: {
 fontSize: Typography.size.sm,
 color: 'rgba(255,255,255,0.85)',
 marginBottom: Spacing[4],
 lineHeight: Typography.size.sm * 1.5,
 },
 featuredFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },

 // Behavioral reco card
 behaviorCard: {
 width: 160,
 minHeight: 150,
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 borderWidth: 1,
 borderColor: Colors.border,
 padding: Spacing[3],
 gap: 4,
 ...Shadows.card,
 },
 behaviorRole: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 marginTop: Spacing[2],
 lineHeight: Typography.size.sm * 1.4,
 },
 behaviorCompany: {
 fontSize: Typography.size.xs,
 color: Colors.textTertiary,
 },

 closingSoonCard: {
 width: 180,
 minHeight: 160,
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 borderWidth: 1,
 borderColor: Colors.border,
 padding: Spacing[3],
 gap: Spacing[1],
 flexDirection: 'column',
 ...Shadows.card,
 },
 closingSoonRole: {
 fontSize: Typography.size.base,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 marginTop: Spacing[2],
 },
 closingSoonCompany: {
 fontSize: Typography.size.sm,
 color: Colors.textSecondary,
 marginBottom: Spacing[2],
 },

 recentMiniCard: {
 width: 140,
 backgroundColor: Colors.surface,
 borderRadius: Radii.lg,
 borderWidth: 1,
 borderColor: Colors.border,
 padding: Spacing[3],
 gap: 4,
 },
 recentMiniRole: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 marginTop: Spacing[2],
 },
 recentMiniCompany: {
 fontSize: Typography.size.xs,
 color: Colors.textTertiary,
 },

 discoverCard: {
 width: 220,
 minHeight: 140,
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 borderWidth: 1,
 borderColor: Colors.border,
 padding: Spacing[4],
 gap: Spacing[2],
 ...Shadows.card,
 },
 discoverHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: Spacing[2],
 },
 discoverRole: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 },
 discoverCompany: {
 fontSize: Typography.size.sm,
 color: Colors.textSecondary,
 },

 // Main listing card
 card: {
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 padding: Spacing.cardPadding,
 marginBottom: Spacing.cardGap,
 borderWidth: 1,
 borderColor: Colors.border,
 ...Shadows.card,
 },
 cardClosed: { opacity: 0.6 },
 ineligibleLocRow: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 4,
 backgroundColor: Colors.errorLight,
 },
 cardHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 marginBottom: Spacing[2],
 },
 cardHeaderText: {
 flex: 1,
 marginLeft: Spacing[3],
 marginRight: Spacing[2],
 },
 cardRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
 starIcon: { fontSize: Typography.size.md, color: Colors.warning },
 cardRole: {
 flexShrink: 1,
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 cardCompany: { fontSize: Typography.size.base, color: Colors.textSecondary },
 saveButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
 saveIcon: { fontSize: 18, color: Colors.textTertiary },
 cardLocation: {
 fontSize: Typography.size.sm,
 color: Colors.textTertiary,
 marginBottom: Spacing[2],
 marginLeft: 44 + Spacing[3],
 },

 // Match reason tags
 reasonRow: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 6,
 marginBottom: Spacing[2],
 marginLeft: 44 + Spacing[3],
 },
 reasonTag: {
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.full,
 paddingHorizontal: 8,
 paddingVertical: 3,
 },
 reasonTagText: {
 fontSize: Typography.size.xs,
 color: Colors.accent,
 fontWeight: Typography.weight.semibold,
 },

 // Competitiveness badge
 compBadge: {
 borderRadius: Radii.full,
 paddingHorizontal: 8,
 paddingVertical: 3,
 },
 compBadgeText: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 },

 cardFooter: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 },
 cardTags: { flexDirection: 'row', gap: Spacing[1], flexWrap: 'wrap', flex: 1 },

 emptyState: { alignItems: 'center', paddingVertical: Spacing[10] },
 emptyTitle: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.semibold,
 color: Colors.textSecondary,
 marginBottom: Spacing[2],
 },
 emptySubtitle: {
 fontSize: Typography.size.base,
 color: Colors.textTertiary,
 textAlign: 'center',
 lineHeight: Typography.size.base * 1.5,
 },
});
