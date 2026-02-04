import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { FONT_SIZES } from '../../utils/fonts';
import authService from '../../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onBack?: () => void;
  onPasswordChanged?: () => void;
}

const ChangePasswordScreen: React.FC<Props> = ({ onBack, onPasswordChanged }) => {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkPasswordRequirements = (password: string) => {
    setPasswordRequirements({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    });
  };

  const handleNewPasswordChange = (password: string) => {
    setNewPassword(password);
    checkPasswordRequirements(password);
  };

  const isFormValid = () => {
    return (
      currentPassword.length > 0 &&
      newPassword.length > 0 &&
      confirmPassword.length > 0 &&
      newPassword === confirmPassword &&
      Object.values(passwordRequirements).every(req => req)
    );
  };

  const handleUpdatePassword = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill all fields and ensure password requirements are met.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.changeOwnerPassword(currentPassword, newPassword, confirmPassword);
      
      if (result.success) {
        Alert.alert(
          'Success',
          result.message || 'Password updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordRequirements({
                  minLength: false,
                  hasUppercase: false,
                  hasLowercase: false,
                  hasNumber: false,
                });
                onPasswordChanged?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    showPassword: boolean,
    onToggleVisibility: () => void
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequirement = (text: string, isMet: boolean) => (
    <View key={text} style={styles.requirementRow}>
      <View style={[
        styles.requirementIcon,
        { backgroundColor: isMet ? colors.success : colors.border }
      ]}>
        {isMet && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text style={[styles.requirementText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Update your password to keep your account secure.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPasswordInput(
          'Current Password',
          'Enter current password',
          currentPassword,
          setCurrentPassword,
          showCurrentPassword,
          () => setShowCurrentPassword(!showCurrentPassword)
        )}

        {renderPasswordInput(
          'New Password',
          'Enter new password',
          newPassword,
          handleNewPasswordChange,
          showNewPassword,
          () => setShowNewPassword(!showNewPassword)
        )}

        {/* Password Requirements */}
        {newPassword.length > 0 && (
          <View style={[styles.requirementsContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.requirementsTitle, { color: colors.text }]}>
              Password must contain:
            </Text>
            {renderRequirement('At least 8 characters', passwordRequirements.minLength)}
            {renderRequirement('One uppercase letter', passwordRequirements.hasUppercase)}
            {renderRequirement('One lowercase letter', passwordRequirements.hasLowercase)}
            {renderRequirement('One number', passwordRequirements.hasNumber)}
          </View>
        )}

        {renderPasswordInput(
          'Confirm New Password',
          'Re-enter new password',
          confirmPassword,
          setConfirmPassword,
          showConfirmPassword,
          () => setShowConfirmPassword(!showConfirmPassword)
        )}

        {/* Security Tip */}
        <View style={[styles.securityTipContainer, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.securityTipText}>
            Use a strong, unique password that you don't use for other accounts. Consider using a password manager.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <View style={styles.previewContainer}>
          <TouchableOpacity style={[styles.previewButton, { backgroundColor: colors.border }]}>
            <Text style={[styles.previewButtonText, { color: colors.text }]}>Preview</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[
            styles.updateButton,
            { backgroundColor: (isFormValid() && !isLoading) ? colors.button : colors.border }
          ]}
          onPress={handleUpdatePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[
              styles.updateButtonText,
              { color: colors.buttonText }
            ]}>
              Update Password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.BODY_PRIMARY,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: FONT_SIZES.BODY_PRIMARY,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.SECTION_HEADING,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  requirementsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: FONT_SIZES.BODY_PRIMARY,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  requirementText: {
    fontSize: FONT_SIZES.BODY_PRIMARY,
  },
  securityTipContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    gap: 12,
    marginBottom: 20,
  },
  securityTipText: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    color: '#3B82F6',
    lineHeight: Math.round(FONT_SIZES.BODY_PRIMARY * 1.5),
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previewContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  previewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  previewButtonText: {
    fontSize: FONT_SIZES.BODY_PRIMARY,
    fontWeight: '500',
  },
  updateButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: FONT_SIZES.BUTTON_XL,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;
