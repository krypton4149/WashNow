import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import UserChoiceScreen from './src/screens/user/UserChoiceScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import VerificationScreen from './src/screens/auth/VerificationScreen';
import CreateNewPasswordScreen from './src/screens/auth/CreateNewPasswordScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import BookCarWashScreen from './src/screens/book/BookCarWashScreen';
import AvailableNowScreen from './src/screens/book/AvailableNowScreen';
import BookingHistoryScreen from './src/screens/booking/BookingHistoryScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import HelpSupportScreen from './src/screens/support/HelpSupportScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import { ScreenType } from './src/types';

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('onboarding');
  const [currentOnboardingIndex, setCurrentOnboardingIndex] = useState(0);
  const [userType, setUserType] = useState<'customer' | 'service-owner' | null>(null);
  const [forgotPasswordData, setForgotPasswordData] = useState<{
    emailOrPhone: string;
    method: 'email' | 'phone';
  } | null>(null);

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
    setCurrentScreen('login');
  };

  const handleServiceOwnerPress = () => {
    setUserType('service-owner');
    setCurrentScreen('login');
  };

  const handleBookWash = () => {
    // Navigate to booking screen
    setCurrentScreen('book-wash');
  };

  const handleViewAll = () => {
    setCurrentScreen('booking-history');
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
      case 'login':
        return (
          <LoginScreen
            onBack={() => setCurrentScreen('user-choice')}
            onLogin={(email, password) => {
              console.log('Login with:', email, password);
              // Handle login logic here
              setCurrentScreen('customer');
            }}
            onRegister={() => setCurrentScreen('register')}
            onForgotPassword={() => setCurrentScreen('forgot-password')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onBack={() => setCurrentScreen('user-choice')}
            onRegister={(userData) => {
              console.log('Register with:', userData);
              // Handle registration logic here
              setCurrentScreen('customer');
            }}
            onLogin={() => setCurrentScreen('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={() => setCurrentScreen('login')}
            onSendCode={(emailOrPhone, method) => {
              setForgotPasswordData({ emailOrPhone, method });
              setCurrentScreen('verification');
            }}
          />
        );
      case 'verification':
        return (
          <VerificationScreen
            onBack={() => setCurrentScreen('forgot-password')}
            onVerify={(code) => {
              console.log('Verification code:', code);
              setCurrentScreen('create-new-password');
            }}
            onResendCode={() => {
              console.log('Resending code to:', forgotPasswordData?.emailOrPhone);
              // Handle resend code logic here
            }}
            emailOrPhone={forgotPasswordData?.emailOrPhone || ''}
            method={forgotPasswordData?.method || 'email'}
          />
        );
      case 'create-new-password':
        return (
          <CreateNewPasswordScreen
            onBack={() => setCurrentScreen('verification')}
            onResetPassword={(newPassword, confirmPassword) => {
              console.log('Password reset:', { newPassword, confirmPassword });
              // Handle password reset logic here
              setForgotPasswordData(null);
              setCurrentScreen('login');
            }}
            emailOrPhone={forgotPasswordData?.emailOrPhone || ''}
          />
        );
      case 'customer':
        return (
          <DashboardScreen
            onBookWash={handleBookWash}
            onViewAll={handleViewAll}
            onActivityPress={handleActivityPress}
            onNotificationPress={handleNotificationPress}
            onProfilePress={handleProfilePress}
          />
        );
      case 'book-wash':
        return (
          <BookCarWashScreen 
            onBack={() => setCurrentScreen('customer')}
            onNavigateToAvailableNow={() => setCurrentScreen('available-now')}
          />
        );
      case 'available-now':
        return (
          <AvailableNowScreen 
            onBack={() => setCurrentScreen('book-wash')}
            onBookService={() => console.log('Book service pressed')}
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
            onEditProfile={() => console.log('Edit profile pressed')}
            onBookingHistory={() => setCurrentScreen('booking-history')}
            onHelpSupport={() => setCurrentScreen('help-support')}
            onSettings={() => setCurrentScreen('settings')}
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
            onChangePassword={() => console.log('Change password pressed')}
            onLanguageChange={() => console.log('Language change pressed')}
            onLogout={() => setCurrentScreen('user-choice')}
            onDeleteAccount={() => console.log('Delete account pressed')}
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
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

export default App;