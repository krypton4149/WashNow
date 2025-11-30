import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Platform,
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
      <View style={styles.content}>
        {/* App Icon and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoGradient}>
              <Image 
                source={require('../../assets/images/logo.jpg')} 
                style={styles.appLogo}
                resizeMode="contain"
                onError={(error) => {
                  console.log('Logo image error:', error);
                }}
              />
            </View>
          </View>
          <Text style={styles.appTitle}>CarWash</Text>
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
                source={{
                  uri: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGN1c3RvbWVyJTIwc2VydmljZXxlbnwxfHx8fDE3NjIzMzA3NTR8MA&ixlib=rb-4.1.0&q=80&w=1080'
                }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
              {/* Icon Overlay */}
              <View style={[styles.cardIconOverlay, { borderColor: BLUE_COLOR }]}>
                <Ionicons name="person" size={20} color={BLUE_COLOR} />
              </View>
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>I'm a Customer</Text>
                <Ionicons name="water" size={18} color={YELLOW_COLOR} style={styles.sparkleIcon} />
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
                source={{
                  uri: 'https://images.unsplash.com/photo-1758887261865-a2b89c0f7ac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG93bmVyJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2MjQ0NDA3NHww&ixlib=rb-4.1.0&q=80&w=1080'
                }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
              {/* Icon Overlay */}
              <View style={[styles.cardIconOverlay, { borderColor: YELLOW_COLOR }]}>
                <Ionicons name="storefront" size={20} color={YELLOW_COLOR} />
              </View>
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>I'm a Service Owner</Text>
                <Ionicons name="water" size={18} color={BLUE_COLOR} style={styles.sparkleIcon} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0F8',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 16 : 32,
    marginBottom: 20,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  appLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  appTitle: {
    fontSize: FONT_SIZES.APP_TITLE_SMALL,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    fontFamily: FONTS.MONTserrat_BOLD,
    letterSpacing: -0.5,
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
    justifyContent: 'center',
    paddingVertical: 20,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
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
    height: 140,
    position: 'relative',
    backgroundColor: '#E8E8E8',
  },
  cardImage: {
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
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 10,
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
  },
  cardContent: {
    padding: 18,
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
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
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
