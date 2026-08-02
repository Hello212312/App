// screens/SearchScreen.js

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClosedBadge, CompanyLogo, DeadlineBadge, PremiumUpsellBanner, Tag } from '../components';
import { useTourTarget } from '../context/TourContext';
import { useUser } from '../context/UserContext';
import { INTERNSHIPS as ALL_INTERNSHIPS, subscribeToInternships } from '../data';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import { computeMatchScore, detectPayType, getCompetitivenessLevel, getEffectiveDaysLeft, gradeIsEligible, isItemExpired } from '../utils/matching';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FILTER_GROUPS = [
  {
    label: 'Field',
    key: 'field',
    options: [
      'Medicine', 'Engineering', 'Science', 'Computer Science',
      'Arts', 'Business', 'Law/Advocacy', 'Environment',
      'Journalism', 'History', 'Astronomy', 'Social Science',
    ],
  },
  {
    label: 'Format',
    key: 'format',
    options: ['Remote', 'In Person'],
  },
  {
    label: 'Pay',
    key: 'pay',
    // DB semantics: 'Stipend' = student earns money; 'Paid' = student pays a
    // program fee; 'Unpaid' = free, no money either way. Student-facing labels
    // below map onto those — the raw words were misleading in the UI.
    options: ['Stipend (you earn)', 'Free', 'Program fee (you pay)'],
  },
  {
    label: 'Difficulty',
    key: 'competitiveness',
    options: ['Beginner Friendly', 'Moderate', 'Competitive'],
  },
  {
    label: 'Availability',
    key: 'availability',
    options: ['Rolling'],
  },
  {
    label: 'Location',
    key: 'location',
    options: ['Near Me'],
  },
  {
    label: 'Program Type',
    key: 'programType',
    options: ['Multi-Field'],
  },
];

// The filter key stored in activeFilters for deadline month/day dropdowns
const DEADLINE_FILTER_KEY = '__deadline_md__';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const FIELD_OPTIONS = new Set(FILTER_GROUPS[0].options);
const COMPETITIVENESS_OPTIONS = new Set(['Beginner Friendly', 'Moderate', 'Competitive']);
const SORT_OPTIONS = ['Most Relevant', 'Deadline', 'Newest'];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getDaysLeft(item) {
  const live = getEffectiveDaysLeft(item);
  if (live !== null) return live;
  return 9999;
}

// FIX: single shared state extraction used by both filter and score,
// derived from user.state (preferred) or user.location (fallback)
function getUserStateAbbrev(user) {
  if (user.state) return user.state.toUpperCase().trim();
  if (user.location) {
    const commaIdx = user.location.indexOf(',');
    if (commaIdx !== -1) {
      return user.location.slice(commaIdx + 1).trim().toUpperCase().split(/\s+/)[0] || null;
    }
    const tokens = user.location.trim().split(/\s+/);
    const last = (tokens[tokens.length - 1] || '').toUpperCase();
    if (tokens.length >= 2 && last.length === 2) return last;
  }
  return null;
}

// field filter checks item.field and item.tags only.
// We do NOT scan role/company/overview text — that causes massive false-positives
// (e.g. any internship whose overview mentions the word "arts" gets counted under Arts).
// Art/Arts are stored inconsistently in the DB, so we normalize both sides.
function normalizeFieldLabel(label) {
  if (!label) return '';
  const s = label.trim().toLowerCase();
  // Treat "Art" and "Arts" as the same category
  if (s === 'art') return 'arts';
  // Treat "Law" and "Law/Advocacy" as the same category
  if (s === 'law') return 'law/advocacy';
  return s;
}
function itemFieldMatches(item, fieldFilter) {
  const normFilter = normalizeFieldLabel(fieldFilter);
  if (normalizeFieldLabel(item.field) === normFilter) return true;
  if ((item.tags || []).some((t) => normalizeFieldLabel(t) === normFilter)) return true;
  return false;
}

// Returns true if this program has a rolling/open deadline.
function isRollingOrOpen(item) {
  // A real non-Dec31 deadlineDate means the program has a fixed close date — not rolling.
  // (data.js defaults null deadline text to 'Rolling', so we can't trust the text alone.)
  if (item.deadlineDate) {
    const parts = item.deadlineDate.split('-');
    const isDecThirtyFirst =
      parts.length >= 3 && parts[1] === '12' && parts[2].startsWith('31');
    return isDecThirtyFirst;
  }
  // No deadlineDate — fall back to text
  const dl = (item.deadline || '').toLowerCase();
  return dl.includes('rolling') || dl.trim() === '';
}

// Uses the Supabase `remote` boolean as the primary source.
// Also checks item.locationFormat (the 'location(Remote/InPerson,Hybrid)' Supabase column)
// and tags as fallbacks.
function itemIsEffectivelyRemote(item) {
  if (item.remote) return true;
  if (item.locationFormat && item.locationFormat.toLowerCase() === 'remote') return true;
  if ((item.tags || []).some((t) => t.toLowerCase() === 'remote')) return true;
  return false;
}

