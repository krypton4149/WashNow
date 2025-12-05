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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const { width, height } = Dimensions.get('window');

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

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
          <Text style={styles.subtitle}>Choose how you want to continue</Text>
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
                style={styles.customerCardImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>I'm a Customer</Text>
                <View style={[styles.cardIconOverlay, { borderColor: BLUE_COLOR }]}>
                  <Ionicons name="person" size={20} color={BLUE_COLOR} />
                </View>
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
                source={require('../../assets/images/owner.png')} 
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>I'm a Service Owner</Text>
                <View style={[styles.cardIconOverlay, { borderColor: YELLOW_COLOR }]}>
                  <Ionicons name="storefront" size={20} color={YELLOW_COLOR} />
                </View>
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
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 8 : 16,
    marginBottom: 28,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  subtitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    letterSpacing: 0.2,
  },
  choicesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingVertical: 0,
    paddingTop: 0,
    marginTop: -20,
    paddingBottom: 10,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    transform: [{ scale: 1 }],
    width: '100%',
    minHeight: 270,
  },
  choiceCardHovered: {
    borderColor: BLUE_COLOR,
    borderWidth: 3,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.01 }],
  },
  choiceCardPressed: {
    borderColor: BLUE_COLOR,
    borderWidth: 3,
    transform: [{ scale: 0.99 }],
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  cardImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: 'transparent',
    flex: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
    paddingHorizontal: 0,
  },
  cardImage: {
    width: '110%',
    height: '100%',
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
  cardIconOverlay: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    marginLeft: 8,
  },
  cardContent: {
    padding: 18,
    paddingTop: 12,
    paddingBottom: 16,
    minHeight: 100,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.3,
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    color: '#555555',
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 22,
    letterSpacing: 0.1,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 18,
  },
});

export default UserChoiceScreen;
