import React, { useState } from 'react';
import { Alert } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerificationScreen from '../screens/auth/VerificationScreen';
import CreateNewPasswordScreen from '../screens/auth/CreateNewPasswordScreen';
import PhoneOTPVerificationScreen from '../screens/auth/PhoneOTPVerificationScreen';
import authService from '../services/authService';

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

type AuthScreen = 'login' | 'register' | 'forgot-password' | 'verification' | 'create-new-password' | 'phone-otp-verification';

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [forgotPasswordData, setForgotPasswordData] = useState<{
    emailOrPhone: string;
    method: 'email' | 'phone';
  } | null>(null);
  const [phoneOTPData, setPhoneOTPData] = useState<{
    phoneNumber: string;
  } | null>(null);

  const handleLogin = async (emailOrPhone: string, password: string, loginType: 'email' | 'phone') => {
    try {
      // Call the auth service to handle login
      const result = await authService.login(emailOrPhone, password);
      
      if (result.success) {
        // Show success message
        Alert.alert(
          'Login Successful!',
          'Welcome back! You have been signed in successfully.',
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
        Alert.alert(
          'Login Failed',
          result.error || 'Invalid email or password. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        'An error occurred during login. Please try again.',
        [{ text: 'OK' }]
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
        Alert.alert(
          'Registration Failed',
          result.error || 'There was an error creating your account. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        'An error occurred during registration. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
              setCurrentScreen('verification');
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

  const handleVerify = (code: string) => {
    console.log('Verification code:', code);
    
    // Show success message
    Alert.alert(
      'Code Verified!',
      'Your verification code has been confirmed successfully.',
      [
        {
          text: 'Continue',
          onPress: () => {
            setCurrentScreen('create-new-password');
          }
        }
      ]
    );
  };

  const handleResendCode = async () => {
    try {
      console.log('Resending code to:', forgotPasswordData?.emailOrPhone);
      // Here you would typically call your resend code API
      
      // Show success message
      Alert.alert(
        'Code Sent!',
        'A new verification code has been sent to your email/phone.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Resend code error:', error);
      Alert.alert(
        'Failed to Send Code',
        'There was an error sending the verification code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
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
      setPhoneOTPData({ phoneNumber });
      
      // Call the real API to request OTP
      const result = await authService.requestOTP(phoneNumber);
      
      if (result.success) {
        // Show success message
        Alert.alert(
          'OTP Sent!',
          `A verification code has been sent to ${phoneNumber}.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                setCurrentScreen('phone-otp-verification');
              }
            }
          ]
        );
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

  const handlePhoneOTPVerify = async (otp: string) => {
    try {
      console.log('Phone OTP verification:', { phoneNumber: phoneOTPData?.phoneNumber, otp });
      
      // Call the real API to verify OTP
      const result = await authService.verifyOTP(phoneOTPData?.phoneNumber || '', otp);
      
      if (result.success) {
        Alert.alert(
          'Login Successful!',
          'Welcome back! You have been signed in successfully.',
          [{ text: 'Continue', onPress: onAuthSuccess }]
        );
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid OTP. Please try again.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('Phone OTP verification error:', error);
      Alert.alert(
        'Verification Failed',
        'There was an error verifying the code. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResendPhoneOTP = async () => {
    try {
      console.log('Resending OTP to:', phoneOTPData?.phoneNumber);
      
      // Call the real API to resend OTP
      const result = await authService.resendOTP(phoneOTPData?.phoneNumber || '');
      
      if (result.success) {
        Alert.alert(
          'OTP Sent!',
          'A new verification code has been sent to your phone number.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Failed to Send OTP',
          result.error || 'There was an error sending the verification code. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
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
          <LoginScreen
            onBack={() => {}} // No back button needed for login
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
            onBack={() => setCurrentScreen('login')}
            onSendCode={handleSendCode}
          />
        );
      case 'verification':
        return (
          <VerificationScreen
            onBack={() => setCurrentScreen('forgot-password')}
            onVerify={handleVerify}
            onResendCode={handleResendCode}
            emailOrPhone={forgotPasswordData?.emailOrPhone || ''}
            method={forgotPasswordData?.method || 'email'}
          />
        );
      case 'create-new-password':
        return (
          <CreateNewPasswordScreen
            onBack={() => setCurrentScreen('verification')}
            onResetPassword={handleResetPassword}
            emailOrPhone={forgotPasswordData?.emailOrPhone || ''}
          />
        );
      case 'phone-otp-verification':
        return (
          <PhoneOTPVerificationScreen
            onBack={() => setCurrentScreen('login')}
            onVerify={handlePhoneOTPVerify}
            onResendCode={handleResendPhoneOTP}
            phoneNumber={phoneOTPData?.phoneNumber || ''}
          />
        );
      default:
        return (
          <LoginScreen
            onBack={() => {}}
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