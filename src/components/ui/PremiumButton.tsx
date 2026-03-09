import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  TouchableOpacityProps,
  ActivityIndicator,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface PremiumButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
}

/**
 * High-end button with gradient support and haptic-ready interactions.
 */
export function PremiumButton({ 
  label, 
  loading, 
  variant = 'primary', 
  size = 'medium',
  icon,
  style,
  disabled,
  ...props 
}: PremiumButtonProps) {
  
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  
  return (
    <TouchableOpacity 
      activeOpacity={0.85} 
      style={[
        styles.btn, 
        styles[size], 
        isOutline && styles.btnOutline,
        (disabled || loading) && styles.disabled,
        style
      ]} 
      disabled={disabled || loading}
      {...props}
    >
      {isPrimary ? (
         <LinearGradient
            colors={colors.gradients.primary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
         />
      ) : null}

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={isOutline ? colors.brand.primary : '#fff'} size="small" />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={[
              styles.label, 
              styles[`${size}Label`],
              isOutline && styles.labelOutline
            ]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    // Gradient handled by LinearGradient
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    backgroundColor: 'transparent',
  },
  medium: {
    height: 54,
    paddingHorizontal: 24,
  },
  small: {
    height: 40,
    paddingHorizontal: 16,
  },
  large: {
    height: 64,
    paddingHorizontal: 32,
  },
  label: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  mediumLabel: {
    fontSize: 16,
  },
  smallLabel: {
    fontSize: 13,
  },
  largeLabel: {
    fontSize: 18,
  },
  labelOutline: {
    color: colors.brand.primary,
  },
  icon: {
    marginRight: 2,
  },
  disabled: {
    opacity: 0.6,
  }
});
