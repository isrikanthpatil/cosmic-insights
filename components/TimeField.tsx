import React from 'react';
import { TextInput, StyleSheet, StyleProp, TextStyle } from 'react-native';

interface TimeFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
}

// Auto-format the HH:MM portion: strip non-digits and insert a colon.
// Produces 24-hour HH:MM which matches SecurityUtils.validateTime.
const formatTime = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4); // HHMM
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export default function TimeField({
  value,
  onChangeText,
  style,
  placeholder = '10:30',
}: TimeFieldProps) {
  const handleChange = (text: string) => {
    onChangeText(formatTime(text));
  };

  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={handleChange}
      placeholder={placeholder}
      placeholderTextColor="#666"
      keyboardType="number-pad"
      maxLength={5}
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
