import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import UserChoiceScreen from './src/screens/user/UserChoiceScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import BookCarWashScreen from './src/screens/book/BookCarWashScreen';
import FindingCarWashScreen from './src/screens/book/FindingCarWashScreen';
import BookingConfirmedScreen from './src/screens/book/BookingConfirmedScreen';
import PaymentScreen from './src/screens/book/PaymentScreen';
import PaymentConfirmedScreen from './src/screens/book/PaymentConfirmedScreen';
import LocationSelectionScreen from './src/screens/book/LocationSelectionScreen';
import ScheduleForLaterScreen from './src/screens/book/ScheduleForLaterScreen';
import ScheduleBookingScreen from './src/screens/book/ScheduleBookingScreen';
import ConfirmBookingScreen from './src/screens/book/ConfirmBookingScreen';
import BookingHistoryScreen from './src/screens/booking/BookingHistoryScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import ChangePasswordScreen from './src/screens/settings/ChangePasswordScreen';
import HelpSupportScreen from './src/screens/support/HelpSupportScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import authService from './src/services/authService';
import { ScreenType } from './src/types';
import MainTabs from './src/navigation/MainTabs';

const AppContent: React.FC = () => {
  const { isDarkMode, colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('onboarding');
  const [currentOnboardingIndex, setCurrentOnboardingIndex] = useState(0);
  const [userType, setUserType] = useState<'customer' | 'service-owner' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isLoggedIn = await authService.isLoggedIn();
      setIsAuthenticated(isLoggedIn);
      if (isLoggedIn) {
        const user = await authService.getUser();
        setUserData(user);
        setCurrentScreen('customer');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onboardingScreens = [
    {
      icon: <Text style={{ fontSize: 64, color: '#000000' }}>📍</Text>,
      title: 'Find Nearby Centers',
      description: 'Discover car wash centers near you with real-time distance tracking',
    },
    {
      icon: <Text style={{ fontSize: 64, color: '#000000' }}>🕙</Text>,
      title: 'Easy Scheduling',
      description: 'Book your preferred time slot and service in just a few taps',
    },
    {
      icon: <Text style={{ fontSize: 64, color: '#000000' }}>💳</Text>,
      title: 'Secure Payments',
      description: 'Pay safely with multiple payment options and track your history',
    },
  ];

  const handleNext = () => {
    if (currentOnboardingIndex < onboardingScreens.length - 1) {
      setCurrentOnboardingIndex(currentOnboardingIndex + 1);
    } else {
      setCurrentScreen('user-choice');
    }
  };

  const handleSkip = () => {
    setCurrentScreen('user-choice');
  };

  const handleCustomerPress = () => {
    setUserType('customer');
    setCurrentScreen('auth');
  };

  const handleServiceOwnerPress = () => {
    setUserType('service-owner');
    setCurrentScreen('auth');
  };

  const handleAuthSuccess = async () => {
    try {
      setIsAuthenticated(true);
      const user = await authService.getUser();
      setUserData(user);
      setCurrentScreen('customer');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    console.log('App: handleLogout invoked');
    try {
      // Optimistic local logout: clear local auth and navigate immediately
      await authService.clearAuth();
      setIsAuthenticated(false);
      setUserData(null);
      setCurrentScreen('user-choice');
      console.log('App: navigated to user-choice after clearing auth');

      // Fire-and-forget server logout; do not block UI
      authService.logout()
        .then(res => {
          console.log('Logout API response:', res);
        })
        .catch(err => {
          console.warn('Background logout failed:', err);
        });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if clearing fails, ensure user is taken out of the session
      setIsAuthenticated(false);
      setUserData(null);
      setCurrentScreen('user-choice');
      console.log('App: forced navigation to user-choice due to error');
    }
  };

  const handleBookWash = () => {
    // Navigate to booking screen
    setCurrentScreen('book-wash');
  };

  const handleViewAll = () => {
    setCurrentScreen('booking-history');
  };

  const handleNavigateToScheduleForLater = () => {
    setCurrentScreen('location-selection');
  };

  const handleConfirmBooking = () => {
    setCurrentScreen('customer'); // Navigate directly to dashboard after successful payment
  };

  const handleInstantBooking = () => {
    setCurrentScreen('finding-car-wash'); // Navigate to finding car wash screen for instant booking
  };

  const handleSendRequestToCenters = () => {
    setCurrentScreen('finding-car-wash');
  };

  const handleBookingConfirmed = (center: any) => {
    setSelectedCenter(center);
    setCurrentScreen('booking-confirmed');
  };

  const handleProceedToPayment = () => {
    setCurrentScreen('payment');
  };

  const handlePaymentSuccess = () => {
    setCurrentScreen('payment-confirmed');
  };

  const handleViewBookingStatus = () => {
    // Navigate to booking status screen
    console.log('View booking status');
  };

  const handleBackToHome = () => {
    setCurrentScreen('customer');
  };

  const handleEditProfile = () => {
    setCurrentScreen('edit-profile');
  };

  const handleSaveProfile = (updatedData: any) => {
    // Update the user data state with the new information
    setUserData(updatedData);
    console.log('Profile updated:', updatedData);
  };

  const { toggleDarkMode } = useTheme();
  
  const handleDarkModeChange = (newDarkMode: boolean) => {
    if (newDarkMode !== isDarkMode) {
      toggleDarkMode();
    }
    console.log('Dark mode changed to:', newDarkMode);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    console.log('Language changed to:', language);
  };

  const handleChangePassword = () => {
    setCurrentScreen('change-password');
  };

  const handleLocationSelect = (location: any) => {
    console.log('Location selected:', location);
    setSelectedLocation(location);
    setCurrentScreen('schedule-for-later');
  };

  const handleCenterSelect = (center: any) => {
    console.log('Center selected:', center);
    setSelectedCenter(center);
    setCurrentScreen('schedule-booking');
  };


  const handleScheduleBookingContinue = (bookingInfo: any) => {
    console.log('Continue to confirmation with booking data:', bookingInfo);
    setBookingData(bookingInfo);
    setCurrentScreen('confirm-booking');
  };


  const handleActivityPress = (activity: any) => {
    console.log('Activity pressed:', activity);
  };

  const handleNotificationPress = () => {
    setCurrentScreen('notifications');
  };

  const handleProfilePress = () => {
    setCurrentScreen('profile');
  };

  const renderScreen = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (currentScreen) {
      case 'onboarding':
        return (
          <OnboardingScreen
            icon={onboardingScreens[currentOnboardingIndex].icon}
            title={onboardingScreens[currentOnboardingIndex].title}
            description={onboardingScreens[currentOnboardingIndex].description}
            isActive={true}
            totalScreens={onboardingScreens.length}
            currentIndex={currentOnboardingIndex}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case 'user-choice':
        return (
          <UserChoiceScreen
            onCustomerPress={handleCustomerPress}
            onServiceOwnerPress={handleServiceOwnerPress}
          />
        );
      case 'auth':
        return (
          <AuthNavigator onAuthSuccess={handleAuthSuccess} />
        );
      case 'customer':
        return (
          <MainTabs
            userData={userData}
            onBookWash={handleBookWash}
            onViewAllBookings={() => setCurrentScreen('booking-history')}
            onOpenSettings={() => setCurrentScreen('settings')}
            onEditProfile={() => setCurrentScreen('edit-profile')}
            navigateTo={(screen) => setCurrentScreen(screen as ScreenType)}
            onLogout={handleLogout}
          />
        );
      case 'book-wash':
        return (
          <BookCarWashScreen 
            onBack={() => setCurrentScreen('customer')}
            onNavigateToAvailableNow={() => setCurrentScreen('available-now')}
            onNavigateToScheduleForLater={handleNavigateToScheduleForLater}
            onConfirmBooking={handleInstantBooking}
          />
        );
      case 'finding-car-wash':
        return (
          <FindingCarWashScreen 
            onBack={() => setCurrentScreen('book-wash')}
            onBookingConfirmed={handleBookingConfirmed}
            selectedLocation={selectedLocation}
          />
        );
      case 'booking-confirmed':
        return (
          <BookingConfirmedScreen 
            onBack={() => setCurrentScreen('book-wash')}
            onProceedToPayment={handleProceedToPayment}
            acceptedCenter={selectedCenter}
          />
        );
      case 'payment':
        return (
          <PaymentScreen 
            onBack={() => setCurrentScreen('booking-confirmed')}
            onPaymentSuccess={handlePaymentSuccess}
            acceptedCenter={selectedCenter}
          />
        );
      case 'payment-confirmed':
        return (
          <PaymentConfirmedScreen 
            onBack={() => setCurrentScreen('payment')}
            onViewBookingStatus={handleViewBookingStatus}
            onBackToHome={handleBackToHome}
            acceptedCenter={selectedCenter}
          />
        );
      case 'location-selection':
        return (
          <LocationSelectionScreen 
            onBack={() => setCurrentScreen('book-wash')}
            onLocationSelect={handleLocationSelect}
          />
        );
      case 'schedule-for-later':
        return (
          <ScheduleForLaterScreen 
            onBack={() => setCurrentScreen('location-selection')}
            onCenterSelect={handleCenterSelect}
            selectedLocation={selectedLocation || { id: '1', name: 'Downtown, New York', centersCount: 2 }}
          />
        );
      case 'schedule-booking':
        return (
          <ScheduleBookingScreen 
            onBack={() => setCurrentScreen('schedule-for-later')}
            onContinue={handleScheduleBookingContinue}
            selectedCenter={selectedCenter || { id: '1', name: 'Premium Auto Wash', rating: 4.8, distance: '0.5 mi', address: '123 Main Street, Downtown', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=80&fit=crop' }}
          />
        );
      case 'confirm-booking':
        return (
          <ConfirmBookingScreen 
            onBack={() => setCurrentScreen('schedule-booking')}
            onConfirmBooking={handleConfirmBooking}
            onSendRequestToCenters={handleSendRequestToCenters}
            bookingData={bookingData || {
              center: {
                id: '1',
                name: 'Quick Shine Car Care',
                rating: 4.6,
                distance: '0.3 mi',
                address: '456 Park Avenue, Midtown',
                image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop'
              },
              service: 'Car Wash',
              date: new Date().toISOString(),
              time: '09:00 AM',
              vehicle: {
                name: 'Honda CR-V',
                plateNumber: 'XYZ 5678',
                type: 'SUV'
              }
            }}
          />
        );
      case 'booking-history':
        return (
          <BookingHistoryScreen onBack={() => setCurrentScreen('customer')} />
        );
      case 'profile':
        return (
          <ProfileScreen 
            onBack={() => setCurrentScreen('customer')}
            onEditProfile={handleEditProfile}
            onBookingHistory={() => setCurrentScreen('booking-history')}
            onHelpSupport={() => setCurrentScreen('help-support')}
            onSettings={() => setCurrentScreen('settings')}
            userData={userData}
          />
        );
      case 'edit-profile':
        return (
          <EditProfileScreen 
            onBack={() => setCurrentScreen('profile')}
            onSaveProfile={handleSaveProfile}
            userData={userData}
          />
        );
      case 'change-password':
        return (
          <ChangePasswordScreen 
            onBack={() => setCurrentScreen('settings')}
            onPasswordChanged={() => setCurrentScreen('settings')}
          />
        );
      case 'help-support':
        return (
          <HelpSupportScreen 
            onBack={() => setCurrentScreen('profile')}
            onContactSupport={() => console.log('Contact support pressed')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen 
            onBack={() => setCurrentScreen('profile')}
            onHelpCenter={() => setCurrentScreen('help-support')}
            onChangePassword={handleChangePassword}
            onLanguageChange={handleLanguageChange}
            onDarkModeChange={handleDarkModeChange}
            onLogout={handleLogout}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen 
            onBack={() => setCurrentScreen('customer')}
            onNotificationPress={(notification) => console.log('Notification pressed:', notification)}
          />
        );
      case 'service-owner':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Service Owner Dashboard</Text>
            <Text style={styles.placeholderSubtext}>Welcome! Your account is verified.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDarkMode ? "light-content" : "dark-content"} 
          backgroundColor={colors.surface} 
        />
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'System',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666666',
  },
});

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;