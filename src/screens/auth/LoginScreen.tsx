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
  Image,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (emailOrPhone: string, password: string, loginType: 'email' | 'phone') => void;
  onSendOTP: (phoneNumber: string) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onLogin,
  onSendOTP,
  onForgotPassword,
  onRegister,
}) => {
  const insets = useSafeAreaInsets();
  const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }
    
    // For email login, check both email and password
    if (email.trim() && password.trim()) {
      setIsLoading(true);
      // Support both sync and async handlers
      const maybePromise = onLogin(email.trim(), password.trim(), 'email');
      Promise.resolve(maybePromise)
        .catch(() => {})
        .finally(() => {
          // Safety net: if screen doesn't unmount (e.g., failed login), hide loader
          setIsLoading(false);
        });
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
              opacity: 1.0, // Ensure full opacity for better contrast
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
                <Text style={styles.title}>Welcome to KwikWash </Text>
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

             

              {/* OR Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerQuestion}>Don't have an account? </Text>
                <TouchableOpacity onPress={onRegister}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>

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
    backgroundColor: 'rgba(3, 88, 168, 0.15)', // Reduced opacity to show more of the image
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomWidth: 0,
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
    fontWeight: '700', // Increased from 600 to 700 for sharper text
    color: '#111827', // Darker for better contrast
    marginBottom: 8,
    fontFamily: FONTS.INTER_SEMIBOLD, // Changed to SEMIBOLD for sharper appearance
    includeFontPadding: false, // Remove extra padding for sharper text
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
    color: '#111827', // Darker for better contrast
    fontFamily: FONTS.INTER_MEDIUM, // Changed to MEDIUM for sharper appearance
    includeFontPadding: false, // Remove extra padding for sharper text
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
    fontWeight: '700', // Increased from 600 to 700 for sharper text
    fontFamily: FONTS.INTER_BOLD, // Changed to BOLD for sharper appearance
    includeFontPadding: false, // Remove extra padding for sharper text
    textAlignVertical: 'center',
  },
  otpLinkContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpLinkText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#666666',
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#9CA3AF',
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  registerQuestion: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    color: '#666666',
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
  },
  registerLink: {
    fontSize: FONT_SIZES.BUTTON_SMALL,
    color: BLUE_COLOR,
    fontWeight: '700', // Increased from 600 to 700 for sharper text
    fontFamily: FONTS.INTER_BOLD, // Changed to BOLD for sharper appearance
    includeFontPadding: false, // Remove extra padding for sharper text
    textAlignVertical: 'center',
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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

export default LoginScreen;