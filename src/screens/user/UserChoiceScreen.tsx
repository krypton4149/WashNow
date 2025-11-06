import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Icon and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.appLogo}
              resizeMode="contain"
              onError={(error) => {
                console.log('Logo image error:', error);
              }}
            />
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
              <View style={styles.cardIconOverlay}>
                <Ionicons name="person" size={20} color="#000" />
              </View>
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>I'm a Customer</Text>
                <Ionicons name="star" size={16} color="#FFC107" style={styles.sparkleIcon} />
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
              <View style={styles.cardIconOverlay}>
                <Ionicons name="storefront" size={20} color="#000" />
              </View>
            </View>
            
            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>I'm a Service Owner</Text>
                <Ionicons name="star" size={16} color="#2196F3" style={styles.sparkleIcon} />
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  appLogo: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: 'System',
  },
  choicesContainer: {
    paddingBottom: 20,
  },
  choiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    transform: [{ scale: 1 }],
  },
  choiceCardHovered: {
    borderColor: '#2196F3',
    borderWidth: 2,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  choiceCardPressed: {
    borderColor: '#1976D2',
    borderWidth: 2,
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 7,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
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
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardContent: {
    padding: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'System',
    letterSpacing: -0.2,
  },
  sparkleIcon: {
    marginLeft: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 18,
  },
});

export default UserChoiceScreen;
