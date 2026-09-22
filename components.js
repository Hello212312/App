// components.tsx: Reusable UI primitives
// Copy this file into your components/ folder

import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Colors, Radii, Shadows, Spacing, Typography } from './theme';

// ─── TAG PILL ────────────────────────────────────────────────────────────────

export const Tag = ({ label, variant = 'default', size = 'sm' }) => {
  const bgMap = {
    default: Colors.surfaceSecondary,
    accent: Colors.accentLight,
    success: Colors.successLight,
    warning: Colors.warningLight,
    'Computer Science': Colors.tagComputerScience,
    Business: Colors.tagBusiness,
    Art: Colors.tagArt,
    Arts: Colors.tagArt,                    // canonical DB field name
    Engineering: Colors.tagEngineering,
    Medicine: Colors.tagMedicine,
    Aerospace: Colors.tagAerospace,
    Finance: Colors.tagFinance,
    Journalism: Colors.tagJournalism,
    Science: Colors.tagScience,
    Environment: Colors.successLight,
    Law: Colors.warningLight,
    'Law/Advocacy': Colors.warningLight,    // canonical DB field name
    History: Colors.tagFinance,             // canonical DB field name
    'Multi-Field': Colors.accentLight,      // canonical DB tag
    Education: Colors.surfaceSecondary,
  };
  const textMap = {
    default: Colors.textSecondary,
    accent: Colors.accent,
    success: Colors.success,
    warning: Colors.warning,
    'Computer Science': Colors.tagComputerScienceText,
    Business: Colors.tagBusinessText,
    Art: Colors.tagArtText,
    Arts: Colors.tagArtText,
    Engineering: Colors.tagEngineeringText,
    Medicine: Colors.tagMedicineText,
    Aerospace: Colors.tagAerospaceText,
    Finance: Colors.tagFinanceText,
    Journalism: Colors.tagJournalismText,
    Science: Colors.tagScienceText,
    Environment: Colors.success,
    Law: Colors.warning,
    'Law/Advocacy': Colors.warning,
    History: Colors.tagFinanceText,
    'Multi-Field': Colors.accent,
    Education: Colors.textSecondary,
  };

  return (
    <View style={[
      styles.tag,
      { backgroundColor: bgMap[variant] || bgMap.default },
      size === 'md' && { paddingHorizontal: 12, paddingVertical: 6 },
    ]}>
      <Text style={[
        styles.tagText,
        { color: textMap[variant] || textMap.default },
        size === 'md' && { fontSize: Typography.size.sm },
      ]}>
        {label}
      </Text>
    </View>
  );
};

// ─── DEADLINE BADGE ───────────────────────────────────────────────────────────

export const DeadlineBadge = ({ daysLeft }) => {
  const isUrgent = daysLeft <= 7;
  const label = daysLeft === 0 ? 'Today' : `${daysLeft}d left`;

  return (
    <View
      accessible
      accessibilityLabel={daysLeft === 0 ? 'Deadline is today' : `${daysLeft} days left to apply`}
      style={[
      styles.tag,
      { backgroundColor: isUrgent ? Colors.errorLight : Colors.surfaceSecondary },
    ]}>
      <Text style={[
        styles.tagText,
        { color: isUrgent ? Colors.error : Colors.textTertiary },
      ]}>
        {label}
      </Text>
    </View>
  );
};

// ─── CLOSED BADGE ─────────────────────────────────────────────────────────────
// Shown when a program's fixed deadline has already passed.

export const ClosedBadge = () => (
  <View
    accessible
    accessibilityLabel="Applications closed"
    style={[styles.tag, { backgroundColor: Colors.surfaceSecondary }]}
  >
    <Text style={[styles.tagText, { color: Colors.textSecondary, fontWeight: '600' }]}>
      Closed
    </Text>
  </View>
);

// ─── FILTER CHIP ──────────────────────────────────────────────────────────────

