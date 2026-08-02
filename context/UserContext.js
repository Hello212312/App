// context/UserContext.js
// All user state: profile, saved, applied, status, notes, top picks, recent searches,
// tracker pipeline, materials vault, and recommender manager.
// Feature 2: schedules push notification reminders whenever savedIds changes.
//            UserContext is the SINGLE source of truth for scheduling — App.js does NOT schedule.
// Feature 4: adds `state` (US state abbreviation) field + setState helper.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { shouldShowReviewPrompt } from '../utils/review';
import { INTERNSHIPS, subscribeToInternships } from '../data';
import { getEffectiveDaysLeft } from '../utils/matching';
import {
  cancelAllReminders,
  scheduleAllReminders,
} from '../utils/notifications';
import { getDeviceId } from '../utils/premium';
import { fetchCustomerInfo, hasPremiumEntitlement, initPurchases } from '../utils/revenuecat';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const STATUSES = ['saved', 'applied', 'interviewing', 'accepted', 'rejected'];

export const STATUS_META = {
  saved:        { label: 'Saved',        short: 'Saved',      color: '#94A3B8' },
  applied:      { label: 'Applied',      short: 'Applied',    color: '#3B82F6' },
  interviewing: { label: 'Interviewing', short: 'Interview',  color: '#F59E0B' },
  accepted:     { label: 'Accepted',     short: 'Accepted',   color: '#10B981' },
  rejected:     { label: 'Rejected',     short: 'Rejected',   color: '#EF4444' },
};

// TrackerScreen pipeline constants
export const APPLICATION_STATUSES = [
  'Saved', 'Applying', 'Submitted', 'Interviewing', 'Accepted', 'Rejected', 'Waitlisted',
];
export const ACTIVE_STATUSES  = new Set(['Saved', 'Applying', 'Submitted', 'Interviewing']);
export const DECIDED_STATUSES = new Set(['Accepted', 'Rejected', 'Waitlisted']);

const STORAGE_KEY = '@interny_user_v2';

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────

const DEFAULT_USER = {
  name: '',
  grade: '',
  interests: [],
  location: '',
  remoteOnly: false,
  notificationsOn: true,
  notifyDeadlines: true,   // reminders for saved internships approaching their deadline
  notifyHighMatch: true,   // alerts when an unsaved strong-match (>=50%) internship is closing soon
  notifyNewMatches: true,  // alerts when a new internship in the user's field is a strong match
  state: null, // US state abbreviation e.g. "VA", null = not set
  city: '',    // home city e.g. "Richmond" — combined with state into location "City, ST"
  school: null, // { id, name, city, state, district } from the NCES directory, or null
  onboardingDone: false,
  featureTourSeen: false,  // first-launch feature spotlight tour shown once after onboarding
  gpaRange: '',
  readiness: [],
  gender: '',   // 'female' | 'male' | 'nonbinary' | 'prefer_not_to_say' | '' = not set
  race: [],     // array of race/ethnicity codes, or ['prefer_not_to_say']
  appOpenCount: 0,
  reviewRequested: false,
  firstLaunchAt: null, // ms timestamp of first-ever app open, set once on first load
  // Premium
  premium: false,          // true once a real RevenueCat purchase (or restore) is confirmed
  premiumSince: null,      // ISO timestamp when activated
  premiumEmail: '',        // email captured at purchase (receipts + essay review replies)
  reminderDays: null,      // premium custom reminder days e.g. [30, 14, 7, 1]; null = default
  premiumTourSeen: false,  // premium spotlight tour shown once right after upgrading
};

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

const UserContext = createContext(null);

