import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface UserChoiceScreenProps {
  onCustomerPress: () => void;
  onServiceOwnerPress: () => void;
}

const UserChoiceScreen: React.FC<UserChoiceScreenProps> = ({
  onCustomerPress,
  onServiceOwnerPress,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
        <TouchableOpacity style={styles.choiceCard} onPress={onCustomerPress}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.personIcon}>👤</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>I'm a Customer</Text>
            <Text style={styles.cardDescription}>Book car wash services.</Text>
          </View>
        </TouchableOpacity>

        {/* Service Owner Card */}
        <TouchableOpacity style={styles.choiceCard} onPress={onServiceOwnerPress}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.buildingIcon}>🏢</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>I'm a Service Owner</Text>
            <Text style={styles.cardDescription}>Manage your car wash center.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  appLogo: {
    width: 88,
    height: 88,
    borderRadius: 24,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: 'System',
  },
  choicesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingBottom: 60,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    // Add subtle border for definition
    borderColor: '#E8E8E8',
    borderWidth: 0.5,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  personIcon: {
    fontSize: 28,
    color: '#1976D2',
  },
  buildingIcon: {
    fontSize: 28,
    color: '#1976D2',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    fontFamily: 'System',
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
  },
});

export default UserChoiceScreen;
