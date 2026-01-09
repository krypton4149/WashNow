import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { STRIPE_PUBLISHABLE_KEY, MERCHANT_IDENTIFIER } from './src/services/paymentService';

// Import StripeProvider with error handling for native module linking
let StripeProvider: React.ComponentType<{ 
  publishableKey: string; 
  merchantIdentifier?: string;
  children: React.ReactNode 
}>;
try {
  const stripeModule = require('@stripe/stripe-react-native');
  if (stripeModule && stripeModule.StripeProvider) {
    StripeProvider = stripeModule.StripeProvider;
  } else {
    throw new Error('StripeProvider not found in module');
  }
} catch (error) {
  console.warn('⚠️ Stripe native module not linked. Please rebuild the app after running pod install.');
  console.warn('Error:', error);
  // Fallback: Create a no-op provider component that just passes children through
  StripeProvider = ({ children }: { publishableKey: string; merchantIdentifier?: string; children: React.ReactNode }) => <>{children}</>;
}
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import UserChoiceScreen from './src/screens/user/UserChoiceScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import OwnerAuthNavigator from './src/navigation/OwnerAuthNavigator';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import OwnerTabs from './src/navigation/OwnerTabs';
import BookCarWashScreen from './src/screens/book/BookCarWashScreen';
import FindingCarWashScreen from './src/screens/book/FindingCarWashScreen';
import BookingConfirmedScreen from './src/screens/book/BookingConfirmedScreen';
import PaymentScreen from './src/screens/book/PaymentScreen';
import PaymentConfirmedScreen from './src/screens/book/PaymentConfirmedScreen';
import ScheduleBookingConfirmedScreen from './src/screens/book/ScheduleBookingConfirmedScreen';
import ScheduleForLaterScreen from './src/screens/book/ScheduleForLaterScreen';
import ScheduleBookingScreen from './src/screens/book/ScheduleBookingScreen';
import ConfirmBookingScreen from './src/screens/book/ConfirmBookingScreen';
import BookingHistoryScreen from './src/screens/booking/BookingHistoryScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import ChangePasswordScreen from './src/screens/settings/ChangePasswordScreen';
import CreateNewPasswordScreen from './src/screens/auth/CreateNewPasswordScreen';
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
  const [lastBookingId, setLastBookingId] = useState<string | undefined>(undefined);
  const [filteredCenters, setFilteredCenters] = useState<any[] | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>(undefined);
  const onboardingScrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = Dimensions.get('window');

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
        // Check user type from stored user data or default to customer
        const storedUserType = user?.type === 'service-owner' ? 'service-owner' : 'customer';
        setUserType(storedUserType);
        setCurrentScreen(storedUserType === 'service-owner' ? 'service-owner' : 'customer');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onboardingScreens = [
    {
      icon: 'calendar-outline',
      title: 'Book Your Wash',
      description: 'Schedule car wash services at your convenience',
    },
    {
      icon: 'options-outline',
      title: 'Choose Your Service',
      description: 'Select from various wash packages and add-ons',
    },
    {
      icon: 'car-outline',
      title: 'Enjoy Clean Rides',
      description: 'Get your vehicle professionally cleaned',
    },
  ];

  const handlePreview = () => {
    // Go back to previous screen
    if (currentOnboardingIndex > 0) {
      setCurrentOnboardingIndex(currentOnboardingIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentOnboardingIndex < onboardingScreens.length - 1) {
      const nextIndex = currentOnboardingIndex + 1;
      setCurrentOnboardingIndex(nextIndex);
      onboardingScrollRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    } else {
      setCurrentScreen('user-choice');
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index !== currentOnboardingIndex && index >= 0 && index < onboardingScreens.length) {
      setCurrentOnboardingIndex(index);
    }
  };

  const handleSkip = () => {
    setCurrentScreen('user-choice');
  };

  // Auto-advance onboarding slider every 4 seconds
  useEffect(() => {
    if (currentScreen === 'onboarding') {
      const interval = setInterval(() => {
        setCurrentOnboardingIndex((prevIndex) => {
          if (prevIndex < onboardingScreens.length - 1) {
            const nextIndex = prevIndex + 1;
            // Scroll to next screen
            onboardingScrollRef.current?.scrollTo({
              x: nextIndex * screenWidth,
              animated: true,
            });
            return nextIndex;
          }
          // Stay on last screen, don't auto-advance
          return prevIndex;
        });
      }, 2000); // 2 seconds

      return () => clearInterval(interval);
    }
  }, [currentScreen, onboardingScreens.length, screenWidth]);

  // Sync scroll position when currentOnboardingIndex changes programmatically
  useEffect(() => {
    if (currentScreen === 'onboarding' && onboardingScrollRef.current) {
      onboardingScrollRef.current.scrollTo({
        x: currentOnboardingIndex * screenWidth,
        animated: true,
      });
    }
  }, [currentOnboardingIndex, currentScreen, screenWidth]);

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
      console.log('[App] handleAuthSuccess loaded user:', user);
      setUserData(user);
      // Redirect based on user type
      if (userType === 'service-owner') {
        setCurrentScreen('service-owner');
      } else {
        setCurrentScreen('customer');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    console.log('App: handleLogout invoked');
    const doLogout = async () => {
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

    // Ask for confirmation first
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => { doLogout(); } },
      ]
    );
  };

  const handleBookWash = () => {
    // Navigate to booking screen
    setCurrentScreen('book-wash');
  };

  const handleViewAll = () => {
    setCurrentScreen('booking-history');
  };

  const handleNavigateToScheduleForLater = () => {
    setCurrentScreen('schedule-for-later');
  };

  const handleConfirmBooking = () => {
    // If bookingData exists, it's a scheduled booking - go to payment
    if (bookingData) {
      setCurrentScreen('schedule-payment');
    } else {
      setCurrentScreen('customer'); // Instant booking - navigate directly to dashboard
    }
  };

  const handleSchedulePaymentSuccess = (bookingId?: string, bookingDataResponse?: { date: string; time: string }, totalAmount?: number) => {
    // Preserve existing bookingData and update with bookingId and any response data
    setBookingData((prev: any) => ({ 
      ...(prev || {}), 
      bookingId,
      // Use response data if provided, otherwise keep existing date/time
      date: bookingDataResponse?.date || prev?.date,
      time: bookingDataResponse?.time || prev?.time,
    }));
    // Store the payment amount
    if (totalAmount !== undefined) {
      setPaymentAmount(totalAmount);
    }
    setLastBookingId(bookingId);
    setCurrentScreen('schedule-booking-payment-confirmed');
  };

  const handleInstantBooking = (centersToBroadcast: any[] = []) => {
    console.log('=== App: handleInstantBooking called ===');
    console.log('Centers to broadcast count:', centersToBroadcast.length);
    console.log('Centers to broadcast:', JSON.stringify(centersToBroadcast, null, 2));
    
    // Store the filtered centers that should receive the request
    // IMPORTANT: Set filteredCenters BEFORE navigating to ensure it's available on first render
    // Use empty array as a marker for "use filtered" vs null for "load all"
    if (centersToBroadcast.length > 0) {
      setFilteredCenters([...centersToBroadcast]); // Create new array to ensure reference changes
      console.log('Set filteredCenters with', centersToBroadcast.length, 'centers');
      
      // Use setTimeout to ensure state is set before navigation
      // React batches state updates, so we need to ensure filteredCenters is set
      setTimeout(() => {
        setCurrentScreen('finding-car-wash'); // Navigate after state update
      }, 0);
    } else {
      setFilteredCenters(null);
      console.log('Set filteredCenters to null (no centers provided)');
      setCurrentScreen('finding-car-wash'); // Navigate to finding car wash screen for instant booking
    }
  };

  const handleSendRequestToCenters = () => {
    setCurrentScreen('finding-car-wash');
  };

  const handleBookingConfirmed = (center: any) => {
    setSelectedCenter(center);
    setCurrentScreen('booking-confirmed');
  };

  const handleProceedToPayment = (instantBookingData?: { date: string; time: string }) => {
    // For instant booking, set bookingData with current date/time
    if (instantBookingData) {
      setBookingData({
        date: instantBookingData.date,
        time: instantBookingData.time,
        center: selectedCenter,
      });
    }
    setCurrentScreen('payment');
  };

  const handlePaymentSuccess = (bookingId?: string, instantBookingData?: { date: string; time: string }, totalAmount?: number) => {
    setLastBookingId(bookingId);
    // Store the payment amount
    if (totalAmount !== undefined) {
      setPaymentAmount(totalAmount);
    }
    // For instant booking, set bookingData with today's date and current time if not already set (scheduled booking)
    if (instantBookingData && !bookingData) {
      setBookingData({
        date: instantBookingData.date,
        time: instantBookingData.time,
        center: selectedCenter,
      });
    }
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

  const handleSaveProfile = async (updatedData: any) => {
    // Also refresh from storage to ensure we have the latest data
    const refreshedUser = await authService.getUser();
    if (refreshedUser) {
      setUserData(refreshedUser);
      console.log('Profile updated from storage:', refreshedUser);
    } else {
      // Fallback to updatedData if storage refresh fails
      setUserData(updatedData);
      console.log('Profile updated from prop:', updatedData);
    }
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

  const handleCenterSelect = (center: any) => {
    console.log('Center selected:', center);
    setSelectedCenter(center);
    setCurrentScreen('schedule-booking');
  };


  const handleScheduleBookingContinue = (bookingInfo: any) => {
    console.log('Continue to payment with booking data:', bookingInfo);
    setBookingData(bookingInfo);
    setCurrentScreen('schedule-payment');
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
          <ScrollView
            ref={onboardingScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
            scrollEnabled={currentOnboardingIndex < onboardingScreens.length - 1}
          >
            {onboardingScreens.map((screen, index) => (
              <View key={index} style={{ width: screenWidth }}>
                <OnboardingScreen
                  icon={screen.icon}
                  title={screen.title}
                  description={screen.description}
                  isActive={index === currentOnboardingIndex}
                  totalScreens={onboardingScreens.length}
                  currentIndex={index}
                  onNext={handleNext}
                  onSkip={handleSkip}
                  onGetStarted={handleSkip}
                />
              </View>
            ))}
          </ScrollView>
        );
      case 'user-choice':
        return (
          <UserChoiceScreen
            onCustomerPress={handleCustomerPress}
            onServiceOwnerPress={handleServiceOwnerPress}
          />
        );
      case 'auth':
        return userType === 'service-owner' ? (
          <OwnerAuthNavigator 
            onAuthSuccess={handleAuthSuccess}
            onBackToUserChoice={() => setCurrentScreen('user-choice')}
          />
        ) : (
          <AuthNavigator 
            onAuthSuccess={handleAuthSuccess}
            onBackToUserChoice={() => setCurrentScreen('user-choice')}
          />
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
            onChangePassword={handleChangePassword}
          />
        );
      case 'service-owner':
        return (
          <OwnerTabs
            userData={userData}
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
            onBack={() => {
              setFilteredCenters(null); // Clear filtered centers when going back
              setCurrentScreen('book-wash');
            }}
            onBookingConfirmed={handleBookingConfirmed}
            selectedLocation={selectedLocation}
            filteredCenters={filteredCenters}
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
            bookingData={bookingData}
          />
        );
      case 'payment-confirmed':
        return (
          <PaymentConfirmedScreen 
            onBack={() => setCurrentScreen('payment')}
            onViewBookingStatus={handleViewBookingStatus}
            onBackToHome={handleBackToHome}
            acceptedCenter={bookingData?.center || selectedCenter}
            bookingId={lastBookingId}
            bookingData={bookingData ? {
              date: bookingData.date,
              time: bookingData.time,
            } : undefined}
            totalAmount={paymentAmount}
            paymentStatus="Pending"
          />
        );
      case 'schedule-for-later':
        return (
          <ScheduleForLaterScreen 
            onBack={() => setCurrentScreen('book-wash')}
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
      case 'schedule-payment':
        return (
          <PaymentScreen 
            onBack={() => setCurrentScreen('schedule-booking')}
            onPaymentSuccess={handleSchedulePaymentSuccess}
            acceptedCenter={bookingData?.center || selectedCenter}
            bookingData={bookingData}
          />
        );
      case 'schedule-booking-payment-confirmed':
        return (
          <ScheduleBookingConfirmedScreen 
            onBack={() => setCurrentScreen('schedule-payment')}
            onViewBookingStatus={handleViewBookingStatus}
            onBackToHome={handleBackToHome}
            bookingData={bookingData ? {
              center: bookingData.center,
              date: bookingData.date,
              time: bookingData.time,
              bookingId: bookingData.bookingId,
            } : undefined}
            totalAmount={paymentAmount}
            paymentStatus="Pending"
          />
        );
      case 'booking-history':
        return (
          <BookingHistoryScreen onBack={() => setCurrentScreen('customer')} />
        );
      case 'profile':
        return (
          <ProfileScreen 
            key={`profile-${Date.now()}`} // Force remount when navigating to profile
            onBack={() => {
              // Refresh user data when going back
              authService.getUser().then(user => {
                if (user) {
                  setUserData(user);
                }
              });
              setCurrentScreen('customer');
            }}
            onEditProfile={handleEditProfile}
            onBookingHistory={() => setCurrentScreen('booking-history')}
            onHelpSupport={() => setCurrentScreen('help-support')}
            onSettings={() => setCurrentScreen('settings')}
            userData={userData}
            onRefresh={async () => {
              // Refresh user data from storage
              const user = await authService.getUser();
              if (user) {
                console.log('Refreshing userData in App:', user);
                setUserData(user);
              }
            }}
          />
        );
      case 'edit-profile':
        return (
          <EditProfileScreen 
            onBack={async () => {
              // Refresh user data before navigating back
              const refreshedUser = await authService.getUser();
              if (refreshedUser) {
                setUserData(refreshedUser);
              }
              setCurrentScreen('profile');
            }}
            onSaveProfile={handleSaveProfile}
            userData={userData}
            activeTab="account"
            onTabChange={(tab) => {
              // Handle tab navigation from edit profile screen
              if (tab === 'home') {
                setCurrentScreen('customer');
              } else if (tab === 'bookings') {
                setCurrentScreen('booking-history');
              } else if (tab === 'activity') {
                setCurrentScreen('notifications');
              } else if (tab === 'account') {
                setCurrentScreen('profile');
              }
            }}
          />
        );
      case 'change-password':
        return (
          <CreateNewPasswordScreen 
            onBack={() => setCurrentScreen('settings')}
            onResetPassword={async (newPassword, confirmPassword, currentPassword) => {
              try {
                if (!currentPassword) {
                  Alert.alert('Error', 'Please enter your current password');
                  return;
                }
                
                const result = await authService.changePassword(
                  currentPassword,
                  newPassword,
                  confirmPassword
                );
                
                if (result.success) {
                  Alert.alert(
                    'Success',
                    result.message || 'Password changed successfully!',
                    [
                      {
                        text: 'OK',
                        onPress: () => setCurrentScreen('settings'),
                      },
                    ]
                  );
                } else {
                  Alert.alert('Error', result.error || 'Failed to change password. Please try again.');
                }
              } catch (error) {
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
              }
            }}
            emailOrPhone={userData?.email || userData?.phoneNumber || ''}
            mode="change"
            showCurrentPassword={true}
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
    <StripeProvider 
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={MERCHANT_IDENTIFIER}
    >
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </StripeProvider>
  );
}

export default App;