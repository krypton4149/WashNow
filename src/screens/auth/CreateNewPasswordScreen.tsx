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
  ImageBackground,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface CreateNewPasswordScreenProps {
  onBack: () => void;
  onResetPassword: (newPassword: string, confirmPassword: string, currentPassword?: string, verificationCode?: string) => void;
  emailOrPhone: string;
  mode?: 'reset' | 'change';
  showCurrentPassword?: boolean;
}

const CreateNewPasswordScreen: React.FC<CreateNewPasswordScreenProps> = ({
  onBack,
  onResetPassword,
  emailOrPhone,
  mode = 'reset',
  showCurrentPassword = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPasswordField, setShowCurrentPasswordField] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = () => {
    if (showCurrentPassword && !currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (isResetMode && !verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code sent to your email');
      return;
    }
    if (newPassword.trim() && confirmPassword.trim()) {
      if (newPassword === confirmPassword) {
        onResetPassword(
          newPassword,
          confirmPassword,
          showCurrentPassword ? currentPassword : undefined,
          isResetMode ? verificationCode.trim() : undefined
        );
      } else {
        Alert.alert('Error', 'Passwords do not match');
      }
    }
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  const isPasswordValid = (password: string) =>
    password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

  const isResetEnabled =
    (!showCurrentPassword || currentPassword.trim()) &&
    (!isResetMode || verificationCode.trim()) &&
    newPassword.trim() &&
    confirmPassword.trim() &&
    newPassword === confirmPassword &&
    isPasswordValid(newPassword);

  const isResetMode = mode === 'reset';
  const hasMinLength = newPassword.length >= 8;
  const hasUpperAndLower = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Top section - same as Forgot Password */}
        <View style={[styles.topSection, styles.topSectionPadding]}>
          <ImageBackground
            source={require('../../assets/images/Car.png')}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            imageStyle={{ resizeMode: 'cover', opacity: 1.0 }}
          >
            <View style={styles.gradientOverlay} />
            <TouchableOpacity
              style={styles.backButton}
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
                <Text style={styles.title}>
                  {mode === 'change' ? 'Change Password' : 'Create new password'}
                </Text>
                <Text style={styles.subtitle}>
                  {mode === 'change'
                    ? 'Update your password to keep your account secure'
                    : 'Enter the code we sent to your email and choose a new password'}
                </Text>
              </View>

              {/* Pre-filled email (reset mode) */}
              {isResetMode && emailOrPhone ? (
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[styles.inputField, styles.inputFieldDisabled]}>
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={emailOrPhone}
                      editable={false}
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              ) : null}

              {/* Password requirements - compact */}
              <View style={styles.requirementsWrap}>
                <Text style={styles.requirementsTitle}>Your password must contain:</Text>
                <View style={styles.requirementsList}>
                  <Text style={[styles.requirementText, hasMinLength && styles.requirementTextValid]}>
                    • At least 8 characters
                  </Text>
                  <Text style={[styles.requirementText, hasUpperAndLower && styles.requirementTextValid]}>
                    • Upper and lowercase letters
                  </Text>
                  <Text style={[styles.requirementText, hasNumber && styles.requirementTextValid]}>
                    • At least one number
                  </Text>
                </View>
              </View>

              <View style={styles.inputsContainer}>
                {isResetMode && (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Verification code</Text>
                    <View style={styles.inputField}>
                      <Ionicons name="keypad-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter code from email"
                        placeholderTextColor="#9CA3AF"
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        maxLength={8}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                {showCurrentPassword && (
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Current Password</Text>
                    <View style={styles.inputField}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter current password"
                        placeholderTextColor="#9CA3AF"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrentPasswordField}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowCurrentPasswordField(!showCurrentPasswordField)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name={showCurrentPasswordField ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter new password"
                      placeholderTextColor="#9CA3AF"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <View style={styles.inputField}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm new password"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, !isResetEnabled && styles.primaryButtonDisabled]}
                onPress={handleResetPassword}
                disabled={!isResetEnabled}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {mode === 'change' ? 'Change Password' : 'Reset Password'}
                </Text>
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
    height: '28%',
    position: 'relative',
  },
  topSectionPadding: {
    paddingTop: Platform.select({ ios: 50, android: 40 }),
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 88, 168, 0.15)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.select({ ios: 58, android: 48 }),
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
    marginBottom: 24,
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
  requirementsWrap: {
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: FONT_SIZES.BODY_PRIMARY,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
    marginBottom: 8,
  },
  requirementsList: {
    gap: 4,
  },
  requirementText: {
    fontSize: FONT_SIZES.BODY_SECONDARY_LARGE,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  requirementTextValid: {
    color: '#059669',
    fontWeight: '500',
  },
  inputsContainer: {
    marginBottom: 18,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
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
  inputFieldDisabled: {
    backgroundColor: '#F9FAFB',
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
  primaryButton: {
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
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
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

export default CreateNewPasswordScreen;
