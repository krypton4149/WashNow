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

interface CreateNewPasswordScreenProps {
  onBack: () => void;
  onResetPassword: (newPassword: string, confirmPassword: string) => void;
  emailOrPhone: string;
}

const CreateNewPasswordScreen: React.FC<CreateNewPasswordScreenProps> = ({
  onBack,
  onResetPassword,
  emailOrPhone,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = () => {
    if (newPassword.trim() && confirmPassword.trim()) {
      if (newPassword === confirmPassword) {
        onResetPassword(newPassword, confirmPassword);
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
    newPassword.trim() && 
    confirmPassword.trim() && 
    newPassword === confirmPassword && 
    isPasswordValid(newPassword);

  const maskedEmailOrPhone = emailOrPhone.replace(/(.{3}).*(.{4})/, '$1***$2');

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

              {/* Success Icon */}
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Create new password</Text>
                <Text style={styles.subtitle}>
                  Code verified for {maskedEmailOrPhone}
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
                <Text style={styles.resetButtonText}>Reset Password</Text>
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
    fontSize: 40,
    color: '#059669',
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    fontFamily: 'System',
    letterSpacing: -0.5,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    fontFamily: 'System',
    lineHeight: 22,
    textAlign: 'center',
  },
  requirementsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    fontFamily: 'System',
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
  },
  requirementTextValid: {
    color: '#059669',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 32,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default CreateNewPasswordScreen;
