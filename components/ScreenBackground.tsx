import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors } from '@/constants/theme';

interface ScreenBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// A single decorative star: position is given as percentages so the field
// scales across screen sizes. Kept very low-opacity and non-animated.
interface Star {
  top: string;
  left: string;
  size: number;
  opacity: number;
}

// Fixed, scattered positions. Hand-tuned so the field reads as a subtle
// sprinkle rather than a grid. ~22 stars.
const STARS: Star[] = [
  { top: '4%', left: '12%', size: 2, opacity: 0.18 },
  { top: '7%', left: '78%', size: 3, opacity: 0.22 },
  { top: '11%', left: '40%', size: 2, opacity: 0.14 },
  { top: '15%', left: '88%', size: 2, opacity: 0.2 },
  { top: '18%', left: '22%', size: 3, opacity: 0.16 },
  { top: '23%', left: '60%', size: 2, opacity: 0.12 },
  { top: '28%', left: '8%', size: 2, opacity: 0.2 },
  { top: '32%', left: '92%', size: 3, opacity: 0.15 },
  { top: '37%', left: '48%', size: 2, opacity: 0.13 },
  { top: '42%', left: '30%', size: 2, opacity: 0.18 },
  { top: '47%', left: '82%', size: 2, opacity: 0.16 },
  { top: '52%', left: '15%', size: 3, opacity: 0.14 },
  { top: '57%', left: '66%', size: 2, opacity: 0.2 },
  { top: '62%', left: '38%', size: 2, opacity: 0.12 },
  { top: '66%', left: '90%', size: 2, opacity: 0.17 },
  { top: '71%', left: '20%', size: 3, opacity: 0.15 },
  { top: '76%', left: '54%', size: 2, opacity: 0.13 },
  { top: '80%', left: '84%', size: 2, opacity: 0.18 },
  { top: '85%', left: '10%', size: 2, opacity: 0.16 },
  { top: '89%', left: '44%', size: 3, opacity: 0.14 },
  { top: '93%', left: '72%', size: 2, opacity: 0.2 },
  { top: '96%', left: '28%', size: 2, opacity: 0.12 },
];

/**
 * Standard screen wrapper: renders the brand gradient with a subtle static
 * starfield behind {children}. Drop-in replacement for the bare
 * `<LinearGradient colors={[...]} style={styles.container}>` previously used
 * on each screen.
 */
export default function ScreenBackground({ children, style }: ScreenBackgroundProps) {
  return (
    <LinearGradient
      colors={gradientColors as unknown as readonly [string, string, ...string[]]}
      style={style}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map((star, index) => (
          <View
            key={index}
            style={[
              styles.star,
              {
                top: star.top as `${number}%`,
                left: star.left as `${number}%`,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
});
