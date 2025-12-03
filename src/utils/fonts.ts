/**
 * Font system constants for the WashNow app
 * 
 * Usage:
 * - App Title / Branding: Montserrat Bold/SemiBold, 24-32pt
 * - Headings (H1-H3): Montserrat SemiBold, 18-22pt
 * - Body Text / Paragraphs: Inter Regular, 14-16pt
 * - Captions / Labels: Inter Medium, 12-13pt
 * - Buttons: Inter SemiBold, 15-17pt
 * - Numbers / Pricing: Inter Bold, 18-22pt
 */

import { Platform } from 'react-native';

// Font families
export const FONTS = {
  // Montserrat
  MONTserrat_BOLD: Platform.select({
    ios: 'Montserrat-Bold',
    android: 'Montserrat-Bold',
    default: 'Montserrat-Bold',
  }),
  MONTserrat_SEMIBOLD: Platform.select({
    ios: 'Montserrat-SemiBold',
    android: 'Montserrat-SemiBold',
    default: 'Montserrat-SemiBold',
  }),
  
  // Inter
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
};

// Font sizes
export const FONT_SIZES = {
  // App Title / Branding: 24-32pt
  APP_TITLE_SMALL: 24,
  APP_TITLE_MEDIUM: 28,
  APP_TITLE_LARGE: 32,
  
  // Headings: 18-22pt
  HEADING_SMALL: 18,
  HEADING_MEDIUM: 20,
  HEADING_LARGE: 22,
  
  // Body Text: 14-16pt
  BODY_SMALL: 14,
  BODY_MEDIUM: 15,
  BODY_LARGE: 16,
  
  // Captions / Labels: 12-13pt
  CAPTION_SMALL: 12,
  CAPTION_MEDIUM: 13,
  
  // Buttons: 15-17pt
  BUTTON_SMALL: 15,
  BUTTON_MEDIUM: 16,
  BUTTON_LARGE: 17,
  
  // Numbers / Pricing: 18-22pt
  NUMBER_SMALL: 18,
  NUMBER_MEDIUM: 20,
  NUMBER_LARGE: 22,
};

// Predefined text styles
export const TEXT_STYLES = {
  // App Title / Branding
  appTitle: {
    fontFamily: FONTS.MONTserrat_BOLD,
    fontSize: FONT_SIZES.APP_TITLE_MEDIUM,
    fontWeight: '700' as const,
  },
  appTitleSmall: {
    fontFamily: FONTS.MONTserrat_BOLD,
    fontSize: FONT_SIZES.APP_TITLE_SMALL,
    fontWeight: '700' as const,
  },
  appTitleLarge: {
    fontFamily: FONTS.MONTserrat_BOLD,
    fontSize: FONT_SIZES.APP_TITLE_LARGE,
    fontWeight: '700' as const,
  },
  appTitleSemiBold: {
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    fontSize: FONT_SIZES.APP_TITLE_MEDIUM,
    fontWeight: '600' as const,
  },
  
  // Headings
  heading: {
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600' as const,
  },
  headingSmall: {
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '600' as const,
  },
  headingLarge: {
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '600' as const,
  },
  
  // Body Text
  body: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontFamily: FONTS.INTER_REGULAR,
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '400' as const,
  },
  
  // Captions / Labels
  caption: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    fontWeight: '500' as const,
  },
  captionSmall: {
    fontFamily: FONTS.INTER_MEDIUM,
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontWeight: '500' as const,
  },
  
  // Buttons
  button: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600' as const,
  },
  buttonSmall: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.BUTTON_SMALL,
    fontWeight: '600' as const,
  },
  buttonLarge: {
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '600' as const,
  },
  
  // Numbers / Pricing
  number: {
    fontFamily: FONTS.INTER_BOLD,
    fontSize: FONT_SIZES.NUMBER_MEDIUM,
    fontWeight: '700' as const,
  },
  numberSmall: {
    fontFamily: FONTS.INTER_BOLD,
    fontSize: FONT_SIZES.NUMBER_SMALL,
    fontWeight: '700' as const,
  },
  numberLarge: {
    fontFamily: FONTS.INTER_BOLD,
    fontSize: FONT_SIZES.NUMBER_LARGE,
    fontWeight: '700' as const,
  },
};


