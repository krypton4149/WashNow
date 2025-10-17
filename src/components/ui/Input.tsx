import React from 'react';
import {
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  autoFocus?: boolean;
  maxLength?: number;
  returnKeyType?: 'done' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoFocus = false,
  maxLength,
  returnKeyType = 'done',
  onSubmitEditing,
  style,
  textStyle,
}) => {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholder={placeholder}
      placeholderTextColor="#999999"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoFocus={autoFocus}
      maxLength={maxLength}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
      blurOnSubmit={false}
      textStyle={textStyle}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 56,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#000000',
    fontFamily: 'System',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
});

export default Input;
