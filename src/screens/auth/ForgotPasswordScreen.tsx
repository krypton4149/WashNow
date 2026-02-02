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
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSendCode: (emailOrPhone: string, method: 'email' | 'phone') => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onSendCode,
}) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  const handleSendCode = () => {
    if (email.trim()) {
      onSendCode(email.trim(), 'email');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isSendEnabled = email.trim().length > 0;

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
              opacity: 1.0,
            }}
          >
            <View style={styles.gradientOverlay} />
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
              <View style={styles.header}>
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a code to reset your password
                </Text>
              </View>

              <View style={styles.inputsContainer}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.infoText}>
                We'll send a verification code to your email address
              </Text>

              <TouchableOpacity
                style={[styles.sendButton, !isSendEnabled && styles.sendButtonDisabled]}
                onPress={handleSendCode}
                disabled={!isSendEnabled}
                activeOpacity={0.8}
              >
                <Text style={styles.sendButtonText}>Send Code</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backToLoginContainer} onPress={onBack}>
                <Text style={styles.backToLoginText}>Back to login</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(3, 88, 168, 0.15)',
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
    ...TEXT_STYLES.screenTitleBold,
    color: BLUE_COLOR,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...TEXT_STYLES.sectionHeading,
    color: '#374151',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  inputsContainer: {
    marginBottom: 18,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    ...TEXT_STYLES.label,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
    marginBottom: 8,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    ...TEXT_STYLES.input,
    fontSize: FONT_SIZES.BODY_PRIMARY_LARGE,
    color: '#111827',
  },
  infoText: {
    ...TEXT_STYLES.bodySecondary,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  sendButton: {
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
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
  backToLoginContainer: {
    alignItems: 'center',
  },
  backToLoginText: {
    ...TEXT_STYLES.button,
    color: BLUE_COLOR,
  },
});

export default ForgotPasswordScreen;
