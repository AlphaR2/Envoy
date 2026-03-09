import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  border?: boolean;
}

/**
 * A premium Glassmorphism-style card with subtle transparency
 * and highlighted borders.
 */
export function GlassCard({ children, intensity = 'medium', border = true, style, ...props }: GlassCardProps) {
  const opacities = {
    low: '04',
    medium: '08',
    high: '15',
  };

  return (
    // Outer wrapper: clipping + border-radius only — no layout props here
    <View style={styles.container}>
      {/* Inner glass surface: receives style so padding/gap/alignment from callers work */}
      <View
        style={[
          styles.glass,
          { backgroundColor: `rgba(255, 255, 255, 0.${opacities[intensity]})` },
          border && styles.border,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  glass: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
