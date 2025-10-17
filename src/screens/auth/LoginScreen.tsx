import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import BackButton from '../../components/ui/BackButton';

interface LoginScreenProps {
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onLogin,
  onRegister,
  onForgotPassword,
}) => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (authMethod === 'email' && email.trim() && password.trim()) {
      onLogin(email, password);
    } else if (authMethod === 'phone' && phone.trim() && password.trim()) {
      onLogin(phone, password);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isLoginEnabled = 
    (authMethod === 'email' && email.trim() && password.trim()) ||
    (authMethod === 'phone' && phone.trim() && password.trim());

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.touchableContainer}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Back Button */}
              <BackButton onPress={onBack} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Log in to your account</Text>
              </View>

              {/* Auth Method Selector */}
              <View style={styles.authMethodContainer}>
                <TouchableOpacity
                  style={[
                    styles.authMethodButton,
                    authMethod === 'email' && styles.authMethodButtonActive
                  ]}
                  onPress={() => setAuthMethod('email')}
                >
                  <Text style={[
                    styles.authMethodText,
                    authMethod === 'email' && styles.authMethodTextActive
                  ]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.authMethodButton,
                    authMethod === 'phone' && styles.authMethodButtonActive
                  ]}
                  onPress={() => setAuthMethod('phone')}
                >
                  <Text style={[
                    styles.authMethodText,
                    authMethod === 'phone' && styles.authMethodTextActive
                  ]}>
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Fields */}
              <View style={styles.inputContainer}>
                {authMethod === 'email' ? (
                  <View style={styles.inputField}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.iconText}>✉</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Email"
                      placeholderTextColor="#999999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                ) : (
                  <View style={styles.inputField}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.iconText}>📱</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Phone Number"
                      placeholderTextColor="#999999"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                )}

                <View style={styles.inputField}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔒</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Password"
                    placeholderTextColor="#999999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.iconText}>👁</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={onForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, !isLoginEnabled && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={!isLoginEnabled}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Create Account Section */}
              <View style={styles.createAccountContainer}>
                <Text style={styles.createAccountText}>Don't have an account?</Text>
                <TouchableOpacity
                  style={styles.createAccountButton}
                  onPress={onRegister}
                >
                  <Text style={styles.createAccountButtonText}>Create Account</Text>
                </TouchableOpacity>
              </View>

              {/* Terms and Privacy */}
              <View style={styles.legalContainer}>
                <Text style={styles.legalText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.legalLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.legalLink}>Privacy Policy</Text>
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  touchableContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  header: {
    marginBottom: 32,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 22,
  },
  authMethodContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  authMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  authMethodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  authMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'System',
  },
  authMethodTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'System',
  },
  eyeIcon: {
    marginLeft: 12,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
  },
  createAccountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  createAccountText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontFamily: 'System',
  },
  createAccountButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  legalContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 'auto',
    marginBottom: 60,
  },
  legalText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'System',
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: '#007AFF',
  },
});

export default LoginScreen;
