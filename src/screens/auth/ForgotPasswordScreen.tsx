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
import { platformEdges } from '../../utils/responsive';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSendCode: (emailOrPhone: string, method: 'email' | 'phone') => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onSendCode,
}) => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');

  const handleSendCode = () => {
    if (emailOrPhone.trim()) {
      onSendCode(emailOrPhone.trim(), method);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isSendEnabled = emailOrPhone.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
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
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email or phone number and we'll send you a code to reset your password
                </Text>
              </View>

              {/* Method Selector */}
              <View style={styles.methodContainer}>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    method === 'email' && styles.methodButtonActive
                  ]}
                  onPress={() => setMethod('email')}
                >
                  <Text style={[
                    styles.methodText,
                    method === 'email' && styles.methodTextActive
                  ]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodButton,
                    method === 'phone' && styles.methodButtonActive
                  ]}
                  onPress={() => setMethod('phone')}
                >
                  <Text style={[
                    styles.methodText,
                    method === 'phone' && styles.methodTextActive
                  ]}>
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Field */}
              <View style={styles.inputField}>
                <View style={styles.inputIcon}>
                  <Text style={styles.iconText}>
                    {method === 'email' ? '✉' : '📱'}
                  </Text>
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder={method === 'email' ? 'Email' : 'Phone Number'}
                  placeholderTextColor="#999999"
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Information Text */}
              <Text style={styles.infoText}>
                We'll send a verification code to your {method === 'email' ? 'email address' : 'phone number'}
              </Text>

              {/* Send Code Button */}
              <TouchableOpacity
                style={[styles.sendButton, !isSendEnabled && styles.sendButtonDisabled]}
                onPress={handleSendCode}
                disabled={!isSendEnabled}
              >
                <Text style={styles.sendButtonText}>Send Code</Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <TouchableOpacity style={styles.backToLoginContainer} onPress={onBack}>
                <Text style={styles.backToLoginText}>Back to login</Text>
              </TouchableOpacity>
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
    paddingHorizontal: Platform.select({ ios: 26, android: 24 }),
    paddingBottom: Platform.select({ ios: 20, android: 20 }),
  },
  header: {
    marginBottom: Platform.select({ ios: 36, android: 32 }),
    paddingTop: Platform.select({ ios: 12, android: 8 }),
  },
  title: {
    fontSize: Platform.select({ ios: 30, android: 28 }),
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: Platform.select({ ios: -0.6, android: -0.5 }),
    lineHeight: Platform.select({ ios: 38, android: 36 }),
  },
  subtitle: {
    fontSize: Platform.select({ ios: 17, android: 16 }),
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: Platform.select({ ios: 24, android: 22 }),
  },
  methodContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    padding: 4,
    marginBottom: Platform.select({ ios: 26, android: 24 }),
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
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
  methodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    fontFamily: 'System',
  },
  methodTextActive: {
    color: '#000000',
    fontWeight: '600',
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
  infoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'System',
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
});

export default ForgotPasswordScreen;

