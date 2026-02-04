import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Base sizes from iPhone 12/13 (390x844). Adjust if your design baseline differs
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Scale factor from width and height so fonts adapt to both dimensions (works on all device sizes)
const scaleByWidth = width / guidelineBaseWidth;
const scaleByHeight = height / guidelineBaseHeight;
// Use the smaller so fonts never overflow on narrow or short screens; clamp for sanity
const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 1.25;
const baseFontScale = Math.min(
  MAX_FONT_SCALE,
  Math.max(MIN_FONT_SCALE, Math.min(scaleByWidth, scaleByHeight))
);

/**
 * Responsive font size that adapts to both device width and height.
 * Use for all text so it reads well on small phones, large phones, and tablets (iOS & Android).
 */
export const fontScale = (size: number, factor = 0.6) =>
  Math.round(size + (size * baseFontScale - size) * factor);

/** Scale icon sizes with device (use for Ionicons etc.) */
export const iconScale = (size: number) => Math.round(moderateScale(size));

export const isSmallDevice = width < 360;
// Always respect both top and bottom insets on all platforms. On Android,
// react-native-safe-area-context correctly reports status bar insets on
// modern devices (hole-punch, notches), so include 'top' as well.
export const platformEdges = ['top', 'bottom'] as const;