const NATIONWIDE_KEYWORDS = [
  'nationwide', 'national', 'anywhere', 'globally', 'worldwide',
  'all states', 'all u.s',
];
function isNationwide(item) {
  const loc = (item.location || '').toLowerCase();
  return NATIONWIDE_KEYWORDS.some((kw) => loc.includes(kw));
}

// Unified state matching using a word-boundary regex, pre-compiled once per
// user-state change (not per item).
function buildStateRegex(userState) {
  if (!userState) return null;
  return new RegExp(`(?:^|[^A-Z])${userState}(?:[^A-Z]|$)`);
}

// ─── NEAR ME: US state adjacency map ─────────────────────────────────────────
// Each key is a 2-letter state abbreviation; value is the array of bordering states.
// Based on US geographic land borders. AK and HI have no land-bordering states.
const STATE_NEIGHBORS = {
  AL: ['FL','GA','MS','TN'],
  AK: [],
  AZ: ['CA','CO','NM','NV','UT'],
  AR: ['LA','MO','MS','OK','TN','TX'],
  CA: ['AZ','NV','OR'],
  CO: ['AZ','KS','NE','NM','OK','UT','WY'],
  CT: ['MA','NY','RI'],
  DC: ['MD','VA'],
  DE: ['MD','NJ','PA'],
  FL: ['AL','GA'],
  GA: ['AL','FL','NC','SC','TN'],
  HI: [],
  ID: ['MT','NV','OR','UT','WA','WY'],
  IL: ['IA','IN','KY','MO','WI'],
  IN: ['IL','KY','MI','OH'],
  IA: ['IL','MN','MO','NE','SD','WI'],
  KS: ['CO','MO','NE','OK'],
  KY: ['IL','IN','MO','OH','TN','VA','WV'],
  LA: ['AR','MS','TX'],
  ME: ['NH'],
  MD: ['DC','DE','PA','VA','WV'],
  MA: ['CT','NH','NY','RI','VT'],
  MI: ['IN','OH','WI'],
  MN: ['IA','ND','SD','WI'],
  MS: ['AL','AR','LA','TN'],
  MO: ['AR','IA','IL','KS','KY','NE','OK','TN'],
  MT: ['ID','ND','SD','WY'],
  NE: ['CO','IA','KS','MO','SD','WY'],
  NV: ['AZ','CA','ID','OR','UT'],
  NH: ['MA','ME','VT'],
  NJ: ['DE','NY','PA'],
  NM: ['AZ','CO','OK','TX','UT'],
  NY: ['CT','MA','NJ','PA','VT'],
  NC: ['GA','SC','TN','VA'],
  ND: ['MN','MT','SD'],
  OH: ['IN','KY','MI','PA','WV'],
  OK: ['AR','CO','KS','MO','NM','TX'],
  OR: ['CA','ID','NV','WA'],
  PA: ['DE','MD','NJ','NY','OH','WV'],
  RI: ['CT','MA'],
  SC: ['GA','NC'],
  SD: ['IA','MN','MT','ND','NE','WY'],
  TN: ['AL','AR','GA','KY','MO','MS','NC','VA'],
  TX: ['AR','LA','NM','OK'],
  UT: ['AZ','CO','ID','NV','NM','WY'],
  VT: ['MA','NH','NY'],
  VA: ['DC','KY','MD','NC','TN','WV'],
  WA: ['ID','OR'],
  WV: ['KY','MD','OH','PA','VA'],
  WI: ['IA','IL','MI','MN'],
  WY: ['CO','ID','MT','NE','SD','UT'],
};

// Returns a Set of state abbreviations: the user's own state + all bordering states.
function getNearbyStates(userState) {
  if (!userState) return new Set();
  const abbrev = userState.toUpperCase().trim();
  const neighbors = STATE_NEIGHBORS[abbrev] || [];
  return new Set([abbrev, ...neighbors]);
}

// Returns true if an item is in or near the user (nearby states set).
// Remote/nationwide programs are always included since they're accessible from anywhere.
function itemIsNearMe(item, nearbyStates) {
  if (nearbyStates.size === 0) return false;
  if (itemIsEffectivelyRemote(item)) return true;
  if (isNationwide(item)) return true;
  const loc = (item.location || '').toUpperCase();
  for (const state of nearbyStates) {
    const re = new RegExp(`(?:^|[^A-Z])${state}(?:[^A-Z]|$)`);
    if (re.test(loc)) return true;
  }
  return false;
}