export const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[
      styles.filterChip,
      active && styles.filterChipActive,
    ]}
  >
    <Text style={[
      styles.filterChipText,
      active && styles.filterChipTextActive,
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

export const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── DIVIDER ──────────────────────────────────────────────────────────────────

export const Divider = ({ style }) => (
  <View style={[styles.divider, style]} />
);

// ─── PRIMARY BUTTON ───────────────────────────────────────────────────────────

export const Button = ({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
}) => {
  const variantStyles = {
    primary: {
      container: { backgroundColor: disabled ? Colors.textDisabled : Colors.accent },
      text: { color: Colors.white },
    },
    secondary: {
      container: {
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: disabled ? Colors.border : Colors.accent,
      },
      text: { color: disabled ? Colors.textDisabled : Colors.accent },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      text: { color: disabled ? Colors.textDisabled : Colors.textSecondary },
    },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        variantStyles[variant].container,
        fullWidth && { width: '100%' },
      ]}
    >
      <Text style={[styles.buttonText, variantStyles[variant].text]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── MATCH BREAKDOWN MODAL ──────────────────────────────────────────────────
// Explains why an internship got the match score it did. Tap the score
// badge to open, tap the X or anywhere outside the card to close.

export const MatchBreakdownModal = ({ visible, onClose, breakdown, title }) => {
  if (!breakdown) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={mbStyles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={mbStyles.card}>
              <View style={mbStyles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={mbStyles.title}>{title || 'Match score'}</Text>
                  <Text style={mbStyles.scoreText}>{breakdown.total}% match</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {breakdown.ineligible && (
                <Text style={mbStyles.ineligibleNote}>
                  {breakdown.ineligibleReason || "You don't meet this program's eligibility requirements."}
                </Text>
              )}

              <ScrollView style={mbStyles.list} showsVerticalScrollIndicator={false}>
                {breakdown.categories.map((c) => (
                  <View key={c.key} style={mbStyles.row}>
                    <View style={mbStyles.rowTop}>
                      <Text style={mbStyles.rowLabel}>{c.label}</Text>
                      <Text style={mbStyles.rowPoints}>
                        +{c.points}<Text style={mbStyles.rowMax}>/{c.max}</Text>
                      </Text>
                    </View>
                    <Text style={mbStyles.rowDetail}>{c.detail}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ─── PREMIUM UPSELL BANNER ─────────────────────────────────────────────────
// Compact, tappable banner used across screens to surface Premium to free
// users. Callers are responsible for gating on `!user.premium`.

export const PremiumUpsellBanner = ({ title, sub, onPress, icon = 'sparkles' }) => (
  <TouchableOpacity style={styles.premiumBanner} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.premiumBannerIcon}>
      <Ionicons name={icon} size={18} color={Colors.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.premiumBannerTitle}>{title}</Text>
      {!!sub && <Text style={styles.premiumBannerSub}>{sub}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
  </TouchableOpacity>
);

// ─── COMPANY LOGO PLACEHOLDER ─────────────────────────────────────────────────

export const CompanyLogo = ({ name, size = 44, color = Colors.accentLight }) => (
  <View style={[styles.companyLogo, { width: size, height: size, backgroundColor: color || Colors.accentLight, borderRadius: size / 4 }]}>
    <Text style={[styles.companyLogoText, { fontSize: size * 0.36 }]}>
      {(name || '?').charAt(0).toUpperCase()}
    </Text>
  </View>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    letterSpacing: 0.1,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  sectionAction: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  button: {
    height: 52,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  buttonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.1,
  },
  companyLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    fontWeight: Typography.weight.bold,
    color: Colors.accent,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.accentMuted,
    padding: Spacing[3],
    gap: Spacing[3],
  },
  premiumBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBannerTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  premiumBannerSub: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.4,
  },
});

const mbStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[5],
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii['2xl'],
    padding: Spacing[5],
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    ...Shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  scoreText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ineligibleNote: {
    fontSize: Typography.size.sm,
    color: Colors.error,
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.md,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  list: {
    maxHeight: 380,
  },
  row: {
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  rowLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  rowPoints: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.accent,
  },
  rowMax: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.regular,
    color: Colors.textTertiary,
  },
  rowDetail: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
});
