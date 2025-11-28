import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { platformEdges } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  icon: string; // Icon name from Ionicons
  title: string;
  description: string;
  isActive: boolean;
  totalScreens: number;
  currentIndex: number;
  onNext: () => void;
  onSkip: () => void;
  onPreview?: () => void; // Optional preview button for second screen
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  icon,
  title,
  description,
  isActive,
  totalScreens,
  currentIndex,
  onNext,
  onSkip,
  onPreview,
}) => {
  const { colors } = useTheme();

  const isLastScreen = currentIndex === totalScreens - 1;
  const buttonText = isLastScreen ? 'Get Started' : 'Next';
  const showPreview = currentIndex === 1 && onPreview; // Show preview on second screen

  if (!isActive) return null;

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Icon with Gradient Background */}
        <View style={[styles.iconContainer, { backgroundColor: colors.button }]}>
          <View style={[styles.gradientTop, { backgroundColor: colors.button }]} />
          <View style={[styles.gradientMiddle, { backgroundColor: colors.button }]} />
          <Ionicons name={icon as any} size={56} color={colors.buttonText} style={styles.icon} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Pagination */}
      <View style={styles.pagination}>
        {Array.from({ length: totalScreens }).map((_, i) => {
          if (i === currentIndex) {
            // First screen: blue dash, other screens: solid blue circle
            if (currentIndex === 0) {
              return (
                <View key={i} style={[styles.activeIndicatorDash, { backgroundColor: colors.button }]} />
              );
            } else {
              return (
                <View key={i} style={[styles.activeIndicatorCircle, { backgroundColor: colors.button }]} />
              );
            }
          } else {
            // Inactive: grey outline circles
            return (
              <View key={i} style={styles.inactiveIndicator} />
            );
          }
        })}
      </View>

      {/* Action Buttons Container */}
      <View style={styles.buttonContainer}>
        {/* Next Button */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.button }]} onPress={onNext}>
          <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>{buttonText}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.buttonText} style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* Preview Button (only on second screen) */}
       
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 17,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  gradientMiddle: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: '20%',
  },
  icon: {
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'System',
    maxWidth: 280,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  activeIndicatorDash: {
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  activeIndicatorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inactiveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    position: 'relative',
    marginBottom: 40,
    marginHorizontal: 24,
  },
  actionButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 56,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
    flex: 1,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  previewButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 12,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default OnboardingScreen;