// ─── MULTI-FIELD: programs that span many disciplines ─────────────────────────
// An item is "multi-field" only if it has the literal tag "Multi-Field" in its tags array.
function itemIsMultiField(item) {
  return (item.tags || []).some((t) => t === 'Multi-Field');
}

function itemMatchesActiveFilters(item, activeFilters, stateRegex, precomputed) {
  if (activeFilters.length === 0) return true;

  // Extract deadline month/day value (stored as '__deadline_md__:M-D')
  const deadlineMDFilter = activeFilters.find((f) => f.startsWith(DEADLINE_FILTER_KEY + ':'));
  const deadlineMD = deadlineMDFilter ? deadlineMDFilter.slice(DEADLINE_FILTER_KEY.length + 1) : null;

  const regularFilters = activeFilters.filter((f) => !f.startsWith(DEADLINE_FILTER_KEY));

  const fieldFilters       = regularFilters.filter((f) => FIELD_OPTIONS.has(f));
  const formatFilters      = regularFilters.filter((f) => f === 'Remote' || f === 'In Person');
  const payFilters         = regularFilters.filter((f) =>
    f === 'Stipend (you earn)' || f === 'Free' || f === 'Program fee (you pay)');
  const compFilters        = regularFilters.filter((f) => COMPETITIVENESS_OPTIONS.has(f));
  const locationFilters    = regularFilters.filter((f) => f === 'Near Me');
  const programTypeFilters = regularFilters.filter((f) => f === 'Multi-Field');
  const rollingFilters     = regularFilters.filter((f) => f === 'Rolling');

  const fieldOk =
    fieldFilters.length === 0 ||
    fieldFilters.some((f) => itemFieldMatches(item, f));

  const formatOk =
    formatFilters.length === 0 ||
    formatFilters.some((f) => {
      if (f === 'Remote')    return itemIsEffectivelyRemote(item);
      if (f === 'In Person') return !itemIsEffectivelyRemote(item);
      return false;
    });

  // Use pre-computed pay flags (avoids rebuilding tagsLower/overviewLower per item per filter)
  const { hasPaidTag, hasStipendTag } = precomputed;
  const payOk =
    payFilters.length === 0 ||
    payFilters.some((f) => {
      if (f === 'Stipend (you earn)')     return hasStipendTag;   // student earns
      if (f === 'Program fee (you pay)')  return hasPaidTag;      // student pays
      if (f === 'Free')                   return !hasPaidTag && !hasStipendTag;
      return false;
    });

  const compLevel = compFilters.length > 0 ? getCompetitivenessLevel(item) : null;
  const compOk =
    compFilters.length === 0 ||
    compFilters.some((f) => {
      if (f === 'Beginner Friendly') {
        // Beginner Friendly = explicitly open competitiveness only.
        // Rolling deadline does NOT imply beginner-friendly (a program can be open-ended AND competitive).
        return compLevel === 'open';
      }
      if (f === 'Moderate')          return compLevel === 'moderate';
      if (f === 'Competitive')       return compLevel === 'competitive';
      return false;
    });

  // Deadline: compare item's actual deadlineDate against the selected year/month/day.
  const deadlineOk = !deadlineMD || (() => {
    const parts = deadlineMD.split('-').map(Number);
    const [filterYear, filterMonth, filterDay] = parts;
    if (!filterYear || !filterMonth || !filterDay) return true;
    // Item must still be open
    const itemDays = getEffectiveDaysLeft(item);
    if (itemDays === null || itemDays <= 0) return false;
    if (!item.deadlineDate) return false;
    // Direct date comparison — item closes on or before the selected date
    const filterDate = new Date(filterYear, filterMonth - 1, filterDay);
    const dlParts = item.deadlineDate.split('-');
    const itemDate = new Date(parseInt(dlParts[0], 10), parseInt(dlParts[1], 10) - 1, parseInt(dlParts[2], 10));
    return itemDate <= filterDate;
  })();

  const locationOk =
    locationFilters.length === 0 || itemIsNearMe(item, precomputed.nearbyStates || new Set());

  const programTypeOk =
    programTypeFilters.length === 0 || itemIsMultiField(item);

  const rollingOk = rollingFilters.length === 0 || isRollingOrOpen(item);

  return fieldOk && formatOk && payOk && compOk && deadlineOk && locationOk && programTypeOk && rollingOk;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const ResultRow = memo(({ item, onPress, closed }) => {
  const daysLeft = getEffectiveDaysLeft(item);
  return (
    <TouchableOpacity
      style={[styles.resultRow, closed && { opacity: 0.55 }]}
      onPress={onPress}
      activeOpacity={0.97}
      accessibilityRole="button"
      accessibilityLabel={`${item.role} at ${item.company}${closed ? ', applications closed' : ''}`}
    >
      <CompanyLogo name={item.company} size={44} color={item.logoColor} />
      <View style={styles.resultText}>
        <Text style={styles.resultRole} numberOfLines={1}>{item.role}</Text>
        <Text style={styles.resultCompany} numberOfLines={1}>{item.company}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.resultLocation} numberOfLines={1}>{item.location}</Text>
          {closed ? (
            <>
              <View style={styles.resultDot} />
              <ClosedBadge />
            </>
          ) : daysLeft !== null ? (
            <>
              <View style={styles.resultDot} />
              <DeadlineBadge daysLeft={daysLeft} />
            </>
          ) : null}
        </View>
      </View>
      <Tag label={item.field} variant={item.field} />
    </TouchableOpacity>
  );
});
ResultRow.displayName = 'ResultRow';

