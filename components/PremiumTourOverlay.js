// components/PremiumTourOverlay.js
// Renders the spotlight tours (first-launch feature tour + premium unlock
// tour): dimmed backdrop with a spotlight hole cut around
// the current target (4 dim rects + accent ring, no SVG dependency), an
// arrow-tipped caption card, and centered cards for intro/outro/fallbacks.
// Driven entirely by context/TourContext.js; rendered inside the
// NavigationContainer in App.js so measureInWindow coords line up 1:1.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTour } from '../context/TourContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const DIM = 'rgba(15, 23, 42, 0.72)';
const CARD_MARGIN = 20;
const CARD_W = SCREEN_W - CARD_MARGIN * 2;
const ARROW = 10;

// ─── SMALL PIECES ──────────────────────────────────────────────────────────

function Dots({ count, active }) {
  if (count <= 0) return null;
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]} />
      ))}
    </View>
  );
}

// Score-breakdown rows (e.g. the match-score step): [{ label, points, max }]
function StatsBlock({ stats }) {
  if (!stats || stats.length === 0) return null;
  return (
    <View style={styles.stats}>
      {stats.map((s) => (
        <View key={s.label} style={styles.statRow}>
          <Text style={styles.statLabel}>{s.label}</Text>
          <Text style={styles.statPoints}>
            +{s.points}
            <Text style={styles.statMax}>/{s.max}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

function TourButtons({ primaryLabel, onPrimary, onSkip, skipLabel = 'Skip tour' }) {
  return (
    <View style={styles.buttons}>
      <TouchableOpacity style={styles.nextBtn} onPress={onPrimary} activeOpacity={0.85}>
        <Text style={styles.nextBtnText}>{primaryLabel}</Text>
      </TouchableOpacity>
      {onSkip && (
        <TouchableOpacity
          onPress={onSkip}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={{ alignSelf: 'center' }}
        >
          <Text style={styles.skipText}>{skipLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── OVERLAY ─────────────────────────────────────────────────────────────────

export default function PremiumTourOverlay() {
  const tour = useTour();
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;

  const active = !!tour?.active;

  // Android hardware back = skip (never leaks through to the navigator mid-tour)
  useEffect(() => {
    if (!active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      tour.skip();
      return true;
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Gentle pulse on the spotlight ring
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  if (!tour || !active || !tour.step) return null;

  const { step, phase, rect, fellBack, featureCount, featureIndex, next, skip } = tour;
  const isIntro = step.kind === 'intro';
  const isOutro = step.kind === 'outro';
  const isFeature = !isIntro && !isOutro;

  // ─── Transition between steps: full dim + spinner ─────────────────────────

  if (phase === 'transition') {
    return (
      <View style={styles.root} pointerEvents="auto">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]} />
        <View style={styles.centerWrap}>
          <ActivityIndicator size="small" color={Colors.white} />
        </View>
      </View>
    );
  }

  // ─── Centered cards: intro / outro / feature fallback ───────────────────────

  if (phase === 'centered' || !rect) {
    const copy = fellBack && step.fallback ? step.fallback : step;
    return (
      <View style={styles.root} pointerEvents="auto">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]} />
        <View style={styles.centerWrap}>
          <View style={styles.card}>
            {isIntro && (
              <View style={styles.heroIcon}>
                <Ionicons name="rocket" size={26} color={Colors.accent} />
              </View>
            )}
            {isOutro && (
              <View style={styles.heroIcon}>
                <Ionicons name="checkmark-circle" size={26} color={Colors.success} />
              </View>
            )}
            <Text style={[styles.title, (isIntro || isOutro) && styles.titleCentered]}>
              {copy.title}
            </Text>
            <Text style={[styles.body, (isIntro || isOutro) && styles.bodyCentered]}>
              {copy.body}
            </Text>
            {!fellBack && <StatsBlock stats={step.stats} />}
            {isFeature && <Dots count={featureCount} active={featureIndex} />}
            <TourButtons
              primaryLabel={isIntro ? 'Start tour' : isOutro ? 'Done' : 'Next →'}
              onPrimary={isOutro ? skip : next}
              onSkip={isOutro ? null : skip}
            />
          </View>
        </View>
      </View>
    );
  }

  // ─── Spotlight ──────────────────────────────────────────────────────────────

  const pad = step.holePadding ?? 8;
  const hole = {
    x: Math.max(0, rect.x - pad),
    y: Math.max(0, rect.y - pad),
    w: Math.min(SCREEN_W, rect.width + pad * 2),
    h: Math.min(SCREEN_H * 0.45, rect.height + pad * 2),
  };
  hole.w = Math.min(hole.w, SCREEN_W - hole.x);

  const holeCenterY = hole.y + hole.h / 2;
  const holeCenterX = hole.x + hole.w / 2;
  const cardBelow = holeCenterY < SCREEN_H / 2;

  const cardPos = cardBelow
    ? { top: Math.min(hole.y + hole.h + 18, SCREEN_H - 260) }
    : { bottom: Math.max(SCREEN_H - hole.y + 18, insets.bottom + Spacing[4]) };

  const arrowLeft = Math.min(
    Math.max(holeCenterX - CARD_MARGIN - ARROW, Spacing[5]),
    CARD_W - Spacing[5] - ARROW * 2,
  );

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });

  return (
    <View style={styles.root} pointerEvents="auto">
      {/* 4 dim rects around the hole */}
      <View style={[styles.dim, { top: 0, left: 0, right: 0, height: hole.y }]} />
      <View style={[styles.dim, { top: hole.y, left: 0, width: hole.x, height: hole.h }]} />
      <View style={[styles.dim, { top: hole.y, left: hole.x + hole.w, right: 0, height: hole.h }]} />
      <View style={[styles.dim, { top: hole.y + hole.h, left: 0, right: 0, bottom: 0 }]} />

      {/* Accent ring around the spotlight */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            left: hole.x - 2,
            top: hole.y - 2,
            width: hole.w + 4,
            height: hole.h + 4,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      {/* Caption card with arrow */}
      <View style={[styles.card, styles.cardFloating, cardPos]}>
        <View
          style={[
            styles.arrow,
            cardBelow
              ? { top: -ARROW, borderBottomColor: Colors.surface, borderBottomWidth: ARROW }
              : { bottom: -ARROW, borderTopColor: Colors.surface, borderTopWidth: ARROW },
            { left: arrowLeft },
          ]}
        />
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.body}>{step.body}</Text>
        <StatsBlock stats={step.stats} />
        <Dots count={featureCount} active={featureIndex} />
        <TourButtons primaryLabel="Next →" onPrimary={next} onSkip={skip} />
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  dim: {
    position: 'absolute',
    backgroundColor: DIM,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: Radii.lg,
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CARD_MARGIN,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing[5],
    width: CARD_W,
    ...Shadows.elevated,
  },
  cardFloating: {
    position: 'absolute',
    left: CARD_MARGIN,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW,
    borderRightWidth: ARROW,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: Radii.full,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing[3],
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: Spacing[2],
  },
  titleCentered: {
    textAlign: 'center',
  },
  body: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
    marginBottom: Spacing[3],
  },
  bodyCentered: {
    textAlign: 'center',
  },
  stats: {
    backgroundColor: Colors.background,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    marginBottom: Spacing[3],
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  statPoints: {
    fontSize: Typography.size.md,
    color: Colors.accent,
    fontWeight: Typography.weight.bold,
  },
  statMax: {
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing[3],
  },
  dot: {
    borderRadius: Radii.full,
  },
  dotActive: {
    width: 20,
    height: 7,
    backgroundColor: Colors.accent,
  },
  dotInactive: {
    width: 7,
    height: 7,
    backgroundColor: Colors.border,
  },
  buttons: {
    gap: Spacing[3],
  },
  nextBtn: {
    height: 48,
    borderRadius: Radii.lg,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.1,
  },
  skipText: {
    fontSize: Typography.size.md,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
});
