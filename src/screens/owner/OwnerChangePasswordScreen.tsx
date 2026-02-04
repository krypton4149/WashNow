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
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

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
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#9CA3AF"
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#000000" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Change Password</Text>
        </View>
        <View style={styles.backButton} />
      </View>
      <View style={styles.headerSubtitleContainer}>
        <Text style={styles.headerSubtitle}>
          Update your password to keep your account secure.
        </Text>
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

        {/* Password Requirements - Hidden in the image, so we'll keep it minimal or remove */}

        {renderPasswordInput(
          'Confirm New Password',
          'Re-enter new password',
          confirmPassword,
          setConfirmPassword,
          showConfirmPassword,
          () => setShowConfirmPassword(!showConfirmPassword)
        )}

        {/* Security Tip */}
        <View style={styles.securityTipContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.securityTipText}>
            Use a strong, unique password that you don't use for other accounts. Consider using a password manager.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.updateButton,
            { 
              backgroundColor: (isFormValid() && !isLoading) ? BLUE_COLOR : '#D1D5DB' 
            }
          ]}
          onPress={handleUpdatePassword}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.updateButtonText,
              { color: (isFormValid() && !isLoading) ? '#FFFFFF' : '#6B7280' }
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 18, android: 16 }),
    paddingTop: Platform.select({ ios: 12, android: 10 }),
    paddingBottom: Platform.select({ ios: 8, android: 6 }),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleRow: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.screenTitleSmall,
    color: '#1A1A1A',
  },
  headerSubtitleContainer: {
    paddingHorizontal: Platform.select({ ios: 18, android: 16 }),
    paddingTop: Platform.select({ ios: 4, android: 4 }),
    paddingBottom: Platform.select({ ios: 12, android: 10 }),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    marginBottom: 8,
    color: '#1A1A1A',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_LARGE,
    fontFamily: FONTS.INTER_REGULAR,
    paddingVertical: 0,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 4,
  },
  requirementsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  requirementsTitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    marginBottom: 12,
    color: '#1A1A1A',
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
    backgroundColor: '#E5E7EB',
  },
  requirementText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  securityTipContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  securityTipText: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: Math.round(FONT_SIZES.BODY_PRIMARY * 1.5),
    color: '#6B7280',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: Platform.select({ ios: 22, android: 20 }),
    paddingTop: Platform.select({ ios: 16, android: 14 }),
    paddingBottom: Platform.select({ 
      ios: 100,
      android: 90
    }),
  },
  updateButton: {
    borderRadius: 12,
    paddingVertical: 16,
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

