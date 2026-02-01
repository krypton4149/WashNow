import React, { useState } from 'react';
import { Alert } from 'react-native';
import OwnerLoginScreen from '../screens/auth/OwnerLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import CreateNewPasswordScreen from '../screens/auth/CreateNewPasswordScreen';
import authService from '../services/authService';

interface OwnerAuthNavigatorProps {
  onAuthSuccess: () => void;
  onBackToUserChoice?: () => void;
}

type OwnerAuthScreen = 'login' | 'forgot-password' | 'create-new-password';

const OwnerAuthNavigator: React.FC<OwnerAuthNavigatorProps> = ({ onAuthSuccess, onBackToUserChoice }) => {
  const [currentScreen, setCurrentScreen] = useState<OwnerAuthScreen>('login');
  const [forgotPasswordData, setForgotPasswordData] = useState<{
    emailOrPhone: string;
    method: 'email' | 'phone';
  } | null>(null);
  const handleLogin = async () => {
    try {
      const storedUser = await authService.getUser();
      console.log('[OwnerAuthNavigator] stored user after login:', storedUser);
    } catch (error) {
      console.warn('[OwnerAuthNavigator] could not read stored user after login:', error);
    }
    onAuthSuccess();
  };

  const handleSendCode = (emailOrPhone: string, method: 'email' | 'phone') => {
    try {
      setForgotPasswordData({ emailOrPhone, method });
      
      // Show success message
      Alert.alert(
        'Code Sent!',
        `A verification code has been sent to your ${method === 'email' ? 'email address' : 'phone number'}.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              setCurrentScreen('create-new-password');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Send code error:', error);
      Alert.alert(
        'Failed to Send Code',
        'There was an error sending the verification code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResetPassword = async (newPassword: string, confirmPassword: string, currentPassword?: string) => {
    try {
      console.log('Password reset:', { newPassword, confirmPassword });
      // Here you would typically call your password reset API
      
      // Show success message
      Alert.alert(
        'Password Reset Successful!',
        'Your password has been updated successfully. You can now sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              setForgotPasswordData(null);
              setCurrentScreen('login');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Password Reset Failed',
        'There was an error updating your password. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSendOTP = async (phoneNumber: string) => {
    try {
      const result = await authService.requestOTP(phoneNumber);
      if (result.success) {
        Alert.alert('OTP Sent!', `A verification code has been sent to ${phoneNumber}.`, [{ text: 'OK' }]);
      } else {
        Alert.alert(
          'Failed to Send OTP',
          result.error || 'There was an error sending the verification code. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert(
        'Failed to Send OTP',
        'There was an error sending the verification code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <OwnerLoginScreen
            onBack={onBackToUserChoice || (() => {})}
            onLogin={handleLogin}
            onSendOTP={handleSendOTP}
            onForgotPassword={() => setCurrentScreen('forgot-password')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBack={() => setCurrentScreen('login')}
            onSendCode={handleSendCode}
          />
        );
      case 'create-new-password':
        return (
          <CreateNewPasswordScreen
            onBack={() => setCurrentScreen('forgot-password')}
            onResetPassword={handleResetPassword}
            emailOrPhone={forgotPasswordData?.emailOrPhone || ''}
          />
        );
      default:
        return (
          <OwnerLoginScreen
            onBack={onBackToUserChoice || (() => {})}
            onLogin={handleLogin}
            onSendOTP={handleSendOTP}
            onForgotPassword={() => setCurrentScreen('forgot-password')}
          />
        );
    }
  };

  return renderScreen();
};

export default OwnerAuthNavigator;

