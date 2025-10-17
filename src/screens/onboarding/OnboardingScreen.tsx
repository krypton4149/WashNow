import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  totalScreens: number;
  currentIndex: number;
  onNext: () => void;
  onSkip: () => void;
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
}) => {
  const renderPagination = () => {
    const dots = [];
    for (let i = 0; i < totalScreens; i++) {
      dots.push(
        <View
          key={i}
          style={[
            i === currentIndex ? styles.activeIndicator : styles.inactiveIndicator,
          ]}
        />
      );
    }
    return <View style={styles.pagination}>{dots}</View>;
  };

  const isLastScreen = currentIndex === totalScreens - 1;
  const buttonText = isLastScreen ? 'Get Started' : 'Next';

  if (!isActive) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          {icon}
        </View>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Pagination */}
      {renderPagination()}

      {/* Action Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onNext}>
        <Text style={styles.actionButtonText}>{buttonText}</Text>
      </TouchableOpacity>
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
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    marginBottom: 48,
    gap: 12,
  },
  activeIndicator: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
  },
  inactiveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D1D6',
  },
  actionButton: {
    backgroundColor: '#000000',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    // Add subtle border for better definition
    borderWidth: 0.5,
    borderColor: '#1A1A1A',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: -0.2,
  },
});

export default OnboardingScreen;
