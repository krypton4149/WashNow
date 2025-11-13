import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import BackButton from '../../components/ui/BackButton';
import { platformEdges } from '../../utils/responsive';

interface PhoneOTPVerificationScreenProps {
  onBack: () => void;
  onVerify: (otp: string) => void;
  onResendCode: () => void;
  phoneNumber: string;
}

const PhoneOTPVerificationScreen: React.FC<PhoneOTPVerificationScreenProps> = ({
  onBack,
  onVerify,
  onResendCode,
  phoneNumber,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(10);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Focus on first input when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [resendCountdown]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus on the last filled input or the next empty one
      const lastFilledIndex = pastedOtp.findIndex(digit => !digit) - 1;
      const focusIndex = lastFilledIndex >= 0 ? lastFilledIndex : pastedOtp.length - 1;
      if (focusIndex < 5 && inputRefs.current[focusIndex + 1]) {
        inputRefs.current[focusIndex + 1].focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields are filled
    const updatedOtp = [...newOtp];
    updatedOtp[index] = value;
    if (updatedOtp.every(digit => digit !== '') && updatedOtp.join('').length === 6) {
      handleVerify(updatedOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input when backspace is pressed on empty field
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpToVerify = otpCode || otp.join('');
    
    if (otpToVerify.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await onVerify(otpToVerify);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      await onResendCode();
      // Reset countdown after successful resend
      setResendCountdown(10);
      setCanResend(false);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isOtpComplete = otp.every(digit => digit !== '') && otp.join('').length === 6;

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.touchableContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <BackButton onPress={onBack} />
                <Text style={styles.title}>Verify Phone Number</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit verification code to{'\n'}
                  <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                </Text>
              </View>

              {/* OTP Input Fields */}
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Enter Verification Code</Text>
                <View style={styles.otpInputContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        if (ref) {
                          inputRefs.current[index] = ref;
                        }
                      }}
                      style={[
                        styles.otpInput,
                        digit ? styles.otpInputFilled : null,
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      textAlign="center"
                      autoCorrect={false}
                      autoCapitalize="none"
                    />
                  ))}
                </View>
              </View>

              {/* Resend Code */}
              <TouchableOpacity
                style={styles.resendContainer}
                onPress={handleResendCode}
                disabled={isLoading || !canResend}
              >
                <Text style={[
                  styles.resendText, 
                  (isLoading || !canResend) && styles.resendTextDisabled
                ]}>
                  {isLoading 
                    ? 'Sending...' 
                    : canResend 
                      ? "Didn't receive the code? Resend"
                      : `Resend code in ${resendCountdown}s`
                  }
                </Text>
              </TouchableOpacity>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  !isOtpComplete && styles.verifyButtonDisabled,
                ]}
                onPress={() => handleVerify()}
                disabled={!isOtpComplete || isLoading}
              >
                <Text style={[
                  styles.verifyButtonText,
                  !isOtpComplete && styles.verifyButtonTextDisabled,
                ]}>
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
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
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 40,
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
  phoneNumber: {
    fontWeight: '600',
    color: '#000000',
  },
  otpContainer: {
    marginBottom: 32,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    fontFamily: 'System',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
  verifyButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  verifyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  verifyButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default PhoneOTPVerificationScreen;
