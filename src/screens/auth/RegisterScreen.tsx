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

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => void;
  onLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onRegister,
  onLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleRegister = () => {
    if (fullName.trim() && email.trim() && phone.trim() && password.trim() && confirmPassword.trim() && agreeToTerms) {
      onRegister({
        fullName,
        email,
        phone,
        password,
        confirmPassword,
      });
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isRegisterEnabled = 
    fullName.trim() && 
    email.trim() && 
    phone.trim() && 
    password.trim() && 
    confirmPassword.trim() && 
    agreeToTerms;

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
                <Text style={styles.title}>Create your account</Text>
                <Text style={styles.subtitle}>Join us to book premium car wash services</Text>
              </View>

              {/* Input Fields */}
              <View style={styles.inputContainer}>
                <View style={styles.inputField}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>👤</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Full Name"
                    placeholderTextColor="#999999"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>

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

                <View style={styles.inputField}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔒</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.iconText}>👁</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms and Privacy Agreement */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                  <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                    {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                style={[styles.createAccountButton, !isRegisterEnabled && styles.createAccountButtonDisabled]}
                onPress={handleRegister}
                disabled={!isRegisterEnabled}
              >
                <Text style={styles.createAccountButtonText}>Create Account</Text>
              </TouchableOpacity>

              {/* Login Prompt */}
              <View style={styles.loginPromptContainer}>
                <Text style={styles.loginPromptText}>Already have an account?</Text>
                <TouchableOpacity onPress={onLogin}>
                  <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
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
  inputContainer: {
    marginBottom: 24,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontFamily: 'System',
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  createAccountButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  createAccountButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  loginPromptContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 60,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontFamily: 'System',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default RegisterScreen;
