import React from 'react';
import { TextInput, StyleSheet, StyleProp, TextStyle } from 'react-native';

interface DateFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
}

// Format a raw string into DD/MM/YYYY by stripping non-digits and
// auto-inserting slashes as the user types.
const formatDate = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8); // DDMMYYYY
  const parts: string[] = [];
  if (digits.length >= 2) {
    parts.push(digits.slice(0, 2));
    if (digits.length >= 4) {
      parts.push(digits.slice(2, 4));
      if (digits.length > 4) {
        parts.push(digits.slice(4, 8));
      }
    } else if (digits.length > 2) {
      parts.push(digits.slice(2));
    }
  } else {
    parts.push(digits);
  }
  return parts.join('/');
};

export default function DateField({
  value,
  onChangeText,
  style,
  placeholder = 'DD/MM/YYYY',
}: DateFieldProps) {
  const handleChange = (text: string) => {
    onChangeText(formatDate(text));
  };

  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={handleChange}
      placeholder={placeholder}
      placeholderTextColor="#666"
      keyboardType="number-pad"
      maxLength={10}
      autoCorrect={false}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
