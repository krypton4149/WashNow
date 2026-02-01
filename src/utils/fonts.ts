/**
 * App Font Guidelines – Inter (Global)
 * Designed for screens. Highly readable. Modern, neutral.
 * All sizes are responsive (scale with device via moderateScale).
 *
 * Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)
 * Line height: 1.5 (font size × 1.5) for airy, premium feel.
 *
 * Go-To Production Combo (dashboard & buttons):
 *   Title: 22 px / SemiBold
 *   Section Heading: 16 px / Medium
 *   Body Text: 14 px / Regular
 *   Secondary Text: 12 px / Regular
 *   Button Text: 15 px / Medium
 *   Line Height: 1.5
 */

import { Platform } from 'react-native';
import { moderateScale } from './responsive';

// ─── Font families (Inter only) ─────────────────────────────────────────────
export const FONTS = {
  INTER_REGULAR: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    default: 'Inter-Regular',
  }),
  INTER_MEDIUM: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
    default: 'Inter-Medium',
  }),
  INTER_SEMIBOLD: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    default: 'Inter-SemiBold',
  }),
  INTER_BOLD: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    default: 'Inter-Bold',
  }),
  // Legacy aliases (Inter replaces Montserrat app-wide)
  MONTserrat_BOLD: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    default: 'Inter-Bold',
  }),
  MONTserrat_SEMIBOLD: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    default: 'Inter-SemiBold',
  }),
};

// Line height multiplier (1.4–1.6)
const LINE_HEIGHT_MULT = 1.5;

// ─── Responsive font sizes (scale with device) ───────────────────────────────
export const FONT_SIZES = {
  // Screen Title: 22–24 px / Bold or SemiBold
  SCREEN_TITLE: moderateScale(22),
  SCREEN_TITLE_LARGE: moderateScale(24),

  // Section Heading: 16–18 px / SemiBold
  SECTION_HEADING: moderateScale(16),
  SECTION_HEADING_LARGE: moderateScale(18),

  // Card Title: 15–16 px / Medium or SemiBold
  CARD_TITLE: moderateScale(15),
  CARD_TITLE_LARGE: moderateScale(16),

  // Body: Primary 14–15 px, Secondary 12–13 px
  BODY_PRIMARY: moderateScale(14),
  BODY_PRIMARY_LARGE: moderateScale(15),
  BODY_SECONDARY: moderateScale(12),
  BODY_SECONDARY_LARGE: moderateScale(13),

  // Captions / Hints: 11–12 px
  CAPTION: moderateScale(11),
  CAPTION_LARGE: moderateScale(12),

  // Buttons: 14–16 px / Medium or SemiBold
  BUTTON: moderateScale(14),
  BUTTON_LARGE: moderateScale(15),
  BUTTON_XL: moderateScale(16),

  // Input: 14–15 px, Label: 12–13 px
  INPUT: moderateScale(14),
  INPUT_LARGE: moderateScale(15),
  LABEL: moderateScale(12),
  LABEL_LARGE: moderateScale(13),

  // Legacy aliases (for backward compatibility)
  APP_TITLE_SMALL: moderateScale(22),
  APP_TITLE_MEDIUM: moderateScale(23),
  APP_TITLE_LARGE: moderateScale(24),
  HEADING_SMALL: moderateScale(16),
  HEADING_MEDIUM: moderateScale(17),
  HEADING_LARGE: moderateScale(18),
  BODY_SMALL: moderateScale(14),
  BODY_MEDIUM: moderateScale(15),
  BODY_LARGE: moderateScale(16),
  CAPTION_SMALL: moderateScale(12),
  CAPTION_MEDIUM: moderateScale(13),
  BUTTON_SMALL: moderateScale(14),
  BUTTON_MEDIUM: moderateScale(15),
  BUTTON_LARGE: moderateScale(16),
  NUMBER_SMALL: moderateScale(18),
  NUMBER_MEDIUM: moderateScale(20),
  NUMBER_LARGE: moderateScale(22),
};

