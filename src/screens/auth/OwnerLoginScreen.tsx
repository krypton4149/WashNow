import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { API_URL } from '../../config/env';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface OwnerLoginScreenProps {
  onBack: () => void;
  onLogin: (emailOrPhone: string, password: string, loginType: 'email' | 'phone') => void;
  onSendOTP: (phoneNumber: string) => void;
  onForgotPassword: () => void;
}

const OwnerLoginScreen: React.FC<OwnerLoginScreenProps> = ({
  onBack,
  onLogin,
  onSendOTP,
  onForgotPassword,
}) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Validate email
    if (!trimmedEmail) {
      setEmailError('Email is required');
      return;
    }
    
    // Validate password
    if (!trimmedPassword) {
      setPasswordError('Password is required');
      return;
    }

    setIsLoading(true);

    // Use the same pattern as authService - API_URL + endpoint path
    // Add timeout handling for better network error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    try {
      // Use FormData instead of JSON (as per API requirements)
      const formData = new FormData();
      formData.append('email', trimmedEmail);
      formData.append('password', trimmedPassword);

      const response = await fetch(`${API_URL}/api/v1/auth/user/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData as any,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is valid (status 0 usually means network error)
      if (!response || response.status === 0) {
        throw new Error('Network Error - Please check your internet connection');
      }

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch (parseError) {
        responseData = null;
      }

      console.log('Owner login raw response:', responseData);

      const payload = responseData?.data || responseData;
      
      // Check for actual success indicators: token or user data
      const hasToken = payload?.token || payload?.access_token || payload?.jwt || responseData?.token || responseData?.access_token || responseData?.jwt;
      const hasUserData = payload?.user || payload?.userData || payload?.owner || payload?.profile || payload;
      
      // Determine if login was successful
      // Success if: HTTP OK AND (explicit success flag OR we have token/user data)
      // This handles cases where API returns inconsistent success flags
      const explicitSuccess = response.ok && responseData?.success === true;
      // If we have token or user data, treat as success even if success flag is false
      const hasDataSuccess = response.ok && (hasToken || hasUserData);
      const isSuccess = explicitSuccess || hasDataSuccess;
      
      if (!isSuccess) {
        const errorMessage =
          responseData?.message ||
          responseData?.error ||
          'Login failed. Please check your credentials.';
        
        // If error message says "success" but we're treating it as failure,
        // check if HTTP was OK - if so, try to proceed anyway (data might be in unexpected format)
        const messageLower = errorMessage.toLowerCase();
        const messageIndicatesSuccess = messageLower.includes('success') || messageLower.includes('successful');
        
        if (messageIndicatesSuccess && response.ok) {
          // Message says success and HTTP is OK - try to proceed even without explicit data
          // The data extraction below might still work
          console.warn('API returned success message with HTTP 200 but no explicit token/user data found, attempting to proceed');
          // Don't return - continue to data extraction below
        } else {
          // Normal error case - show error and return
          if (messageIndicatesSuccess) {
            // Message contradicts the failure - show a clear error
            console.error('API returned contradictory response: success message but HTTP error or no data');
            Alert.alert('Login Error', 'Unable to complete login. Please try again.');
          } else {
            Alert.alert('Login Failed', errorMessage);
          }
          setIsLoading(false);
          return;
        }
      }
      console.log('Owner login parsed payload:', payload);
      const userPayload =
        payload?.user ||
        payload?.userData ||
        payload?.owner ||
        payload?.profile ||
        payload;

      const ownerUser = {
        id:
          userPayload?.id?.toString() ||
          userPayload?.user_id?.toString() ||
          userPayload?.owner_id?.toString() ||
          'owner-1',
        name:
          userPayload?.name ||
          userPayload?.fullName ||
          userPayload?.full_name ||
          userPayload?.ownerName ||
          userPayload?.owner_name ||
          trimmedEmail,
        email: userPayload?.email || trimmedEmail,
        phone:
          userPayload?.phone ||
          userPayload?.phoneNumber ||
          userPayload?.phone_number ||
          '',
        address:
          userPayload?.address ||
          userPayload?.business_address ||
          userPayload?.location ||
          '',
        type: userPayload?.type || userPayload?.role || 'service-owner',
        loginType: userPayload?.loginType || payload?.loginType || 'owner',
        businessName:
          userPayload?.businessName ||
          userPayload?.business_name ||
          userPayload?.shopName ||
          userPayload?.companyName ||
          userPayload?.company_name ||
          userPayload?.name ||
          '',
        ownerName:
          userPayload?.ownerName ||
          userPayload?.owner_name ||
          userPayload?.contactName ||
          userPayload?.contact_name ||
          userPayload?.contactPerson ||
          userPayload?.contact_person ||
          userPayload?.name ||
          '',
        rawUserData: userPayload,
        userData: userPayload,
        bookingsList: payload?.bookingsList || userPayload?.bookingsList || null,
        booking_status_totals: payload?.bookingsList?.booking_status_totals || userPayload?.bookingsList?.booking_status_totals || null,
        token: payload?.token || payload?.access_token || payload?.jwt || null,
      };

      if (ownerUser.token) {
        await authService.setToken(ownerUser.token);
      }

      await authService.setUser(ownerUser);

      // Invoke the original callback so navigation can continue
      const maybePromise = onLogin(trimmedEmail, trimmedPassword, 'email');
      await Promise.resolve(maybePromise);
    } catch (error: any) {
      clearTimeout(timeoutId); // Ensure timeout is cleared on error
      console.error('Owner login error:', error);
      // Provide more specific error messages
      let errorMessage = 'Unable to reach the server. Please try again.';
      
      // Handle timeout errors
      if (error?.name === 'AbortError') {
        errorMessage = 'Request timeout. Please check your internet connection and try again.';
      } else if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Network request failed. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      } else if (error?.name === 'TypeError' && error?.message?.includes('Network')) {
        errorMessage = 'Network request failed. Please check your internet connection and try again.';
      }
      
      Alert.alert('Network Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <ImageBackground
            source={require('../../assets/images/Car.png')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            blurRadius={0}
            imageStyle={{ 
              resizeMode: 'cover',
              opacity: 1.0, // Ensure full opacity for better visibility
            }}
          >
            <View style={styles.gradientOverlay} />
            {/* Back Button */}
            <TouchableOpacity 
              style={[styles.backButton, { top: insets.top + 10 }]} 
              onPress={onBack}
            >
              <View style={styles.backButtonCircle}>
                <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
          </ImageBackground>
        </View>

        <ScrollView 
          style={styles.bottomSection}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.formContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Welcome to KwikWash</Text>
                <Text style={styles.subtitle}>
                  Sign in to your account to continue
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.inputsContainer}>
                {/* Email Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[styles.inputField, emailError && styles.inputFieldError]}>
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                </View>

                {/* Password Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.inputField, passwordError && styles.inputFieldError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color="#9CA3AF" 
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={onForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.loginButton, (!isFormValid || isLoading) && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Terms of Service */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Overlay loader */}
      {isLoading && (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.overlayText}>Please wait…</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  topSection: {
    height: '35%',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 88, 168, 0.1)', // Reduced opacity to show more of the image
  },
  backButton: {
    position: 'absolute',
    left: Platform.select({ ios: 22, android: 20 }),
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(156, 163, 175, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -35,
    left: '50%',
    marginLeft: -35,
    zIndex: 20,
    overflow: 'visible',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: BLUE_COLOR,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingTop: 30,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: Platform.select({ ios: 50, android: 40 }),
  },
  formContainer: {
    paddingHorizontal: Platform.select({ ios: 26, android: 24 }),
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.HEADING_LARGE + 2,
    fontWeight: '800',
    color: BLUE_COLOR,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: FONTS.MONTserrat_BOLD,
    letterSpacing: -0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.BODY_MEDIUM + 1,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: FONTS.INTER_SEMIBOLD,
    includeFontPadding: false,
    textAlignVertical: 'center',
    letterSpacing: 0.1,
  },
  inputsContainer: {
    marginBottom: 18,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    fontFamily: FONTS.INTER_SEMIBOLD,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFieldError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_LARGE,
    color: '#111827',
    fontFamily: FONTS.INTER_MEDIUM,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  errorText: {
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    color: '#EF4444',
    marginTop: 6,
    fontFamily: FONTS.INTER_MEDIUM,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.BUTTON_SMALL,
    color: BLUE_COLOR,
    fontWeight: '500',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  loginButton: {
    backgroundColor: BLUE_COLOR,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  termsText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    color: '#999999',
    textAlign: 'center',
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 18,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBox: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayText: {
    marginTop: 10,
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#111827',
    fontFamily: FONTS.INTER_REGULAR,
  },
});

export default OwnerLoginScreen;




