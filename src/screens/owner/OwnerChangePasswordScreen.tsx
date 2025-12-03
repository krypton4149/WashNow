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
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import authService from '../../services/authService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface Props {
  onBack?: () => void;
  onPasswordChanged?: () => void;
  onLogout?: () => void;
}

const OwnerChangePasswordScreen: React.FC<Props> = ({ onBack, onPasswordChanged, onLogout }) => {
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
          result.message || 'Password changed successfully. Please log in again.',
          [
            {
              text: 'OK',
              onPress: async () => {
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
                
                // Logout the user after password change
                try {
                  await authService.logoutOwner();
                } catch (logoutError) {
                  console.error('[OwnerChangePasswordScreen] Logout error:', logoutError);
                }
                
                // Call logout callback to navigate to login
                onLogout?.();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to change password. Please try again.');
      }
    } catch (error: any) {
      console.error('[OwnerChangePasswordScreen] Change password error:', error);
      Alert.alert(
        'Error',
        error?.message || 'An unexpected error occurred. Please try again.'
      );
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
        { backgroundColor: isMet ? colors.success || '#10B981' : colors.border }
      ]}>
        {isMet && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text style={[styles.requirementText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
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
        <View style={[styles.securityTipContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary || '#3B82F6'} />
          <Text style={[styles.securityTipText, { color: colors.textSecondary }]}>
            Use a strong, unique password that you don't use for other accounts. Consider using a password manager.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.updateButton,
            { 
              backgroundColor: (isFormValid() && !isLoading) ? BLUE_COLOR : colors.border 
            }
          ]}
          onPress={handleUpdatePassword}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.buttonText || '#FFFFFF'} />
          ) : (
            <Text style={[
              styles.updateButtonText,
              { color: (isFormValid() && !isLoading) ? (colors.buttonText || '#FFFFFF') : colors.textSecondary }
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
    paddingHorizontal: Platform.select({ ios: 18, android: 16 }),
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
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
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Platform.select({ ios: 10, android: 8 }),
    paddingHorizontal: Platform.select({ ios: 14, android: 12 }),
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_LARGE,
    fontFamily: FONTS.INTER_REGULAR,
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
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
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
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
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
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Platform.select({ ios: 22, android: 20 }),
    paddingTop: Platform.select({ ios: 16, android: 14 }),
    paddingBottom: Platform.select({ 
      ios: 80, // Extra padding for iOS devices (5.4", 6.1", 6.3", 6.4", 6.5", 6.7")
      android: 70 // Extra padding for Android devices (5.4", 5.5", 6.1", 6.3", 6.4", 6.5", 6.7")
    }),
  },
  updateButton: {
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    paddingVertical: Platform.select({ ios: 18, android: 16 }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
});

export default OwnerChangePasswordScreen;