// ─── Global text styles (Inter, responsive, with line height) ───────────────
export const TEXT_STYLES = {
  // Screen Title: 22–24 px / Bold or SemiBold
  screenTitle: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.SCREEN_TITLE,
    fontWeight: '600' as const,
    lineHeight: Math.round(FONT_SIZES.SCREEN_TITLE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  screenTitleBold: {
    fontFamily: FONTS.INTER_BOLD,
    fontSize: FONT_SIZES.SCREEN_TITLE_LARGE,
    fontWeight: '700' as const,
    lineHeight: Math.round(FONT_SIZES.SCREEN_TITLE_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Section Heading: 16–18 px / SemiBold
  sectionHeading: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.SECTION_HEADING,
    fontWeight: '600' as const,
    lineHeight: Math.round(FONT_SIZES.SECTION_HEADING * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  sectionHeadingLarge: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: '600' as const,
    lineHeight: Math.round(FONT_SIZES.SECTION_HEADING_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  /** Go-To Production: Section Heading 16 px / Medium */
  sectionHeadingMedium: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.SECTION_HEADING,
    fontWeight: '500' as const,
    lineHeight: Math.round(FONT_SIZES.SECTION_HEADING * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Card Title: 15–16 px / Medium or SemiBold
  cardTitle: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.CARD_TITLE,
    fontWeight: '500' as const,
    lineHeight: Math.round(FONT_SIZES.CARD_TITLE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  cardTitleSemiBold: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.CARD_TITLE_LARGE,
    fontWeight: '600' as const,
    lineHeight: Math.round(FONT_SIZES.CARD_TITLE_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Body: Primary 14–15 px / Regular
  bodyPrimary: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.BODY_PRIMARY * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  bodyPrimaryLarge: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_PRIMARY_LARGE,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.BODY_PRIMARY_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Secondary: 12–13 px / Regular
  bodySecondary: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_SECONDARY,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.BODY_SECONDARY * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  bodySecondaryLarge: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_SECONDARY_LARGE,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.BODY_SECONDARY_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Captions / Hints: 11–12 px / Regular
  caption: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.CAPTION,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.CAPTION * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  captionLarge: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.CAPTION_LARGE,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.CAPTION_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Button: 14–16 px / Medium or SemiBold
  button: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.BUTTON,
    fontWeight: '500' as const,
    lineHeight: Math.round(FONT_SIZES.BUTTON * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  buttonSemiBold: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '600' as const,
    lineHeight: Math.round(FONT_SIZES.BUTTON_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  /** Go-To Production: Button Text 15 px / Medium */
  buttonProduction: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '500' as const,
    lineHeight: Math.round(FONT_SIZES.BUTTON_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Input: 14–15 px / Regular
  input: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.INPUT,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.INPUT * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Label: 12–13 px / Medium
  label: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.LABEL,
    fontWeight: '500' as const,
    lineHeight: Math.round(FONT_SIZES.LABEL * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },

  // Legacy (backward compatibility)
  appTitle: {
    fontFamily: FONTS.INTER_BOLD,
    fontSize: FONT_SIZES.SCREEN_TITLE_LARGE,
    fontWeight: '700' as const,
    lineHeight: Math.round(FONT_SIZES.SCREEN_TITLE_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  heading: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.SECTION_HEADING,
    fontWeight: '600' as const,
    lineHeight: Math.round(FONT_SIZES.SECTION_HEADING * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  body: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    fontWeight: '400' as const,
    lineHeight: Math.round(FONT_SIZES.BODY_PRIMARY * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  buttonText: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '500' as const,
    lineHeight: Math.round(FONT_SIZES.BUTTON_LARGE * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
  number: {
    fontFamily: FONTS.INTER_BOLD,
    fontSize: FONT_SIZES.NUMBER_MEDIUM,
    fontWeight: '700' as const,
    lineHeight: Math.round(FONT_SIZES.NUMBER_MEDIUM * LINE_HEIGHT_MULT),
    includeFontPadding: false,
  },
};
