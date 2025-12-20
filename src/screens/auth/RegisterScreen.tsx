import React, { useState, useCallback, useMemo } from 'react';
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
import { validateRegistrationForm, FormErrors } from '../../utils/validation';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const UK_COUNTRY_CODE = '+44';

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
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [carmake, setCarmake] = useState('');
  const [carmodel, setCarmodel] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Memoize the car image source to prevent re-renders
  const carImageSource = useMemo(() => require('../../assets/images/Car.png'), []);

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

    // Ensure phone number has UK country code
    let finalPhoneNumber = phoneNumber.trim();
    if (!finalPhoneNumber.startsWith('+44')) {
      // Remove any leading 0 or country code and add +44
      finalPhoneNumber = finalPhoneNumber.replace(/^0+/, '').replace(/^\+?44\s*/, '');
      finalPhoneNumber = UK_COUNTRY_CODE + finalPhoneNumber;
    }
    
    const userData = {
      fullName: fullName.trim(),
      email: email.trim(),
      phoneNumber: finalPhoneNumber,
      carmake: carmake.trim(),
      carmodel: carmodel.trim(),
      vehicle_no: vehicleNo.trim(),
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
        if (validationErrors.carmake) {
          apiErrors.carmake = Array.isArray(validationErrors.carmake) ? validationErrors.carmake[0] : String(validationErrors.carmake);
          console.log('✅ Mapped carmake error:', apiErrors.carmake);
        }
        if (validationErrors.carmodel) {
          apiErrors.carmodel = Array.isArray(validationErrors.carmodel) ? validationErrors.carmodel[0] : String(validationErrors.carmodel);
          console.log('✅ Mapped carmodel error:', apiErrors.carmodel);
        }
        if (validationErrors.vehicle_no) {
          apiErrors.vehicle_no = Array.isArray(validationErrors.vehicle_no) ? validationErrors.vehicle_no[0] : String(validationErrors.vehicle_no);
          console.log('✅ Mapped vehicle_no error:', apiErrors.vehicle_no);
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

  const handleInputChange = useCallback((field: string, value: string) => {
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field as keyof FormErrors]) {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      }
      return prev;
    });

    switch (field) {
      case 'name':
        setFullName(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        // For phone, value is already digits only from the input handler
        // Always prepend +44 if there are digits
        const phoneDigits = value.replace(/\D/g, '');
        setPhoneNumber(phoneDigits ? UK_COUNTRY_CODE + phoneDigits : '');
        break;
      case 'carmake':
        setCarmake(value);
        break;
      case 'carmodel':
        setCarmodel(value);
        break;
      case 'vehicle_no':
        setVehicleNo(value.toUpperCase());
        break;
      case 'password':
        setPassword(value);
        break;
      case 'password_confirmation':
        setConfirmPassword(value);
        break;
    }
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const isFormValid = useMemo(() => 
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    phoneNumber.startsWith('+44') &&
    phoneNumber.replace(/^\+44/, '').length === 10 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password === confirmPassword &&
    agreeToTerms,
    [fullName, email, phoneNumber, password, confirmPassword, agreeToTerms]
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.topSection, { paddingTop: insets.top }]}>
          <ImageBackground
            source={carImageSource}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            blurRadius={0}
            imageStyle={{ resizeMode: 'cover' }}
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
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>
                  Join us for premium car wash services
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.inputsContainer}>
                {/* Full Name Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={[styles.inputField, errors.name && styles.inputFieldError]}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={(value) => handleInputChange('name', value)}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Email Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={[styles.inputField, errors.email && styles.inputFieldError]}>
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Phone Number Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Phone Number (UK)</Text>
                  <View style={[styles.inputField, errors.phone && styles.inputFieldError]}>
                    <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <Text style={styles.countryCode}>+44</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="7XXXXXXXXX"
                      placeholderTextColor="#9CA3AF"
                      value={phoneNumber.startsWith('+44') ? phoneNumber.substring(3) : ''}
                      onChangeText={(value) => {
                        // Only allow digits, max 10 digits (UK phone number length)
                        const digitsOnly = value.replace(/\D/g, '').substring(0, 10);
                        handleInputChange('phone', digitsOnly);
                      }}
                      keyboardType="phone-pad"
                      autoCorrect={false}
                      maxLength={10}
                    />
                  </View>
                  {errors.phone ? (
                    <Text style={styles.errorText}>{errors.phone}</Text>
                  ) : (
                    <Text style={styles.helperText}>Phone number must include UK country code (+44)</Text>
                  )}
                </View>

                {/* Car Make Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Car Make</Text>
                  <View style={[styles.inputField, errors.carmake && styles.inputFieldError]}>
                    <Ionicons name="car-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter car make (e.g., Toyota, Honda)"
                      placeholderTextColor="#9CA3AF"
                      value={carmake}
                      onChangeText={(value) => handleInputChange('carmake', value)}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.carmake && <Text style={styles.errorText}>{errors.carmake}</Text>}
                </View>

                {/* Car Model Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Car Model</Text>
                  <View style={[styles.inputField, errors.carmodel && styles.inputFieldError]}>
                    <Ionicons name="car-sport-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter car model (e.g., Camry, Civic)"
                      placeholderTextColor="#9CA3AF"
                      value={carmodel}
                      onChangeText={(value) => handleInputChange('carmodel', value)}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.carmodel && <Text style={styles.errorText}>{errors.carmodel}</Text>}
                </View>

                {/* Vehicle Number Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Vehicle Number</Text>
                  <View style={[styles.inputField, errors.vehicle_no && styles.inputFieldError]}>
                    <Ionicons name="document-text-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter vehicle registration number"
                      placeholderTextColor="#9CA3AF"
                      value={vehicleNo}
                      onChangeText={(value) => handleInputChange('vehicle_no', value)}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.vehicle_no && <Text style={styles.errorText}>{errors.vehicle_no}</Text>}
                </View>

                {/* Password Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.inputField, errors.password && styles.inputFieldError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your password"
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
                        color="#9CA3AF" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Confirm Password Field */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[styles.inputField, errors.password_confirmation && styles.inputFieldError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm your password"
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
                        color="#9CA3AF" 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password_confirmation && <Text style={styles.errorText}>{errors.password_confirmation}</Text>}
                </View>
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
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.createAccountButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginQuestion}>Already have an account? </Text>
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
    backgroundColor: 'rgba(3, 88, 168, 0.2)',
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
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    color: '#666666',
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: FONTS.INTER_REGULAR,
  },
  inputsContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: FONTS.INTER_MEDIUM,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    minHeight: 40,
  },
  inputFieldError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  countryCode: {
    fontSize: FONT_SIZES.BODY_LARGE,
    color: '#1A1A1A',
    fontFamily: FONTS.INTER_REGULAR,
    marginRight: 8,
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_LARGE,
    color: '#1A1A1A',
    fontFamily: FONTS.INTER_REGULAR,
  },
  helperText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: FONTS.INTER_REGULAR,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    color: '#EF4444',
    marginTop: 6,
    fontFamily: FONTS.INTER_MEDIUM,
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
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#666666',
    lineHeight: 20,
    fontFamily: FONTS.INTER_REGULAR,
  },
  termsLink: {
    color: BLUE_COLOR,
    fontWeight: '700',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  createAccountButton: {
    backgroundColor: BLUE_COLOR,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 48,
  },
  createAccountButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.BUTTON_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginQuestion: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    color: '#666666',
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
  },
  loginLink: {
    fontSize: FONT_SIZES.BUTTON_SMALL,
    color: BLUE_COLOR,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
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
    fontSize: FONT_SIZES.CAPTION_SMALL,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
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

export default RegisterScreen;