const CategoryCard = memo(({ label, count, active, onPress }) => (
  <TouchableOpacity
    style={[styles.categoryCard, active && styles.categoryCardActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.categoryCount, active && styles.categoryCountActive]}>{count}</Text>
    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{label}</Text>
  </TouchableOpacity>
));
CategoryCard.displayName = 'CategoryCard';

const CheckboxRow = memo(({ label, checked, onPress }) => (
  <TouchableOpacity style={styles.checkboxRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkboxTick}>✓</Text>}
    </View>
    <Text style={[styles.checkboxLabel, checked && styles.checkboxLabelChecked]}>{label}</Text>
  </TouchableOpacity>
));
CheckboxRow.displayName = 'CheckboxRow';

// ─── DEADLINE PICKER ─────────────────────────────────────────────────────────

const DeadlinePicker = ({ selectedYear, selectedMonth, selectedDay, onSelect }) => {
  const [show, setShow] = useState(false);

  const displayDate =
    selectedYear && selectedMonth && selectedDay
      ? new Date(selectedYear, selectedMonth - 1, selectedDay)
      : new Date();

  const label =
    selectedYear && selectedMonth && selectedDay
      ? `By ${MONTHS[selectedMonth - 1]} ${selectedDay}, ${selectedYear}`
      : 'Pick a date';

  const handleChange = (event, date) => {
    setShow(false);
    if (!date || event.type === 'dismissed') return;
    onSelect(date.getFullYear(), date.getMonth() + 1, date.getDate());
  };

  return (
    <View style={{ marginTop: 8 }}>
      <TouchableOpacity style={dpStyles.btn} onPress={() => setShow(true)} activeOpacity={0.8}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={selectedMonth ? Colors.accent : Colors.textTertiary}
          style={{ marginRight: 8 }}
        />
        <Text style={[dpStyles.btnText, selectedMonth && dpStyles.btnTextActive]}>{label}</Text>
        {selectedMonth && (
          <TouchableOpacity
            onPress={() => onSelect(null, null, null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ marginLeft: 'auto' }}
          >
            <Text style={dpStyles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Float the picker above the filter sheet so it doesn't push content down */}
      {show && Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <TouchableWithoutFeedback onPress={() => setShow(false)}>
            <View style={dpStyles.overlay}>
              <TouchableWithoutFeedback>
                <View style={dpStyles.pickerCard}>
                  <DateTimePicker
                    value={displayDate}
                    mode="date"
                    display="inline"
                    onChange={handleChange}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : show ? (
        <DateTimePicker
          value={displayDate}
          mode="date"
          display="calendar"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
};

const dpStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2] + 2,
    backgroundColor: Colors.surface,
  },
  btnText: { fontSize: Typography.size.sm, color: Colors.textTertiary },
  btnTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },
  clearText: { fontSize: Typography.size.sm, color: Colors.textTertiary },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
});

// ─── FILTER MODAL ─────────────────────────────────────────────────────────────

// FIX: FilterModal now accepts a resultCount so it can show live results count on the apply button
const FilterModal = ({ visible, activeFilters, onToggle, onClear, onApply, resultCount, onDeadlineChange, userHasState }) => {
  // Extract current deadline selection (stored as YYYY-M-D)
  const deadlineFilter = activeFilters.find((f) => f.startsWith(DEADLINE_FILTER_KEY + ':'));
  const [selYear, selMonth, selDay] = deadlineFilter
    ? deadlineFilter.slice(DEADLINE_FILTER_KEY.length + 1).split('-').map(Number)
    : [null, null, null];

  return (
  <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
    <TouchableWithoutFeedback onPress={onApply}>
      <View style={styles.modalOverlay} />
    </TouchableWithoutFeedback>
    <View style={styles.modalSheet}>
      <View style={styles.modalHandle} />
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Filters</Text>
        {activeFilters.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.modalClear}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {FILTER_GROUPS.map((group) => (
          <View key={group.key} style={styles.filterGroup}>
            <Text style={styles.filterGroupLabel}>{group.label}</Text>
            {group.options.map((opt) => (
              <View key={opt}>
                <CheckboxRow
                  label={opt}
                  checked={activeFilters.includes(opt)}
                  onPress={() => onToggle(opt)}
                />
                {opt === 'Near Me' && activeFilters.includes('Near Me') && !userHasState && (
                  <Text style={styles.nearMeWarning}>
                    Set your location in Profile to use this filter.
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Deadline — native date picker */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Deadline</Text>
          <DeadlinePicker
            selectedYear={selYear}
            selectedMonth={selMonth}
            selectedDay={selDay}
            onSelect={onDeadlineChange}
          />
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.85}>
          <Text style={styles.applyBtnText}>
            {/* FIX: show live result count on apply button */}
            {`Show ${resultCount} result${resultCount !== 1 ? 's' : ''}`}
            {activeFilters.length > 0 ? ` · ${activeFilters.length} filter${activeFilters.length !== 1 ? 's' : ''}` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function SearchScreen({ navigation, route }) {
  const _ctx = useUser() || {};
  const user = _ctx.user || {};
  const recentSearches = _ctx.recentSearches || [];
  const addRecentSearch = _ctx.addRecentSearch || (() => {});
  const clearRecentSearches = _ctx.clearRecentSearches || (() => {});

  const [query, setQuery] = useState(route?.params?.initialQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [activeFilters, setActiveFilters] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  // Feature tour anchor — the spotlight points at the filter button
  const tourFilterRef = useTourTarget('search-filter');
  const inputRef = useRef(null);

  // Live internship data from Supabase
  const [internships, setInternships] = useState(ALL_INTERNSHIPS);

  useEffect(() => {
    const unsub = subscribeToInternships((data) => {
      setInternships([...data]);
    });
    return unsub;
  }, []);

  // Focus the input when Home's search bar sends us here (focusToken changes each tap)
  useEffect(() => {
    if (route?.params?.focusToken) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [route?.params?.focusToken]);

  const hasQuery = query.trim().length > 0;
  const hasFilters = activeFilters.length > 0;
  const isSearching = hasQuery || hasFilters;

  const toggleFilter = (f) =>
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);

  // Deadline: store as YYYY-M-D so year is included in filter comparison
  const handleDeadlineChange = (year, month, day) => {
    setActiveFilters((prev) => {
      const without = prev.filter((f) => !f.startsWith(DEADLINE_FILTER_KEY + ':'));
      if (year && month && day) return [...without, `${DEADLINE_FILTER_KEY}:${year}-${month}-${day}`];
      return without;
    });
  };

  const clearAll = () => { setQuery(''); setActiveFilters([]); };

  const handleSubmitSearch = () => { if (hasQuery) addRecentSearch(query.trim()); };

  const applyRecentSearch = (term) => { setQuery(term); addRecentSearch(term); };

  // Pre-process per-item data that's expensive to recompute per filter evaluation.
  // Only reruns when the internship list changes, not when filters/query change.
  const itemPrecomputed = useMemo(() => {
    const map = {};
    for (const item of internships) {
      const { isPaid, isStipend } = detectPayType(item);
      map[item.id] = { hasPaidTag: isPaid, hasStipendTag: isStipend };
    }
    return map;
  }, [internships]);

  // Pre-compile state regex once per user.state/location change (not per item).
  const stateRegex = useMemo(() => {
    const abbrev = getUserStateAbbrev(user);
    return buildStateRegex(abbrev);
  }, [user.state, user.location]);

  // Pre-compute the set of nearby states (user's state + bordering states) for the Near Me filter.
  const nearbyStates = useMemo(() => {
    const abbrev = getUserStateAbbrev(user);
    return getNearbyStates(abbrev);
  }, [user.state, user.location]);

  // Pre-cache match scores so sort comparator is O(1) lookups, not O(n log n) calls.
  const matchScoreCache = useMemo(() => {
    const cache = {};
    for (const item of internships) {
      cache[item.id] = computeMatchScore(item, user);
    }
    return cache;
  }, [internships, user.grade, user.interests, user.state, user.location, user.remoteOnly, user.gpaRange, user.readiness]);

  // Categories with counts that match what results actually show.
  // Grade-ineligible items are no longer hidden from results (they're just
  // ranked last instead, with no visible badge — the grade-fit heuristic is
  // too unreliable to tell a student they don't qualify), so counts include
  // them too — counts and results agree.
  const categories = useMemo(() => {
    const FIELD_LABELS = [
      'Medicine', 'Engineering', 'Science', 'Computer Science',
      'Arts', 'Business', 'Law/Advocacy', 'Environment',
      'Journalism', 'History', 'Astronomy', 'Social Science',
    ];
    const counts = {};
    for (const item of internships) {
      for (const label of FIELD_LABELS) {
        if (itemFieldMatches(item, label)) {
          counts[label] = (counts[label] || 0) + 1;
        }
      }
    }
    return FIELD_LABELS
      .filter((label) => counts[label] > 0)
      .map((label) => ({ label, count: counts[label] }));
  }, [internships]);

  const results = useMemo(() => {
    if (!isSearching) return [];

    // Normalize punctuation so "sci-mi", "sci mi", "sci.mi" all match each other.
    // We strip hyphens, periods, slashes and collapse extra spaces, then check
    // both the raw query and the normalized query against both raw and normalized text.
    const normalize = (str) =>
      str.toLowerCase().replace(/[-–—./\\,;:'"()\[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();

    // Split the query into individual words and require each one to appear
    // *somewhere* in the item's combined searchable text (order- and
    // field-independent AND match), rather than requiring the whole phrase
    // to appear verbatim in a single field. A phrase query like "VCU medicine"
    // previously failed to match "VCU School of Medicine..." because "VCU"
    // and "medicine" aren't adjacent in the source text — word-AND matching
    // fixes that while still finding exact-phrase matches (a single word is
    // just the degenerate case).
    const qWords = normalize(query.toLowerCase().trim()).split(' ').filter(Boolean);

    const filtered = internships.filter((item) => {
      if (!hasQuery) {
        return itemMatchesActiveFilters(item, activeFilters, stateRegex, { ...(itemPrecomputed[item.id] || {}), nearbyStates });
      }

      const haystack = normalize(
        [
          item.role,
          item.company,
          item.field,
          item.location,
          item.overview,
          item.requirements,
          item.howToApply,
          item.duration,
          item.grades,
          item.deadline,
          ...(item.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
      );

      const matchesQuery = qWords.every((word) => haystack.includes(word));

      // Keep grade-ineligible and closed items in results (unbadged, ranked
      // last) so Search and Home show the same catalog. Only the query/filters exclude.
      return matchesQuery && itemMatchesActiveFilters(item, activeFilters, stateRegex, { ...(itemPrecomputed[item.id] || {}), nearbyStates });
    });

    const sorted = [...filtered];

    // Rank tier: 0 = open + eligible, 1 = not yet eligible for user's grade, 2 = closed.
    const userGrade = (user || {}).grade;
    const rankTier = (it) => {
      if (isItemExpired(it)) return 2;
      if (userGrade && !gradeIsEligible(userGrade, it.gradesShort || null)) return 1;
      return 0;
    };

    // Determine if a single field filter is active — used to boost exact-field matches
    const regularFilters = activeFilters.filter((f) => !f.startsWith(DEADLINE_FILTER_KEY + ':'));
    const activeFieldFilters = regularFilters.filter((f) => FIELD_OPTIONS.has(f));
    const singleFieldFilter = activeFieldFilters.length === 1 ? activeFieldFilters[0] : null;

    if (sortBy === 'Deadline') {
      sorted.sort((a, b) => {
        const tierDiff = rankTier(a) - rankTier(b);
        if (tierDiff !== 0) return tierDiff;
        // When a field filter is active: exact field match comes before tag-only match
        if (singleFieldFilter) {
          const aExact = a.field === singleFieldFilter ? 0 : 1;
          const bExact = b.field === singleFieldFilter ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
        }
        return getDaysLeft(a) - getDaysLeft(b);
      });
    } else if (sortBy === 'Newest') {
      sorted.sort((a, b) => {
        const tierDiff = rankTier(a) - rankTier(b);
        if (tierDiff !== 0) return tierDiff;
        if (singleFieldFilter) {
          const aExact = a.field === singleFieldFilter ? 0 : 1;
          const bExact = b.field === singleFieldFilter ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
        }
        return (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0);
      });
    } else {
      // Most Relevant: eligibility tier, then exact field match, then match score, then featured, then deadline
      sorted.sort((a, b) => {
        const tierDiff = rankTier(a) - rankTier(b);
        if (tierDiff !== 0) return tierDiff;
        // Tier 1: exact field match (item.field === active filter) beats tag-only match
        if (singleFieldFilter) {
          const aExact = a.field === singleFieldFilter ? 0 : 1;
          const bExact = b.field === singleFieldFilter ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
        }
        // Tier 2: match score (personalization)
        const aScore = matchScoreCache[a.id];
        const bScore = matchScoreCache[b.id];
        if (aScore !== null && bScore !== null) {
          if (bScore !== aScore) return bScore - aScore;
          if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
          return getDaysLeft(a) - getDaysLeft(b);
        }
        if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
        return getDaysLeft(a) - getDaysLeft(b);
      });
    }
    return sorted;
  }, [isSearching, hasQuery, query, activeFilters, user.grade, sortBy, internships, stateRegex, nearbyStates, itemPrecomputed, matchScoreCache]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderResult = useCallback(({ item, index }) => {
    const closed = isItemExpired(item);
    return (
      <View>
        <ResultRow
          item={item}
          closed={closed}
          onPress={() => {
            if (hasQuery) addRecentSearch(query.trim());
            navigation?.navigate('Detail', { item });
          }}
        />
        {index < results.length - 1 && <View style={styles.rowDivider} />}
      </View>
    );
  }, [hasQuery, query, addRecentSearch, navigation, results.length, user.grade]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {!user.premium && (
        <View style={{ paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing[3] }}>
          <PremiumUpsellBanner
            icon="sparkles"
            title="Unlock Interny Premium"
            sub="Unlimited AI chat, essay review, interview prep, and more."
            onPress={() => navigation?.navigate('Paywall')}
          />
        </View>
      )}

      {/* ── Search bar + filter button ── */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} style={{ marginRight: 6 }} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Roles, companies, fields, tags..."
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search internships by role, company, field, or tag"
          />
          {(hasQuery || hasFilters) && (
            <TouchableOpacity
              onPress={clearAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search and filters"
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          ref={tourFilterRef}
          collapsable={false}
          style={[styles.filterBtn, hasFilters && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={hasFilters ? `Filters, ${activeFilters.length} active` : 'Filters'}
        >
          <View style={styles.sliderIcon}>
            <View style={styles.sliderRow}>
              <View style={[styles.sliderLine, hasFilters && styles.sliderLineActive]} />
              <View style={[styles.sliderDot, { left: '60%' }, hasFilters && styles.sliderDotActive]} />
            </View>
            <View style={styles.sliderRow}>
              <View style={[styles.sliderLine, hasFilters && styles.sliderLineActive]} />
              <View style={[styles.sliderDot, { left: '30%' }, hasFilters && styles.sliderDotActive]} />
            </View>
            <View style={styles.sliderRow}>
              <View style={[styles.sliderLine, hasFilters && styles.sliderLineActive]} />
              <View style={[styles.sliderDot, { left: '70%' }, hasFilters && styles.sliderDotActive]} />
            </View>
          </View>
          {hasFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Active filter chips ── */}
      {hasFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsRow}
        >
          {activeFilters.map((f) => {
            const isDeadline = f.startsWith(DEADLINE_FILTER_KEY + ':');
            let chipLabel = f;
            if (isDeadline) {
              const [yr, m, d] = f.slice(DEADLINE_FILTER_KEY.length + 1).split('-').map(Number);
              chipLabel = m && d ? `By ${MONTHS[m - 1]} ${d}, ${yr}` : 'Deadline';
            }
            const onRemove = isDeadline ? () => handleDeadlineChange(null, null, null) : () => toggleFilter(f);
            return (
              <TouchableOpacity key={f} style={styles.chip} onPress={onRemove} activeOpacity={0.7}>
                <Text style={styles.chipText}>{chipLabel}</Text>
                <Text style={styles.chipX}> ✕</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Main scroll ── */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!isSearching ? (
          <>
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Recent searches</Text>
                  <TouchableOpacity onPress={clearRecentSearches} activeOpacity={0.7}>
                    <Text style={styles.sectionAction}>Clear all</Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((s) => (
                  <TouchableOpacity key={s} style={styles.recentRow} onPress={() => applyRecentSearch(s)} activeOpacity={0.7}>
                    <Text style={styles.recentIcon}>↻</Text>
                    <Text style={styles.recentText}>{s}</Text>
                    <Text style={styles.recentArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse by field</Text>
              <View style={styles.categoryGrid}>
                {(categories || []).map((cat) => (
                  <CategoryCard
                    key={cat.label}
                    label={cat.label}
                    count={cat.count}
                    active={activeFilters.includes(cat.label)}
                    // FIX: category tap now ADDS the field filter rather than replacing all filters,
                    // and if that field is already active it removes it (toggle behavior)
                    onPress={() => {
                      setActiveFilters((prev) => {
                        const isActive = prev.includes(cat.label);
                        if (isActive) return prev.filter((f) => f !== cat.label);
                        // Remove any other field filters (only one field at a time from category grid)
                        // but preserve non-field filters (format, pay, deadline etc.)
                        const withoutFields = prev.filter((f) => !FIELD_OPTIONS.has(f));
                        return [...withoutFields, cat.label];
                      });
                    }}
                  />
                ))}
              </View>
            </View>
            {recentSearches.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Try searching</Text>
                <View style={styles.suggestionRow}>
                  {/* Generated from live data so a suggestion never returns 0 results */}
                  {['Remote', 'Stipend', ...[...categories].sort((a, b) => b.count - a.count).slice(0, 3).map((c) => c.label)].map((s) => (
                    <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => setQuery(s)} activeOpacity={0.7}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.section}>
            {/* Sort row + count */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {`${results.length} result${results.length !== 1 ? 's' : ''}`}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.sortRow}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.sortChip, sortBy === opt && styles.sortChipActive]}
                      onPress={() => setSortBy(opt)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.sortChipText, sortBy === opt && styles.sortChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {results.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No results{hasQuery ? ` for "${query}"` : ''}</Text>
                <Text style={styles.emptySubtitle}>Try a different search or adjust filters</Text>
                <View style={styles.emptyChips}>
                  {['Medicine', 'Remote', 'Business'].map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={styles.emptySuggestion}
                      onPress={() => { setActiveFilters([s]); setQuery(''); }}
                    >
                      <Text style={styles.emptySuggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.resultsList}>
                <FlatList
                  data={results}
                  keyExtractor={keyExtractor}
                  renderItem={renderResult}
                  scrollEnabled={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={8}
                />
              </View>
            )}
          </View>
        )}
        <View style={{ height: Spacing[10] }} />
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        activeFilters={activeFilters}
        onToggle={toggleFilter}
        onClear={() => setActiveFilters([])}
        onApply={() => setFilterModalVisible(false)}
        resultCount={results.length}
        onDeadlineChange={handleDeadlineChange}
        userHasState={!!(user.state || user.location)}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  headerTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing[3],
    gap: Spacing[2],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    height: 48,
    ...Shadows.card,
  },
  searchBarFocused: { borderColor: Colors.accent },
  searchIcon: { fontSize: Typography.size.md, color: Colors.textTertiary, marginRight: 4 },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearText: { fontSize: Typography.size.sm, color: Colors.textTertiary, paddingLeft: 4 },

  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  filterBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  sliderIcon: { gap: 4, width: 22 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', height: 3, position: 'relative' },
  sliderLine: { flex: 1, height: 1.5, backgroundColor: Colors.border, borderRadius: 1 },
  sliderLineActive: { backgroundColor: Colors.accent },
  sliderDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textTertiary,
    top: -1.5,
  },
  sliderDotActive: { backgroundColor: Colors.accent },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 9, fontWeight: Typography.weight.bold, color: Colors.white },

  chipsRow: { maxHeight: 36, marginBottom: 6 },
  chipsContent: {
    paddingHorizontal: Spacing.screenPadding,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
  },
  chipText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.accent },
  chipX: { fontSize: 10, color: Colors.accent, fontWeight: Typography.weight.bold },

  divider: { height: 1, backgroundColor: Colors.divider },

  scroll: { flex: 1 },
  section: { paddingHorizontal: Spacing.screenPadding, paddingTop: 16 },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  sectionAction: { fontSize: Typography.size.sm, color: Colors.accent, fontWeight: Typography.weight.medium },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  recentIcon: { fontSize: Typography.size.md, color: Colors.textTertiary, width: 28 },
  recentText: { flex: 1, fontSize: Typography.size.md, color: Colors.textSecondary },
  recentArrow: { fontSize: 20, color: Colors.textTertiary },

  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[3] },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginTop: Spacing[3] },
  categoryCard: {
    flex: 1,
    minWidth: 140,
    maxWidth: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  categoryCardActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  categoryCount: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.accent,
    marginBottom: 2,
  },
  categoryCountActive: { color: Colors.accent },
  categoryLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  categoryLabelActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },

  resultsHeader: { marginBottom: 12, gap: 8 },
  resultsCount: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  sortRow: { flexDirection: 'row', gap: Spacing[2] },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  sortChipText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },

  resultsList: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
  resultText: { flex: 1 },
  resultRole: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  resultCompany: { fontSize: Typography.size.base, color: Colors.textSecondary, marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  resultLocation: { fontSize: Typography.size.sm, color: Colors.textTertiary, flexShrink: 1 },
  resultDot: { width: 3, height: 3, borderRadius: Radii.full, backgroundColor: Colors.textTertiary },
  rowDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 44 + Spacing[3] + Spacing[4] },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: { fontSize: Typography.size.base, color: Colors.textTertiary, textAlign: 'center', marginBottom: 20 },
  emptyChips: { flexDirection: 'row', gap: Spacing[2] },
  emptySuggestion: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  emptySuggestionText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.accent },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  modalTitle: { fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  modalClear: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.accent },
  filterGroup: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: Typography.weight.bold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  nearMeWarning: { fontSize: Typography.size.xs, color: Colors.warning, marginLeft: 34, marginTop: -6, marginBottom: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: Spacing[3] },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkboxTick: { color: Colors.white, fontSize: 13, fontWeight: Typography.weight.bold, lineHeight: 16 },
  checkboxLabel: { fontSize: Typography.size.md, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  checkboxLabelChecked: { color: Colors.textPrimary, fontWeight: Typography.weight.semibold },
  modalFooter: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  applyBtn: { backgroundColor: Colors.accent, borderRadius: Radii.xl, paddingVertical: 15, alignItems: 'center' },
  applyBtnText: { color: Colors.white, fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
});
