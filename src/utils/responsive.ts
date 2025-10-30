import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Base sizes from iPhone 12/13 (390x844). Adjust if your design baseline differs
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

export const scale = (size: number) => (width / guidelineBaseWidth) * size;
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const isSmallDevice = width < 360;
export const platformEdges = Platform.OS === 'ios' ? ['top', 'bottom'] : ['bottom'];


