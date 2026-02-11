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

  const handleSendCode = async (emailOrPhone: string, method: 'email' | 'phone') => {
    if (method !== 'email') {
      Alert.alert('Not supported', 'Password reset is only available via email for now.');
      return;
    }
    setForgotPasswordData({ emailOrPhone, method });
    try {
      const result = await authService.requestForgotPassword(emailOrPhone);
      if (result.success) {
        Alert.alert(
          'Code Sent',
          result.message || 'A verification code has been sent to your email address.',
          [{ text: 'Continue', onPress: () => setCurrentScreen('create-new-password') }]
        );
      } else {
        Alert.alert(
          'Failed to Send Code',
          result.error || 'Please check your email and try again.',
          [
            { text: 'OK', style: 'cancel' as const },
            { text: 'Retry', onPress: () => handleSendCode(emailOrPhone, method) },
          ]
        );
      }
    } catch (error: any) {
      console.error('Send code error:', error);
      Alert.alert(
        'Failed to Send Code',
        error?.message || 'There was an error sending the verification code. Please try again.',
        [
          { text: 'OK', style: 'cancel' as const },
          { text: 'Retry', onPress: () => handleSendCode(emailOrPhone, method) },
        ]
      );
    }
  };

  const handleResetPassword = async (
    newPassword: string,
    confirmPassword: string,
    currentPassword?: string,
    verificationCode?: string
  ) => {
    const email = forgotPasswordData?.emailOrPhone;
    if (!email || forgotPasswordData?.method !== 'email') {
      Alert.alert('Error', 'Session expired. Please start the forgot password flow again.');
      setCurrentScreen('forgot-password');
      return;
    }
    if (!verificationCode || !verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code from your email.');
      return;
    }
    try {
      const result = await authService.resetPassword(email, verificationCode, newPassword, confirmPassword);
      if (result.success) {
        Alert.alert(
          'Password Reset Successful',
          result.message || 'Your password has been updated. You can now sign in with your new password.',
          [{ text: 'Sign In', onPress: () => { setForgotPasswordData(null); setCurrentScreen('login'); } }]
        );
      } else {
        Alert.alert('Password Reset Failed', result.error || 'Please check the code and try again.', [{ text: 'OK' }]);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Password Reset Failed',
        error?.message || 'There was an error updating your password. Please try again.',
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