// ─── ID GENERATOR ─────────────────────────────────────────────────────────────

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }) {
  const [user,          setUserRaw]       = useState(DEFAULT_USER);
  const [savedIds,      setSavedIds]      = useState([]);
  const [appliedIds,    setAppliedIds]    = useState([]);
  const [viewedIds,     setViewedIds]     = useState([]);
  const [topPickIds,    setTopPickIds]    = useState([]);
  const [statusMap,     setStatusMap]     = useState({});  // { [internshipId]: STATUSES string }
  const [notesMap,      setNotesMap]      = useState({});  // { [internshipId]: string }
  const [recentSearches, setRecentSearches] = useState([]);

  // Tracker: pipeline uses APPLICATION_STATUSES (capitalised), separate from statusMap
  const [applicationMap, setApplicationMap] = useState({});
  // { [internshipId]: { id, status: APPLICATION_STATUSES[n], meta: internshipObj, checklist: [] } }

  // Materials vault
  const [materials,    setMaterials]    = useState([]);
  const [recommenders, setRecommenders] = useState([]);

  // Premium: essay review submissions (local log; essays are also sent to Supabase)
  const [essaySubmissions, setEssaySubmissions] = useState([]);

  const [loaded, setLoaded] = useState(false);
  const [reviewPromptVisible, setReviewPromptVisible] = useState(false);
  // Bumped when the internships list (module-level INTERNSHIPS) loads/refreshes,
  // so memoized values derived from it recompute.
  const [internshipsVersion, setInternshipsVersion] = useState(0);
  const prevSavedCountRef = useRef(null);
  // Internship IDs already seen, for detecting newly-added ones to alert on.
  // null = not yet initialized (first load shouldn't alert on the whole catalog).
  const [seenInternshipIds, setSeenInternshipIds] = useState(null);

  // ─── Load from AsyncStorage on mount ────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.user)            setUserRaw({ ...DEFAULT_USER, ...s.user });
          if (s.savedIds)        setSavedIds(s.savedIds);
          if (s.appliedIds)      setAppliedIds(s.appliedIds);
          if (s.viewedIds)       setViewedIds(s.viewedIds);
          if (s.topPickIds)      setTopPickIds(s.topPickIds);
          if (s.statusMap)       setStatusMap(s.statusMap);
          if (s.notesMap)        setNotesMap(s.notesMap);
          if (s.recentSearches)  setRecentSearches(s.recentSearches);
          if (s.applicationMap)  setApplicationMap(s.applicationMap);
          if (s.materials)       setMaterials(s.materials);
          if (s.recommenders)    setRecommenders(s.recommenders);
          if (s.essaySubmissions) setEssaySubmissions(s.essaySubmissions);
          if (s.seenInternshipIds) setSeenInternshipIds(s.seenInternshipIds);
        }
      } catch (e) {
        console.warn('[UserContext] load error:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ─── Persist to AsyncStorage whenever anything changes ──────────────────────

  useEffect(() => {
    if (!loaded) return;
    const data = {
      user, savedIds, appliedIds, viewedIds, topPickIds,
      statusMap, notesMap, recentSearches,
      applicationMap, materials, recommenders, essaySubmissions, seenInternshipIds,
    };
    const timer = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) =>
        console.warn('[UserContext] save error:', e)
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [loaded, user, savedIds, appliedIds, viewedIds, topPickIds,
      statusMap, notesMap, recentSearches, applicationMap, materials, recommenders, essaySubmissions,
      seenInternshipIds]);

  // ─── User profile setters ───────────────────────────────────────────────────

  const setUser = (updater) => {
    setUserRaw((prev) =>
      typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
    );
  };

  // ─── Review triggers ────────────────────────────────────────────────────────
  // The native StoreKit / Play In-App Review prompt is silently throttled by
  // both platforms and never guaranteed to actually appear, so a custom
  // in-app modal (rendered from `reviewPromptVisible`, in App.js) is the
  // primary mechanism — it always shows something and links out to the
  // store. See utils/review.js for the engagement thresholds.

  const presentReviewPrompt = () => {
    if (user.reviewRequested) return;
    setReviewPromptVisible(true);
  };

  const dismissReviewPrompt = () => {
    setReviewPromptVisible(false);
    setUser({ reviewRequested: true });
  };

  // Trigger: first-ever load, set the install timestamp used for the
  // time-based threshold in shouldShowReviewPrompt.
  useEffect(() => {
    if (!loaded) return;
    if (!user.firstLaunchAt) {
      setUser({ firstLaunchAt: Date.now() });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Trigger: engagement threshold (enough opens + enough days since install)
  useEffect(() => {
    if (!loaded) return;
    if (!shouldShowReviewPrompt(user)) return;
    const timer = setTimeout(presentReviewPrompt, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, user.appOpenCount, user.firstLaunchAt]);

  // Trigger: 3rd saved internship (transition from 2 → 3, not on initial load)
  useEffect(() => {
    if (!loaded) return;
    if (prevSavedCountRef.current === null) {
      prevSavedCountRef.current = savedIds.length;
      return;
    }
    if (savedIds.length === 3 && prevSavedCountRef.current < 3) {
      presentReviewPrompt();
    }
    prevSavedCountRef.current = savedIds.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIds.length, loaded]);

  // ─── Feature 2: Schedule / cancel reminders — SINGLE SOURCE OF TRUTH ────────
  //
  // This is the ONLY place in the app that calls scheduleSavedDeadlineReminders
  // or cancelAllReminders. App.js does NOT do this.
  //
  // Runs when: storage loads, savedIds changes, notificationsOn toggles.
  // When notificationsOn is false → cancel everything.
  // When notificationsOn is true  → (re)schedule for current savedIds.

  // Diffs INTERNSHIPS against seenInternshipIds to find newly-added ones for
  // the "new match" alert, then records the full current ID set as seen.
  // On the very first run (seenInternshipIds === null) nothing is "new" —
  // otherwise every internship in the catalog would alert on first launch.
  const captureNewIds = () => {
    const currentIds = INTERNSHIPS.map((i) => i.id);
    if (seenInternshipIds === null) {
      setSeenInternshipIds(currentIds);
      return [];
    }
    const seenSet = new Set(seenInternshipIds);
    const newIds = currentIds.filter((id) => !seenSet.has(id));
    if (newIds.length > 0) setSeenInternshipIds(currentIds);
    return newIds;
  };

  useEffect(() => {
    if (!loaded) return;
    if (user.notificationsOn === false) {
      cancelAllReminders();
    } else if (INTERNSHIPS.length > 0) {
      const newIds = captureNewIds();
      scheduleAllReminders(savedIds, INTERNSHIPS, user, newIds);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, savedIds, user]);

  // Re-schedule when INTERNSHIPS data loads (INTERNSHIPS may be [] on first render)
  useEffect(() => {
    const unsub = subscribeToInternships(() => {
      setInternshipsVersion((v) => v + 1);
      if (!loaded) return;
      if (user.notificationsOn !== false) {
        const newIds = captureNewIds();
        scheduleAllReminders(savedIds, INTERNSHIPS, user, newIds);
      }
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, savedIds, user]);

  // Feature 4: sets only the US state abbreviation field
  const setState = (stateAbbr) => {
    setUserRaw((prev) => ({ ...prev, state: stateAbbr }));
  };

  // ─── Saved ──────────────────────────────────────────────────────────────────

  const toggleSaved = (id) => {
    // NOTE: keep the setApplicationMap call OUTSIDE the setSavedIds updater —
    // updaters must be pure (StrictMode double-invokes them, which would fire
    // a nested setState twice).
    const isCurrentlySaved = savedIds.includes(id);
    if (isCurrentlySaved) {
      // Removing — also remove from applicationMap
      setApplicationMap((appPrev) => {
        if (!(id in appPrev)) return appPrev;
        const next = { ...appPrev };
        delete next[id];
        return next;
      });
      setSavedIds((prev) => prev.filter((i) => i !== id));
    } else {
      // Adding — create applicationMap entry with initial 'Saved' status
      setApplicationMap((appPrev) => {
        if (appPrev[id]) return appPrev;
        const meta = INTERNSHIPS.find((i) => i.id === id) || { id };
        return { ...appPrev, [id]: { id, status: 'Saved', meta, checklist: [] } };
      });
      setSavedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const isSaved = (id) => savedIds.includes(id);

  // ─── Applied ────────────────────────────────────────────────────────────────

  const markApplied = (id) => {
    setAppliedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const isApplied = (id) => appliedIds.includes(id);

  // ─── Application status (STATUSES — lowercase, for DetailScreen badge) ──────

  const setApplicationStatus = (id, status) => {
    if (!id || !status) return;
    setStatusMap((prev) => ({ ...prev, [id]: status }));
    // Case-insensitive: the Detail picker and Tracker pass capitalized statuses
    // ('Submitted', 'Interviewing', …). Any status that means the application
    // actually went out marks the item as applied.
    const lower = status.toLowerCase();
    if (lower === 'accepted') {
      presentReviewPrompt();
    }
    if (['applied', 'submitted', 'interviewing', 'accepted', 'rejected', 'waitlisted'].includes(lower)) {
      setAppliedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
    // Mirror into applicationMap with capitalised status for TrackerScreen
    const capitalised = status.charAt(0).toUpperCase() + status.slice(1);
    if (APPLICATION_STATUSES.includes(capitalised)) {
      setApplicationMap((prev) => {
        const meta = INTERNSHIPS.find((i) => i.id === id) || { id };
        const existing = prev[id] || { id, meta, checklist: [] };
        return { ...prev, [id]: { ...existing, status: capitalised } };
      });
    }
  };

  const getStatus = (id) => statusMap[id] || 'saved';

  // ─── Tracker pipeline (APPLICATION_STATUSES — capitalised) ──────────────────

  // applicationList: array of application objects
  const applicationList = useMemo(() => Object.values(applicationMap), [applicationMap]);

  const getApplication = (id) => applicationMap[id] || null;

  // upcomingDeadlines: saved items with an active deadline, sorted ascending.
  // Uses getEffectiveDaysLeft (live from deadlineDate) instead of stale meta.daysLeft.
  // internshipsVersion keeps this fresh when the INTERNSHIPS module data loads.
  const upcomingDeadlines = useMemo(() => {
    return savedIds
      .map((id) => {
        const meta = INTERNSHIPS.find((i) => i.id === id);
        if (!meta) return null;
        const daysLeft = getEffectiveDaysLeft(meta);
        if (daysLeft === null || daysLeft <= 0) return null;
        const app = applicationMap[id] || { id, status: 'Saved', meta, checklist: [] };
        return { ...app, daysLeft, meta };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedIds, applicationMap, internshipsVersion]);

  // ─── Viewed ─────────────────────────────────────────────────────────────────

  const markViewed = (id) => {
    setViewedIds((prev) => {
      if (prev[0] === id) return prev; // already most-recent — no state update
      const filtered = prev.filter((i) => i !== id);
      return [id, ...filtered]; // most recent first
    });
  };

  // ─── Top picks ──────────────────────────────────────────────────────────────

  const toggleTopPick = (id) => {
    setTopPickIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isTopPick = (id) => topPickIds.includes(id);

  // ─── Notes ──────────────────────────────────────────────────────────────────

  const setNoteForId = (id, note) => {
    if (!id) return;
    setNotesMap((prev) => ({ ...prev, [id]: note }));
  };

  const getNoteForId = (id) => notesMap[id] || '';

  // ─── Recent searches ────────────────────────────────────────────────────────

  const addRecentSearch = (term) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== term);
      return [term, ...filtered].slice(0, 10);
    });
  };

  const clearRecentSearches = () => setRecentSearches([]);

  // ─── Tracker checklist ──────────────────────────────────────────────────────

  // checkedMap: { [key]: boolean } — the set of checked keys for one internship
  const updateApplicationChecklist = (id, checkedMap) => {
    setApplicationMap((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return { ...prev, [id]: { ...existing, checklist: checkedMap } };
    });
  };

  const addMaterial = (data) => {
    setMaterials((prev) => [...prev, { id: makeId(), ...data }]);
  };

  const updateMaterial = (id, data) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  const removeMaterial = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // ─── Recommenders ───────────────────────────────────────────────────────────

  const addRecommender = (data) => {
    setRecommenders((prev) => [...prev, { id: makeId(), ...data }]);
  };

  const updateRecommender = (id, data) => {
    setRecommenders((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const removeRecommender = (id) => {
    setRecommenders((prev) => prev.filter((r) => r.id !== id));
  };

  // ─── Premium ────────────────────────────────────────────────────────────────

  // Activates premium locally. Called only after RevenueCat confirms a real
  // purchase or restore went through — see PaywallScreen.
  const activatePremium = ({ email }) => {
    setUserRaw((prev) => ({
      ...prev,
      premium: true,
      premiumSince: new Date().toISOString(),
      premiumEmail: email || prev.premiumEmail || '',
    }));
  };

  const deactivatePremium = () => {
    setUserRaw((prev) => ({
      ...prev,
      premium: false,
      premiumSince: null,
      reminderDays: null,
    }));
  };

  // Initializes RevenueCat once storage has loaded, using our existing
  // per-device UUID as the RevenueCat app user id, then checks whether this
  // store account already owns the entitlement (covers reinstalls / a fresh
  // device signed into the same App/Play account) and syncs local state.
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    (async () => {
      const deviceId = await getDeviceId();
      const ready = await initPurchases(deviceId);
      if (!ready || cancelled) return;
      const info = await fetchCustomerInfo();
      if (!info || cancelled) return;
      const active = hasPremiumEntitlement(info);
      if (active && !user.premium) {
        activatePremium({ email: user.premiumEmail });
      } else if (!active && user.premium) {
        deactivatePremium();
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const setReminderDays = (days) => {
    setUserRaw((prev) => ({ ...prev, reminderDays: days }));
  };

  // Logs an essay submission locally (the essay itself is sent to Supabase
  // by EssayReviewScreen). monthKey is used for the monthly cap.
  const addEssaySubmission = (sub) => {
    setEssaySubmissions((prev) => [{ id: makeId(), createdAt: Date.now(), ...sub }, ...prev]);
  };

  // ─── Reset all ──────────────────────────────────────────────────────────────

  const resetAll = () => {
    // Clear all React state
    setUserRaw(DEFAULT_USER);
    setSavedIds([]);
    setAppliedIds([]);
    setViewedIds([]);
    setTopPickIds([]);
    setStatusMap({});
    setNotesMap({});
    setRecentSearches([]);
    setApplicationMap({});
    setMaterials([]);
    setRecommenders([]);
    setEssaySubmissions([]);
    setSeenInternshipIds(null);
    // Write the clean default state to storage immediately — do NOT just
    // removeItem, because the debounced persist effect and removeItem can race
    // each other, leaving stale data in storage if removeItem wins last.
    const cleanState = {
      user: DEFAULT_USER,
      savedIds: [],
      appliedIds: [],
      viewedIds: [],
      topPickIds: [],
      statusMap: {},
      notesMap: {},
      recentSearches: [],
      applicationMap: {},
      materials: [],
      recommenders: [],
      essaySubmissions: [],
      seenInternshipIds: null,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState)).catch(() => {});
  };

  // ─── Context value ───────────────────────────────────────────────────────────

  const value = {
    // Profile
    user,
    setUser,
    setState,
    loaded,
    // Collections
    savedIds,
    appliedIds,
    viewedIds,
    topPickIds,
    statusMap,
    notesMap,
    recentSearches,
    // Actions — saved / applied
    toggleSaved,
    isSaved,
    markApplied,
    isApplied,
    // Application status (lowercase for DetailScreen)
    setApplicationStatus,
    getStatus,
    // Tracker pipeline (capitalised APPLICATION_STATUSES)
    applicationList,
    getApplication,
    upcomingDeadlines,
    updateApplicationChecklist,
    // Viewed / top picks / notes
    markViewed,
    toggleTopPick,
    isTopPick,
    setNoteForId,
    getNoteForId,
    // Recent searches
    addRecentSearch,
    clearRecentSearches,
    // Materials
    materials,
    addMaterial,
    updateMaterial,
    removeMaterial,
    // Recommenders
    recommenders,
    addRecommender,
    updateRecommender,
    removeRecommender,
    // Premium
    activatePremium,
    deactivatePremium,
    setReminderDays,
    essaySubmissions,
    addEssaySubmission,
    // Reset
    resetAll,
    // Review prompt
    reviewPromptVisible,
    dismissReviewPrompt,
    // Constants
    STATUSES,
    STATUS_META,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useUser() {
  return useContext(UserContext);
}
