import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { platformEdges, moderateScale, verticalScale } from '../../utils/responsive';
import { TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

// Layout scaling (global typography from fonts.ts handles text sizes)
const scaledLogoSize = moderateScale(130);
const scaledCardMinHeight = verticalScale(280);
const scaledCardImageHeight = verticalScale(180);
const scaledCardContentPaddingH = moderateScale(20);
const scaledCardContentPaddingV = moderateScale(16);

interface UserChoiceScreenProps {
  onCustomerPress: () => void;
  onServiceOwnerPress: () => void;
}

const UserChoiceScreen: React.FC<UserChoiceScreenProps> = ({
  onCustomerPress,
  onServiceOwnerPress,
}) => {
  const [customerHovered, setCustomerHovered] = useState(false);
  const [serviceOwnerHovered, setServiceOwnerHovered] = useState(false);
  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        {/* App Icon and Title */}
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo2.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text
            style={styles.subtitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Choose how you want to continue
          </Text>
        </View>

        {/* User Choice Cards */}
        <View style={styles.choicesContainer}>
          {/* Customer Card */}
          <Pressable
            style={({ pressed }) => [
              styles.choiceCard,
              customerHovered && styles.choiceCardHovered,
              pressed && styles.choiceCardPressed,
            ]}
            onPress={onCustomerPress}
            onHoverIn={() => setCustomerHovered(true)}
            onHoverOut={() => setCustomerHovered(false)}
          >
            {/* Card Image */}
            <View style={styles.cardImageContainer}>
              <Image 
                source={require('../../assets/images/Customer.png')} 
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: BLUE_COLOR }]}>I'm a Customer</Text>
              </View>
              <Text style={styles.cardDescription}>
                Book premium car wash services near you
              </Text>
            </View>
          </Pressable>

          {/* Service Owner Card */}
          <Pressable
            style={({ pressed }) => [
              styles.choiceCard,
              serviceOwnerHovered && styles.choiceCardHovered,
              pressed && styles.choiceCardPressed,
            ]}
            onPress={onServiceOwnerPress}
            onHoverIn={() => setServiceOwnerHovered(true)}
            onHoverOut={() => setServiceOwnerHovered(false)}
          >
            {/* Card Image */}
            <View style={styles.cardImageContainer}>
              <Image 
                source={require('../../assets/images/Customer1.png')} 
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={[styles.cardTitle, { color: BLUE_COLOR }]}>I'm a Service Owner</Text>
              </View>
              <Text style={styles.cardDescription}>
                Manage your car wash center and bookings
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 8 : 12,
    marginBottom: 24,
  },
  logoImage: {
    width: scaledLogoSize,
    height: scaledLogoSize,
    borderRadius: 24,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  subtitle: {
    ...TEXT_STYLES.screenTitle,
    color: '#374151',
    textAlign: 'center',
    marginTop: 0,
    textAlignVertical: 'center',
    width: '100%',
    letterSpacing: 0.1,
  },
  choicesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: 0,
    paddingTop: 0,
    marginTop: 0,
    paddingBottom: 12,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    transform: [{ scale: 1 }],
    width: '100%',
    minHeight: scaledCardMinHeight,
  },
  choiceCardHovered: {
    borderColor: BLUE_COLOR,
    borderWidth: 2.5,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
  choiceCardPressed: {
    borderColor: BLUE_COLOR,
    borderWidth: 2.5,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  cardImageContainer: {
    width: '100%',
    height: scaledCardImageHeight,
    position: 'relative',
    backgroundColor: '#F0F4F8',
    flex: 0,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 0,
    margin: 0,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
  },
  customerCardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  cardContent: {
    paddingHorizontal: scaledCardContentPaddingH,
    paddingVertical: scaledCardContentPaddingV,
    paddingTop: 14,
    paddingBottom: 18,
  },
  cardTitleContainer: {
    marginBottom: 0,
  },
  cardTitle: {
    ...TEXT_STYLES.cardTitleSemiBold,
    color: BLUE_COLOR,
    textAlignVertical: 'center',
    letterSpacing: -0.3,
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  cardDescription: {
    ...TEXT_STYLES.bodyPrimary,
    color: '#374151',
    letterSpacing: 0.1,
    marginTop: 0,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
  },
  footerText: {
    ...TEXT_STYLES.bodySecondary,
    color: '#718096',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});

export default UserChoiceScreen;
