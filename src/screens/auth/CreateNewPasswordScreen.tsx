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
  Alert,
} from 'react-native';
import BackButton from '../../components/ui/BackButton';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

interface CreateNewPasswordScreenProps {
  onBack: () => void;
  onResetPassword: (newPassword: string, confirmPassword: string, currentPassword?: string) => void;
  emailOrPhone: string;
  mode?: 'reset' | 'change'; // 'reset' for forgot password, 'change' for change password
  showCurrentPassword?: boolean; // Whether to show current password field
}

const CreateNewPasswordScreen: React.FC<CreateNewPasswordScreenProps> = ({
  onBack,
  onResetPassword,
  emailOrPhone,
  mode = 'reset',
  showCurrentPassword = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
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
    
    if (newPassword.trim() && confirmPassword.trim()) {
      if (newPassword === confirmPassword) {
        onResetPassword(newPassword, confirmPassword, showCurrentPassword ? currentPassword : undefined);
      } else {
        Alert.alert('Error', 'Passwords do not match');
      }
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isPasswordValid = (password: string) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password);
  };

  const isResetEnabled = 
    (!showCurrentPassword || currentPassword.trim()) &&
    newPassword.trim() && 
    confirmPassword.trim() && 
    newPassword === confirmPassword && 
    isPasswordValid(newPassword);

  const maskedEmailOrPhone = emailOrPhone.replace(/(.{3}).*(.{4})/, '$1***$2');

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

              {/* Success Icon - Only show for reset mode */}
              {mode === 'reset' && (
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                </View>
              )}

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {mode === 'change' ? 'Change Password' : 'Create new password'}
                </Text>
                <Text style={styles.subtitle}>
                  {mode === 'change' 
                    ? 'Update your password to keep your account secure'
                    : `Code verified for ${maskedEmailOrPhone}`}
                </Text>
              </View>

              {/* Password Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Your password must contain:</Text>
                <View style={styles.requirementsList}>
                  <View style={styles.requirementItem}>
                    <Text style={[
                      styles.requirementText,
                      newPassword.length >= 8 && styles.requirementTextValid
                    ]}>
                      • At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={[
                      styles.requirementText,
                      /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && styles.requirementTextValid
                    ]}>
                      • Upper and lowercase letters
                    </Text>
                  </View>
                  <View style={styles.requirementItem}>
                    <Text style={[
                      styles.requirementText,
                      /\d/.test(newPassword) && styles.requirementTextValid
                    ]}>
                      • At least one number
                    </Text>
                  </View>
                </View>
              </View>

              {/* Password Input Fields */}
              <View style={styles.inputContainer}>
                {showCurrentPassword && (
                  <View style={styles.inputField}>
                    <View style={styles.inputIcon}>
                      <Text style={styles.iconText}>🔒</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Current Password"
                      placeholderTextColor="#999999"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPasswordField}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowCurrentPasswordField(!showCurrentPasswordField)}
                    >
                      <Text style={styles.iconText}>👁</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.inputField}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.iconText}>🔒</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="New Password"
                    placeholderTextColor="#999999"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
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
                    placeholder="Confirm New Password"
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

              {/* Reset Password Button */}
              <TouchableOpacity
                style={[styles.resetButton, !isResetEnabled && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={!isResetEnabled}
              >
                <Text style={styles.resetButtonText}>
                  {mode === 'change' ? 'Change Password' : 'Reset Password'}
                </Text>
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
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 20 : 0,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: FONT_SIZES.SCREEN_TITLE_LARGE,
    color: '#059669',
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    ...TEXT_STYLES.screenTitleBold,
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT_STYLES.bodyPrimary,
    color: '#666666',
    textAlign: 'center',
  },
  requirementsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  requirementsTitle: {
    ...TEXT_STYLES.sectionHeadingMedium,
    color: '#000000',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    ...TEXT_STYLES.bodyPrimary,
    color: '#666666',
  },
  requirementTextValid: {
    color: '#059669',
    ...TEXT_STYLES.cardTitle,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  iconText: {
    fontSize: FONT_SIZES.SECTION_HEADING,
  },
  textInput: {
    flex: 1,
    ...TEXT_STYLES.input,
    color: '#000000',
  },
  eyeIcon: {
    marginLeft: 12,
  },
  resetButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  resetButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  resetButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
});

export default CreateNewPasswordScreen;

