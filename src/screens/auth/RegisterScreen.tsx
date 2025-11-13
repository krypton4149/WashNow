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
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { validateRegistrationForm, FormErrors } from '../../utils/validation';
import { platformEdges } from '../../utils/responsive';

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (userData: any) => void;
  onLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onRegister,
  onLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleRegister = async () => {
    console.log('=== REGISTRATION START ===');
    console.log('Form Data Before Validation:', {
      fullName,
      email,
      phoneNumber,
      password: password ? '***' : '',
      confirmPassword: confirmPassword ? '***' : '',
      agreeToTerms
    });

    // Validate form using validation utility
    const validation = validateRegistrationForm({
      name: fullName,
      email: email,
      phone: phoneNumber,
      password: password,
      password_confirmation: confirmPassword,
    });

    console.log('Client-Side Validation Result:', {
      isValid: validation.isValid,
      errors: validation.errors
    });

    if (!validation.isValid) {
      console.log('❌ CLIENT-SIDE VALIDATION FAILED');
      setErrors(validation.errors);
      // Show first error in alert for better visibility
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        Alert.alert(
          'Validation Error',
          firstError,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    if (!agreeToTerms) {
      console.log('❌ TERMS NOT AGREED');
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    console.log('✅ CLIENT-SIDE VALIDATION PASSED');
    setIsLoading(true);
    setErrors({});

    const userData = {
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password: password.trim(),
      passwordConfirmation: confirmPassword.trim(), // Add password confirmation
    };

    console.log('Sending Registration Request:', {
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      password: userData.password ? '***' : '',
      passwordConfirmation: userData.passwordConfirmation ? '***' : ''
    });

    try {
      await onRegister(userData);
    } catch (error: any) {
      // Debug: Log error for troubleshooting
      console.log('=== REGISTERSCREEN ERROR HANDLING ===');
      console.log('Caught Error Object:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        validationErrors: error?.validationErrors,
        fullError: error
      });
      
      // Handle validation errors from API
      if (error?.validationErrors) {
        console.log('✅ VALIDATION ERRORS FOUND');
        const apiErrors: FormErrors = {};
        const validationErrors = error.validationErrors;
        
        // Debug: Log validation errors structure
        console.log('Raw Validation Errors:', validationErrors);
        console.log('Validation Errors Type:', typeof validationErrors);
        console.log('Validation Errors Keys:', Object.keys(validationErrors));
        
        // Map API error keys to form field names
        if (validationErrors.name) {
          apiErrors.name = Array.isArray(validationErrors.name) ? validationErrors.name[0] : String(validationErrors.name);
          console.log('✅ Mapped name error:', apiErrors.name);
        }
        if (validationErrors.email) {
          apiErrors.email = Array.isArray(validationErrors.email) ? validationErrors.email[0] : String(validationErrors.email);
          console.log('✅ Mapped email error:', apiErrors.email);
        }
        if (validationErrors.phone || validationErrors.phone_number) {
          const phoneError = validationErrors.phone || validationErrors.phone_number;
          apiErrors.phone = Array.isArray(phoneError) ? phoneError[0] : String(phoneError);
          console.log('✅ Mapped phone error:', apiErrors.phone);
        }
        if (validationErrors.password) {
          apiErrors.password = Array.isArray(validationErrors.password) ? validationErrors.password[0] : String(validationErrors.password);
          console.log('✅ Mapped password error:', apiErrors.password);
        }
        // Handle password_confirmation errors (map to password_confirmation field)
        if (validationErrors.password_confirmation) {
          apiErrors.password_confirmation = Array.isArray(validationErrors.password_confirmation) 
            ? validationErrors.password_confirmation[0] 
            : String(validationErrors.password_confirmation);
          console.log('✅ Mapped password_confirmation error:', apiErrors.password_confirmation);
        }
        // Handle device_token error (API requirement but not in our form)
        if (validationErrors.device_token) {
          console.log('⚠️ Device token error (API requirement):', validationErrors.device_token);
          // We can't show this in form, but we can log it
        }
        if (validationErrors.general) {
          console.log('✅ Found general error:', validationErrors.general);
        }
        
        // Debug: Log mapped errors
        console.log('Final Mapped Errors for Form:', apiErrors);
        console.log('Number of mapped errors:', Object.keys(apiErrors).length);
        
        setErrors(apiErrors);
        
        // Show first validation error in alert for visibility
        let errorToShow = null;
        
        // Priority: field-specific errors > general error > error message
        if (Object.keys(apiErrors).length > 0) {
          errorToShow = Object.values(apiErrors)[0];
          console.log('Using field-specific error for alert:', errorToShow);
        } else if (validationErrors.general) {
          errorToShow = Array.isArray(validationErrors.general) ? validationErrors.general[0] : String(validationErrors.general);
          console.log('Using general error for alert:', errorToShow);
        } else {
          errorToShow = error?.message || 'Please check all form fields and try again.';
          console.log('Using error message for alert:', errorToShow);
        }
        
        console.log('Showing Alert with message:', errorToShow);
        if (errorToShow) {
          Alert.alert(
            'Validation Error',
            errorToShow,
            [{ text: 'OK' }]
          );
        }
        console.log('=== REGISTRATION END (WITH VALIDATION ERRORS) ===');
      } else {
        console.log('❌ NO VALIDATION ERRORS - This is a non-validation error');
        console.error('Registration error (non-validation):', error);
        Alert.alert(
          'Registration Failed',
          error?.message || 'An error occurred during registration. Please try again.',
          [{ text: 'OK' }]
        );
        console.log('=== REGISTRATION END (WITH NON-VALIDATION ERROR) ===');
      }
    } finally {
      setIsLoading(false);
      console.log('=== REGISTRATION FINALLY BLOCK ===');
      console.log('Loading set to false');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    switch (field) {
      case 'name':
        setFullName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhoneNumber(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'password_confirmation':
        setConfirmPassword(value);
        break;
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isFormValid = 
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password === confirmPassword &&
    agreeToTerms;

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.topSection}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjB3YXNofGVufDF8fHx8MTc2MjM5ODkzN3ww&ixlib=rb-4.1.0&q=80&w=1080'
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            blurRadius={10}
          >
            <View style={styles.gradientOverlay} />
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <View style={styles.backButtonCircle}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            
            {/* App Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
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
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>
                  Join us for premium car wash services
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.inputsContainer}>
                {/* Full Name Field */}
                <View style={[styles.inputField, errors.name && styles.inputFieldError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={(value) => handleInputChange('name', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                {/* Email Field */}
                <View style={[styles.inputField, errors.email && styles.inputFieldError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* Phone Number Field */}
                <View style={[styles.inputField, errors.phone && styles.inputFieldError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Phone Number"
                    placeholderTextColor="#9CA3AF"
                    value={phoneNumber}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

                {/* Password Field */}
                <View style={[styles.inputField, errors.password && styles.inputFieldError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(value) => handleInputChange('password', value)}
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
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                {/* Confirm Password Field */}
                <View style={[styles.inputField, errors.password_confirmation && styles.inputFieldError]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={(value) => handleInputChange('password_confirmation', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password_confirmation && <Text style={styles.errorText}>{errors.password_confirmation}</Text>}
              </View>

              {/* Terms and Privacy */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                    {agreeToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {'\n'}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                style={[styles.createAccountButton, (!isFormValid || isLoading) && styles.createAccountButtonDisabled]}
                onPress={handleRegister}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.createAccountButtonText}>Create Account</Text>
                    <View style={styles.checkmarkCircle}>
                      <Ionicons name="checkmark" size={16} color="#000000" />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginQuestion}>ALREADY HAVE AN ACCOUNT?</Text>
                <TouchableOpacity onPress={onLogin}>
                  <Text style={styles.loginLink}>Sign in instead</Text>
                </TouchableOpacity>
              </View>

              {/* Security Indicators */}
              <View style={styles.securityContainer}>
                <View style={styles.securityItem}>
                  <View style={[styles.securityDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.securityText}>Secure</Text>
                </View>
                <View style={styles.securityItem}>
                  <View style={[styles.securityDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.securityText}>Encrypted</Text>
                </View>
                <View style={styles.securityItem}>
                  <View style={[styles.securityDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={styles.securityText}>Private</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Overlay loader while creating account */}
      {isLoading && (
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.overlayText}>Please wait…</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    height: '25%',
    position: 'relative',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
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
    bottom: -40,
    left: '50%',
    marginLeft: -40,
    zIndex: 20,
    overflow: 'visible',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -10,
    paddingTop: 65,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
    textAlign: 'center',
  },
  inputsContainer: {
    marginBottom: 24,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFieldError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#111827',
    fontWeight: '700',
  },
  createAccountButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createAccountButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  checkmarkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loginQuestion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  securityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 20,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  securityText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
    fontSize: 14,
    color: '#111827',
  },
});

export default RegisterScreen;