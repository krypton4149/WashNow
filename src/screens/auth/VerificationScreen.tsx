import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import BackButton from '../../components/ui/BackButton';
import { platformEdges } from '../../utils/responsive';

interface VerificationScreenProps {
  onBack: () => void;
  onVerify: (code: string) => void;
  onResendCode: () => void;
  emailOrPhone: string;
  method: 'email' | 'phone';
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({
  onBack,
  onVerify,
  onResendCode,
  emailOrPhone,
  method,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all fields are filled
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (verificationCode?: string) => {
    const finalCode = verificationCode || code.join('');
    if (finalCode.length === 6) {
      onVerify(finalCode);
    } else {
      Alert.alert('Invalid Code', 'Please enter a complete 6-digit code');
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await onResendCode();
      Alert.alert('Code Sent', 'A new verification code has been sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isVerifyEnabled = code.every(digit => digit !== '') && code.join('').length === 6;

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <View style={styles.content}>
        {/* Back Button */}
        <BackButton onPress={onBack} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a code to {emailOrPhone}
          </Text>
        </View>

        {/* Code Input Fields */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={styles.codeInput}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity 
            onPress={handleResendCode}
            disabled={isResending}
          >
            <Text style={[styles.resendLink, isResending && styles.resendLinkDisabled]}>
              {isResending ? 'Sending...' : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, !isVerifyEnabled && styles.verifyButtonDisabled]}
          onPress={() => handleVerify()}
          disabled={!isVerifyEnabled}
        >
          <Text style={styles.verifyButtonText}>Verify</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    marginBottom: 48,
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  codeInput: {
    width: 45,
    height: 55,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontFamily: 'System',
  },
  resendLink: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontFamily: 'System',
  },
  resendLinkDisabled: {
    color: '#CCCCCC',
  },
  verifyButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default VerificationScreen;

