import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const renderPagination = () => {
    const indicators = [];
    for (let i = 0; i < totalScreens; i++) {
      if (i === currentIndex) {
        // First screen: black dash, other screens: solid black circle
        if (currentIndex === 0) {
          indicators.push(
            <View key={i} style={styles.activeIndicatorDash} />
          );
        } else {
          indicators.push(
            <View key={i} style={styles.activeIndicatorCircle} />
          );
        }
      } else {
        // Inactive: grey outline circles
        indicators.push(
          <View key={i} style={styles.inactiveIndicator} />
        );
      }
    }
    return <View style={styles.pagination}>{indicators}</View>;
  };

  const isLastScreen = currentIndex === totalScreens - 1;
  const buttonText = isLastScreen ? 'Get Started' : 'Next';
  const showPreview = currentIndex === 1 && onPreview; // Show preview on second screen

  if (!isActive) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Icon with Gradient Background */}
        <View style={styles.iconContainer}>
          <View style={styles.gradientTop} />
          <View style={styles.gradientMiddle} />
          <Ionicons name={icon as any} size={56} color="#FFFFFF" style={styles.icon} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Pagination */}
      {renderPagination()}

      {/* Action Buttons Container */}
      <View style={styles.buttonContainer}>
        {/* Next Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onNext}>
          <Text style={styles.actionButtonText}>{buttonText}</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.arrowIcon} />
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
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#4A4A4A',
  },
  gradientMiddle: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: '#2A2A2A',
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
    backgroundColor: '#000000',
  },
  activeIndicatorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
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
    backgroundColor: '#1F1F1F',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 56,
  },
  actionButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#2F2F2F',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 12,
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default OnboardingScreen;
