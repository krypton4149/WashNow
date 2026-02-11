import React, { useState } from 'react';
import { Alert } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import CreateNewPasswordScreen from '../screens/auth/CreateNewPasswordScreen';
import authService from '../services/authService';

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
  onBackToUserChoice?: () => void;
}

type AuthScreen = 'login' | 'register' | 'forgot-password' | 'create-new-password';

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess, onBackToUserChoice }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [forgotPasswordData, setForgotPasswordData] = useState<{
    emailOrPhone: string;
    method: 'email' | 'phone';
  } | null>(null);
  const handleLogin = async (emailOrPhone: string, password: string, loginType: 'email' | 'phone') => {
    try {
      // Call the auth service to handle login
      const result = await authService.login(emailOrPhone, password);
      
      if (result.success) {
        // Directly proceed with authentication without showing success message
        onAuthSuccess();
      } else {
        const msg = result.error || 'Invalid email or password. Please try again.';
        const isNetworkOrTimeout = /timeout|network|internet|connection|taking too long/i.test(msg);
        Alert.alert(
          isNetworkOrTimeout ? 'Network Error' : 'Login Failed',
          msg,
          isNetworkOrTimeout
            ? [
                { text: 'OK', style: 'cancel' },
                { text: 'Retry', onPress: () => handleLogin(emailOrPhone, password, loginType) },
              ]
            : [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.message || error?.error || 'An error occurred during login. Please try again.';
      const isNetworkOrTimeout = /timeout|network|internet|connection|taking too long/i.test(errorMessage);
      Alert.alert(
        isNetworkOrTimeout ? 'Network Error' : 'Login Failed',
        errorMessage,
        isNetworkOrTimeout
          ? [
              { text: 'OK', style: 'cancel' },
              { text: 'Retry', onPress: () => handleLogin(emailOrPhone, password, loginType) },
            ]
          : [{ text: 'OK' }]
      );
    }
  };

  const handleRegister = async (userData: any) => {
    try {
      // Call the auth service to handle registration
      const result = await authService.register(userData);
      
      if (result.success) {
        // Show success message
        Alert.alert(
          'Registration Successful!',
          'Your account has been created successfully. Welcome to our car wash service!',
          [
            {
              text: 'Continue',
              onPress: () => {
                onAuthSuccess();
              }
            }
          ]
        );
      } else {
        // Debug: Log result for troubleshooting
        console.log('=== AUTH NAVIGATOR HANDLING RESULT ===');
        console.log('Registration Result:', {
          success: result.success,
          error: result.error,
          hasValidationErrors: !!result.validationErrors,
          validationErrors: result.validationErrors,
          validationErrorsKeys: result.validationErrors ? Object.keys(result.validationErrors) : null
        });
        
        // If there are validation errors, throw them so RegisterScreen can handle them
        if (result.validationErrors && Object.keys(result.validationErrors).length > 0) {
          console.log('✅ VALIDATION ERRORS DETECTED - Throwing to RegisterScreen');
          // Use a more descriptive error message if available
          const errorMessage = result.error && !result.error.toLowerCase().includes('validation failed') 
            ? result.error 
            : 'Please check the form fields for errors';
          const error: any = new Error(errorMessage);
          error.validationErrors = result.validationErrors;
          console.log('Throwing Error:', {
            message: errorMessage,
            validationErrors: error.validationErrors
          });
          throw error;
        } else {
          console.log('❌ NO VALIDATION ERRORS - Showing generic alert');
          const msg = result.error || 'There was an error creating your account. Please try again.';
          const isNetworkOrTimeout = /timeout|network|internet|connection|taking too long/i.test(msg);
          Alert.alert(
            isNetworkOrTimeout ? 'Network Error' : 'Registration Failed',
            msg,
            isNetworkOrTimeout
              ? [
                  { text: 'OK', style: 'cancel' },
                  { text: 'Retry', onPress: () => handleRegister(userData) },
                ]
              : [{ text: 'OK' }]
          );
        }
      }
    } catch (error: any) {
      // Only re-throw if it's a validation error (so RegisterScreen can handle it)
      if (error?.validationErrors) {
        throw error;
      }
      console.error('Registration error:', error);
      const errorMessage = error?.message || 'An error occurred during registration. Please try again.';
      const isNetworkOrTimeout = /timeout|network|internet|connection|taking too long/i.test(errorMessage);
      Alert.alert(
        isNetworkOrTimeout ? 'Network Error' : 'Registration Failed',
        errorMessage,
        isNetworkOrTimeout
          ? [
              { text: 'OK', style: 'cancel' },
              { text: 'Retry', onPress: () => handleRegister(userData) },
            ]
          : [{ text: 'OK' }]
      );
    }
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
    } catch (error: any) {
      console.error('Send OTP error:', error);
      Alert.alert(
        'Failed to Send OTP',
        error?.message || error?.error || 'There was an error sending the verification code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onBack={onBackToUserChoice || (() => {})}
            onLogin={handleLogin}
            onSendOTP={handleSendOTP}
            onRegister={() => setCurrentScreen('register')}
            onForgotPassword={() => setCurrentScreen('forgot-password')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onBack={() => setCurrentScreen('login')}
            onRegister={handleRegister}
            onLogin={() => setCurrentScreen('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            key="forgot-password"
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
          <LoginScreen
            onBack={onBackToUserChoice || (() => {})}
            onLogin={handleLogin}
            onSendOTP={handleSendOTP}
            onRegister={() => setCurrentScreen('register')}
            onForgotPassword={() => setCurrentScreen('forgot-password')}
          />
        );
    }
  };

  return renderScreen();
};

export default AuthNavigator;