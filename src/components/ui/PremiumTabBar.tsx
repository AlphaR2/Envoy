import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '../../theme/colors'

interface PremiumTabBarProps extends BottomTabBarProps {
  activeColor: string
  /** Label shown beneath the center CTA button */
  centerLabel?: string
  /** Icon shown inside the center CTA button */
  centerIcon?: keyof typeof Ionicons.glyphMap
  /** Second gradient stop for the center button */
  centerGradientEnd?: string
}

export function PremiumTabBar({
  state,
  descriptors,
  navigation,
  activeColor,
  centerLabel = 'Create',
  centerIcon = 'add',
  centerGradientEnd,
}: PremiumTabBarProps) {
  const gradEnd = centerGradientEnd ?? activeColor + 'BB'

  return (
    <View style={styles.container}>
      <BlurView intensity={85} tint="dark" style={styles.blur}>
        {/* Top accent line */}
        <LinearGradient
          colors={['transparent', activeColor + '55', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topLine}
        />

        <View style={styles.content}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]

            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                  ? options.title
                  : route.name

            const isFocused = state.index === index

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
            }

            const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key })

            // ── Center CTA 
            if (route.name === 'create') {
              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.centerTab}
                  activeOpacity={0.78}
                >
                  <View style={[styles.centerGlowRing, { borderColor: activeColor + '45' }]}>
                    <LinearGradient
                      colors={[gradEnd, "black"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.centerCircle}
                    >
                      <Ionicons name={centerIcon} size={26} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={[styles.centerLabel, { color: isFocused ? activeColor : 'white' }]}>{centerLabel}</Text>
                </TouchableOpacity>
              )
            }

            // ── Regular tab ─────────────────────────────────────────────
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrap}>
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color: isFocused ? activeColor : colors.text.muted,
                    size: 23,
                  })}
                </View>
                <Text style={[styles.label, { color: isFocused ? colors.text.primary : colors.text.muted }]}>
                  {label as string}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 16,
    right: 16,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 13, 43, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
      },
      android: { elevation: 14 },
    }),
  },
  blur: { flex: 1 },

  topLine: { height: 1 },

  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  /* ── Regular tabs ── */
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    width: 32,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  /* ── Center CTA ── */
  centerTab: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4,
  },
  centerGlowRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
    }),
  },
  centerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
})
