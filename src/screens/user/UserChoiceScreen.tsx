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

interface UserChoiceScreenProps {
  onCustomerPress: () => void;
  onServiceOwnerPress: () => void;
}

const UserChoiceScreen: React.FC<UserChoiceScreenProps> = ({
  onCustomerPress,
  onServiceOwnerPress,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* App Icon and Title */}
      <View style={styles.header}>
        <View style={styles.appIcon}>
          <Text style={styles.sparkleIcon1}>✨</Text>
          <Text style={styles.sparkleIcon2}>✨</Text>
          <Text style={styles.plusSymbol}>+</Text>
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
    marginTop: 100,
    marginBottom: 80,
  },
  appIcon: {
    width: 88,
    height: 88,
    backgroundColor: '#000000',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  sparkleIcon1: {
    fontSize: 20,
    color: '#FFD700',
    position: 'absolute',
    left: 10,
    top: 10,
  },
  sparkleIcon2: {
    fontSize: 28,
    color: '#FFD700',
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  plusSymbol: {
    fontSize: 16,
    color: '#FFFFFF',
    position: 'absolute',
    right: 6,
    top: 6,
    fontWeight: 'bold',
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
