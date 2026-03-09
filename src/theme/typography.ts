import { StyleSheet, Platform } from 'react-native';

/**
 * Standardized typography system for Envoy
 * Aim: Elite, high-contrast, AI-native feel.
 */
export const typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '800',
    color: "white",
    letterSpacing: -1,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontWeight: '500',
    color: "white",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontVariant: ['tabular-nums'],
    fontSize: 12,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  }
});
