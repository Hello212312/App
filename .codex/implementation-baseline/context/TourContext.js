// context/TourContext.js
// Spotlight tours: walk the user to each place a feature lives and point at
// the real UI element with a dimmed backdrop + spotlight hole
// (see components/PremiumTourOverlay.js). Two tours share this engine:
//   • Feature tour: first launch, right after onboarding (user.featureTourSeen)
//   • Premium tour: when user.premium flips false -> true (user.premiumTourSeen)
//
// How screens participate: call `useTourTarget('some-id')` and attach the
// returned ref (with collapsable={false}) to the view the tour should point
// at. The step definitions in utils/featureTourSteps.js and
// utils/premiumTourSteps.js reference those ids.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Keyboard, UIManager, findNodeHandle } from 'react-native';
import { INTERNSHIPS } from '../data';
import { buildFeatureTourSteps } from '../utils/featureTourSteps';
import { buildPremiumTourSteps } from '../utils/premiumTourSteps';
import { useUser } from './UserContext';

const { height: SCREEN_H } = Dimensions.get('window');

// Split contexts so target registration (used by many screens, including
// memoized list cards) never re-renders on tour state changes; only the
// overlay consumes the state context.
const TourStateContext = createContext(null);
const TourActionsContext = createContext(null);

const IDLE = { active: false, index: 0, phase: 'centered', rect: null, fellBack: false };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function TourProvider({ navRef, children }) {
  const { user, setUser, loaded, savedIds } = useUser();

  const targetsRef = useRef(new Map()); // id -> ref object from useTourTarget
  const stepsRef = useRef([]);
  const runIdRef = useRef(0);           // invalidates in-flight goToStep on skip
  const onDetailRef = useRef(false);    // true while a tour step has Detail pushed
  const prevPremiumRef = useRef(null);

  const [state, setState] = useState(IDLE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ─── Target registry ────────────────────────────────────────────────────

  const registerTarget = useCallback((id, ref) => {
    targetsRef.current.set(id, ref);
  }, []);
  const unregisterTarget = useCallback((id, ref) => {
    if (targetsRef.current.get(id) === ref) targetsRef.current.delete(id);
  }, []);

  // Waits for a target to be registered AND mounted (lazy tabs mount on first focus).
  const waitForNode = async (id, tries = 18) => {
    for (let t = 0; t < tries; t++) {
      const node = targetsRef.current.get(id)?.current;
      if (node) return node;
      await sleep(80);
    }
    return null;
  };

  // ─── Measurement ────────────────────────────────────────────────────────

  const measureOnce = (id) =>
    new Promise((resolve) => {
      const node = targetsRef.current.get(id)?.current;
      if (!node || typeof node.measureInWindow !== 'function') return resolve(null);
      try {
        node.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0 && Number.isFinite(x) && Number.isFinite(y)) {
            resolve({ x, y, width, height });
          } else {
            resolve(null);
          }
        });
      } catch {
        resolve(null);
      }
    });

  // Poll until the target measures (covers lazy mount). When `settle` is set
  // (we just navigated or scrolled), re-measure until the position stops
  // moving, to guard against mid-transition snapshots.
  const measureWithRetry = async (id, tries = 25, settle = true) => {
    for (let t = 0; t < tries; t++) {
      let rect = await measureOnce(id);
      if (rect) {
        if (!settle) return rect;
        for (let s = 0; s < 4; s++) {
          await sleep(70);
          const again = await measureOnce(id);
          if (!again) break;
          if (Math.abs(again.x - rect.x) < 2 && Math.abs(again.y - rect.y) < 2) return again;
          rect = again;
        }
        return rect;
      }
      await sleep(80);
    }
    return null;
  };

  // Scrolls a registered ScrollView so the target row sits in the upper third.
  // Resolves `true` if it actually scrolled (caller then re-settles measurement).
  const ensureVisible = (scrollId, targetId) =>
    new Promise((resolve) => {
      (async () => {
        const [scrollNode, targetNode] = await Promise.all([
          waitForNode(scrollId),
          waitForNode(targetId),
        ]);
        if (!scrollNode || !targetNode || typeof scrollNode.scrollTo !== 'function') return resolve(false);
        try {
          const innerNode = scrollNode.getInnerViewNode ? scrollNode.getInnerViewNode() : scrollNode;
          const targetHandle = findNodeHandle(targetNode);
          const innerHandle = findNodeHandle(innerNode);
          if (!targetHandle || !innerHandle) return resolve(false);
          // UIManager.measureLayout takes node handles, not refs. The ref-based
          // node.measureLayout() call throws "must be called with a ref to a
          // native component" on the New Architecture.
          UIManager.measureLayout(
            targetHandle,
            innerHandle,
            () => resolve(false),
            (x, y) => {
              scrollNode.scrollTo({ y: Math.max(0, y - SCREEN_H * 0.28), animated: true });
              setTimeout(() => resolve(true), 260);
            },
          );
        } catch {
          resolve(false);
        }
      })();
    });

  // ─── Step engine ────────────────────────────────────────────────────────

  const goToStep = async (i) => {
    const runId = ++runIdRef.current;
    const steps = stepsRef.current;
    if (i >= steps.length) return endTour();
    const step = steps[i];

    setState({ active: true, index: i, phase: 'transition', rect: null, fellBack: false });

    let navigated = false;
    try {
      if (step.navigate) {
        step.navigate(navRef?.current);
        onDetailRef.current = !!step.pushesDetail;
        navigated = true;
      }
    } catch {}

    if (navigated) {
      // Let the transition play, since stack pushes animate longer than tab switches.
      await sleep(step.pushesDetail ? 350 : 200);
      if (runId !== runIdRef.current) return;
    }

    if (!step.targetId) {
      setState({ active: true, index: i, phase: 'centered', rect: null, fellBack: false });
      return;
    }

    let scrolled = false;
    if (step.scrollId) {
      scrolled = await ensureVisible(step.scrollId, step.targetId);
      if (runId !== runIdRef.current) return;
    }

    // Only pay the settle re-measure loop when the layout might still be
    // moving (fresh navigation or an animated scroll just happened).
    const rect = await measureWithRetry(step.targetId, step.tries ?? 25, navigated || scrolled);
    if (runId !== runIdRef.current) return;

    if (rect) {
      setState({ active: true, index: i, phase: 'spotlight', rect, fellBack: false });
    } else {
      // Target never mounted/measured (e.g. no NEW badge in the feed right
      // now, or the card is virtualized away), so show the centered fallback.
      setState({ active: true, index: i, phase: 'centered', rect: null, fellBack: true });
    }
  };

  const endTour = () => {
    runIdRef.current += 1; // cancel any in-flight goToStep
    setState(IDLE);
    if (onDetailRef.current) {
      // A tour step pushed the Detail screen, so return to the tabs.
      try { navRef?.current?.navigate('Main'); } catch {}
      onDetailRef.current = false;
    }
  };

  const beginTour = (steps) => {
    Keyboard.dismiss();
    stepsRef.current = steps;
    onDetailRef.current = false;
    setState({ active: true, index: 0, phase: 'centered', rect: null, fellBack: false });
  };

  const startPremiumTour = () => {
    // One-shot: mark seen at start so a mid-tour kill never replays it.
    setUser((prev) => ({ ...prev, premiumTourSeen: true }));
    beginTour(buildPremiumTourSteps({ savedIds, internships: INTERNSHIPS }));
  };

  const startFeatureTour = () => {
    // One-shot: mark seen at start so a mid-tour kill never replays it.
    setUser((prev) => ({ ...prev, featureTourSeen: true }));
    beginTour(buildFeatureTourSteps({ internships: INTERNSHIPS, user }));
  };

  // Keep a stable ref so the watcher effect and stable actions always call
  // the latest closure (savedIds etc. would otherwise go stale).
  const startRef = useRef(startPremiumTour);
  startRef.current = startPremiumTour;
  const startFeatureRef = useRef(startFeatureTour);
  startFeatureRef.current = startFeatureTour;
  const goToStepRef = useRef(goToStep);
  goToStepRef.current = goToStep;
  const endTourRef = useRef(endTour);
  endTourRef.current = endTour;

  // ─── Auto-start: first launch after onboarding ──────────────────────────

  useEffect(() => {
    if (!loaded || !user.onboardingDone || user.featureTourSeen) return;
    // Delay so App.js's nav reset lands on Main and the tabs render first.
    const t = setTimeout(() => startFeatureRef.current(), 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, user.onboardingDone]);

  // ─── Auto-start: user.premium false -> true ─────────────────────────────

  useEffect(() => {
    if (!loaded) return;
    const cur = !!user.premium;
    if (prevPremiumRef.current === null) {
      // Seed on first load, so existing premium users never see it retroactively.
      prevPremiumRef.current = cur;
      return;
    }
    const prev = prevPremiumRef.current;
    prevPremiumRef.current = cur;
    if (!prev && cur && !user.premiumTourSeen && user.onboardingDone) {
      // Small delay so the Paywall pop animation finishes first.
      const t = setTimeout(() => startRef.current(), 700);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, user.premium]);

  // ─── Context values ──────────────────────────────────────────────────────

  // Stable forever: screens registering targets never re-render from the tour.
  const actions = useMemo(
    () => ({
      registerTarget,
      unregisterTarget,
      next: () => goToStepRef.current(stateRef.current.index + 1),
      skip: () => endTourRef.current(),
      startPremiumTour: () => startRef.current(),
      startFeatureTour: () => startFeatureRef.current(),
    }),
    [registerTarget, unregisterTarget],
  );

  const stateValue = useMemo(() => {
    const steps = stepsRef.current;
    return {
      ...state,
      step: state.active ? steps[state.index] : null,
      // Feature steps sit between intro (0) and outro (last); used for the dots.
      featureCount: Math.max(0, steps.length - 2),
      featureIndex: state.index - 1,
    };
  }, [state]);

  return (
    <TourActionsContext.Provider value={actions}>
      <TourStateContext.Provider value={stateValue}>{children}</TourStateContext.Provider>
    </TourActionsContext.Provider>
  );
}

export function useTour() {
  const s = useContext(TourStateContext);
  const a = useContext(TourActionsContext);
  if (!s || !a) return null;
  return { ...s, ...a };
}

/**
 * Registers a view as a tour anchor. Attach the returned ref to the view and
 * set collapsable={false} on it (Android optimizes plain Views away otherwise).
 * Pass a falsy id to no-op (e.g. only the first early-access card registers).
 */
export function useTourTarget(id) {
  const ctx = useContext(TourActionsContext);
  const ref = useRef(null);
  useEffect(() => {
    if (!id || !ctx) return;
    ctx.registerTarget(id, ref);
    return () => ctx.unregisterTarget(id, ref);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return ref;
}
