import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Base sizes from iPhone 12/13 (390x844). Adjust if your design baseline differs
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const isSmallDevice = width < 360;
// Always respect both top and bottom insets on all platforms. On Android,
// react-native-safe-area-context correctly reports status bar insets on
// modern devices (hole-punch, notches), so include 'top' as well.
export const platformEdges = ['top', 'bottom'] as const;


