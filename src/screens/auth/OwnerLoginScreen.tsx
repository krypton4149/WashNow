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
import authService from '../../services/authService';
import { API_BASE_URL } from '../../services/api';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch (parseError) {
        responseData = null;
      }

      console.log('Owner login raw response:', responseData);

      if (!response.ok || responseData?.success === false) {
        const errorMessage =
          responseData?.message ||
          responseData?.error ||
          'Login failed. Please check your credentials.';
        Alert.alert('Login Failed', errorMessage);
        return;
      }

      const payload = responseData?.data || responseData;
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
      Alert.alert('Network Error', error?.message || 'Unable to reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
                <Text style={styles.title}>Welcome to CarWash</Text>
                <Text style={styles.subtitle}>
                  Sign in to your account to continue
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.inputsContainer}>
                {/* Email Field */}
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password Field */}
                <View style={styles.inputField}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
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
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <View style={styles.checkmarkCircle}>
                      <Ionicons name="checkmark" size={16} color="#000000" />
                    </View>
                  </>
                )}
              </TouchableOpacity>

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
      
      {/* Overlay loader */}
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
    marginBottom: 16,
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
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
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

export default OwnerLoginScreen;




