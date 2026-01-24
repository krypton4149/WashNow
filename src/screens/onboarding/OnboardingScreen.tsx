import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { platformEdges } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const { width, height } = Dimensions.get('window');

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface OnboardingScreenProps {
  icon: string; // Icon name from Ionicons
  title: string;
  description: string;
  isActive: boolean;
  totalScreens: number;
  currentIndex: number;
  onNext?: () => void;
  onSkip: () => void;
  onGetStarted: () => void;
}

// Image sources for each onboarding screen
const onboardingImages = [
  require('../../assets/images/screen1.jpg'), // Book Your Wash - two men with smartphone
  require('../../assets/images/screen2.jpg'), // Choose Your Service - two men selecting services
  require('../../assets/images/screen3.jpg'), // Enjoy Clean Rides - man and woman washing car
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  icon,
  title,
  description,
  isActive,
  totalScreens,
  currentIndex,
  onNext,
  onSkip,
  onGetStarted,
}) => {
  const { colors } = useTheme();
  const isLastScreen = currentIndex === totalScreens - 1;

  // Always render when using ScrollView (isActive is used for tracking active screen)

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo2.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Illustration Image */}
        <View style={styles.illustrationContainer}>
          <Image
            source={onboardingImages[currentIndex]}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={1} adjustsFontSizeToFit>
          {description}
        </Text>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots - Hide on last screen */}
        {!isLastScreen && (
          <View style={styles.pagination}>
            {Array.from({ length: totalScreens }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}

        {/* Get Started Button - Only on last screen */}
        {isLastScreen && (
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    paddingTop: Platform.select({ ios: 24, android: 20 }),
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 180,
    height: 180,
    borderRadius: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  illustrationContainer: {
    width: width * 0.95,
    height: width * 0.95,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -20,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: FONT_SIZES.HEADING_LARGE + 2,
    fontWeight: '800',
    fontFamily: FONTS.MONTserrat_BOLD,
    color: BLUE_COLOR,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  description: {
    fontSize: FONT_SIZES.BODY_MEDIUM + 1,
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    flexShrink: 0,
    fontWeight: '600',
    letterSpacing: 0.1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bottomSection: {
    paddingBottom: Platform.select({ ios: 40, android: 32 }),
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: BLUE_COLOR,
    width: 28,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveDot: {
    backgroundColor: '#E5E7EB',
    width: 8,
  },
  navButton: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  getStartedButton: {
    backgroundColor: BLUE_COLOR,
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  navButtonText: {
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default OnboardingScreen;
