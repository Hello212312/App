// theme.js — Single source of truth for all design tokens
// 8px grid system, 60-30-10 color rule, Inter typography

export const Colors = {
  // 60% — Background & surfaces
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',

  // Borders & dividers
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // 30% — Text hierarchy
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#6B7280', // was #94A3B8 (2.6:1, failed WCAG AA); now ~4.8:1 on white
  textDisabled: '#CBD5E1',

  // 10% — Accent (electric blue — used sparingly)
  accent: '#2563EB',
  accentLight: '#EFF6FF',
  accentMuted: '#BFDBFE',

  // Semantic
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',

  // Tag pill colors (field categories)
  tagSTEM: '#EFF6FF',
  tagSTEMText: '#1D4ED8',
  tagBusiness: '#F0FDF4',
  tagBusinessText: '#15803D',
  tagArt: '#FDF4FF',
  tagArtText: '#7E22CE',
  tagEngineering: '#FFF7ED',
  tagEngineeringText: '#C2410C',
  tagMedicine: '#FFF1F2',
  tagMedicineText: '#BE123C',
  tagComputerScience: '#EEF2FF',
  tagComputerScienceText: '#4338CA',
  tagAerospace: '#F0F9FF',
  tagAerospaceText: '#0369A1',
  tagFinance: '#FEFCE8',
  tagFinanceText: '#A16207',
  tagJournalism: '#FFF7ED',
  tagJournalismText: '#9A3412',
  tagScience: '#F0FDF4',
  tagScienceText: '#166534',

  // White / overlay
  white: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.4)',
};

export const Typography = {
  // Font family
  fontFamily: 'System', // uses SF Pro on iOS, Roboto on Android natively

  // Scale (8px base)
  size: {
    xs: 12, // was 11 — raised for legibility (labels, badges)
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },

  // Weights
  weight: {
    regular: '400' ,
    medium: '500' ,
    semibold: '600' ,
    bold: '700' ,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.6,
  },
};

export const Spacing = {
  // 8px grid
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,

  // Named
  screenPadding: 16,
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 24,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 16,
  '2xl': 20,
  full: 999,
};

export const Shadows = {
  // Subtle, single-direction — not heavy
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};