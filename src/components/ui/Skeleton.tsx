import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

// ─── Base shimmer bone ────────────────────────────────────────────────────────
interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.surface.elevated2, opacity }, style]}
    />
  );
}

// ─── Bounty card skeleton ──────────────────────────────────────────────────────
export function BountyCardSkeleton() {
  return (
    <View style={s.wrap}>
      <View style={s.card}>
        {/* Top row: info + prize */}
        <View style={s.row}>
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width={64} height={10} borderRadius={5} />
            <Skeleton width="90%" height={18} borderRadius={6} />
            <Skeleton width="65%" height={14} borderRadius={6} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Skeleton width={14} height={14} borderRadius={4} />
            <Skeleton width={72} height={28} borderRadius={6} />
            <Skeleton width={36} height={10} borderRadius={4} />
          </View>
        </View>
        {/* Divider */}
        <View style={s.divider} />
        {/* Bottom row: meta + button */}
        <View style={[s.row, { gap: 14 }]}>
          <Skeleton width={72} height={12} borderRadius={4} />
          <Skeleton width={60} height={12} borderRadius={4} />
          <View style={{ marginLeft: 'auto' }}>
            <Skeleton width={68} height={32} borderRadius={10} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Agent card skeleton ───────────────────────────────────────────────────────
export function AgentCardSkeleton() {
  return (
    <View style={s.wrap}>
      <View style={s.card}>
        {/* Status row */}
        <View style={s.row}>
          <Skeleton width={90} height={10} borderRadius={4} />
          <Skeleton width={18} height={14} borderRadius={4} />
        </View>
        {/* Name + tags */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <Skeleton height={20} borderRadius={6} />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Skeleton width={72} height={22} borderRadius={6} />
            <Skeleton width={72} height={22} borderRadius={6} />
          </View>
        </View>
        {/* Divider */}
        <View style={s.divider} />
        {/* Metrics + button */}
        <View style={[s.row, { gap: 14 }]}>
          <View style={{ gap: 4 }}>
            <Skeleton width={40} height={10} borderRadius={4} />
            <Skeleton width={48} height={16} borderRadius={4} />
          </View>
          <View style={s.metricLine} />
          <View style={{ gap: 4 }}>
            <Skeleton width={44} height={10} borderRadius={4} />
            <Skeleton width={44} height={16} borderRadius={4} />
          </View>
          <View style={{ marginLeft: 'auto' }}>
            <Skeleton width={72} height={36} borderRadius={10} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Profile hero skeleton ─────────────────────────────────────────────────────
export function ProfileHeroSkeleton() {
  return (
    <View style={s.profileHero}>
      <Skeleton width={96} height={96} borderRadius={48} />
      <View style={{ marginTop: 16, gap: 10, alignItems: 'center' }}>
        <Skeleton width={160} height={24} borderRadius={8} />
        <Skeleton width={110} height={14} borderRadius={6} />
        <Skeleton width={140} height={30} borderRadius={20} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

// ─── Inline list of N bounty skeletons (convenience) ──────────────────────────
export function BountyListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <BountyCardSkeleton key={i} />
      ))}
    </>
  );
}

export function AgentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  wrap: { marginHorizontal: 20, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface.glass,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 14,
  },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  divider:   { height: 1, backgroundColor: colors.border.subtle },
  metricLine: { width: 1, height: 28, backgroundColor: colors.border.subtle, marginHorizontal: 4 },
  profileHero: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 24 },
});
