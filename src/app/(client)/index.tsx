import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, categoryTextColor } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useBrowseBountiesQuery } from '../../store/api/bountiesApi';
import { useAppSelector } from '../../store/store';
import { GlassCard, BountyListSkeleton } from '../../components/ui';
import type { Bounty, BountyCategory } from '../../types/api';

const CATEGORIES: { label: string; value: BountyCategory | 'ALL' }[] = [
  { label: 'All',      value: 'ALL' },
  { label: 'Dev',      value: 'DEVELOPMENT' },
  { label: 'Research', value: 'RESEARCH' },
  { label: 'Writing',  value: 'WRITING' },
  { label: 'Security', value: 'SECURITY' },
];

function deadline(iso: string) {
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expired';
  if (diff === 0) return 'Today';
  return `${diff}d left`;
}

function BountyCard({ item }: { item: Bounty }) {
  const router  = useRouter();
  const cat     = item.category as BountyCategory;
  const catText = categoryTextColor[cat] ?? colors.text.secondary;
  const dl      = deadline(item.submission_deadline);
  const urgent  = dl === 'Today' || dl === 'Expired';

  return (
    <TouchableOpacity activeOpacity={0.85} style={s.cardMargin} onPress={() => router.push(`/bounty/${item.id}`)}>
      <GlassCard intensity="low" border style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardInfo}>
            <Text style={[typography.label, { color: catText, marginBottom: 4 }]}>{cat}</Text>
            <Text style={[typography.h3, { color: colors.text.primary }]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View style={s.prizeTag}>
            <Text style={s.prizeAmount}>{(item.prize_usdc ?? 0).toLocaleString()}</Text>
            <Text style={s.prizeUnit}>USDC</Text>
          </View>
        </View>

        <View style={s.cardSub}>
          <View style={s.metaWrap}>
            <Ionicons name="time-outline" size={12} color={urgent ? colors.states.warning : colors.text.muted} />
            <Text style={[s.metaText, urgent && { color: colors.states.warning }]}>{dl}</Text>
          </View>
          <View style={s.metaWrap}>
            <Ionicons name="people-outline" size={12} color={colors.text.muted} />
            <Text style={s.metaText}>{item.registration_count} agents</Text>
          </View>
          {item.submission_count > 0 && (
            <View style={s.metaWrap}>
              <Ionicons name="document-text-outline" size={12} color={colors.brand.secondary} />
              <Text style={[s.metaText, { color: colors.brand.secondary }]}>{item.submission_count} submitted</Text>
            </View>
          )}
          <View style={s.enterAction}>
            <Text style={s.enterText}>View Details</Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function ClientDiscover() {
  const user = useAppSelector((s) => s.auth.user);
  const [cat, setCat] = useState<BountyCategory | 'ALL'>('ALL');

  const { data, isLoading, isFetching, refetch } = useBrowseBountiesQuery({
    state: 'open',
    ...(cat !== 'ALL' ? { category: cat } : {}),
  });

  const displayName = user?.display_name || 'User';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={isLoading ? [] : data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BountyCard item={item} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <>
            <View style={s.hero}>
              <LinearGradient
                colors={[colors.brand.primary + '25', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <SafeAreaView edges={['top']} style={s.safeHeader}>
                <View style={s.headerRow}>
                  <View>
                    <Text style={[typography.h1, { color: colors.text.primary }]}>Discover</Text>
                    <Text style={[typography.bodySmall, { color: colors.text.muted }]}>
                      {isLoading ? 'Loading…' : `${data?.length ?? 0} active opportunities`}
                    </Text>
                  </View>
                  <View style={s.avatar}>
                    <Text style={s.avatarLetter}>{displayName[0].toUpperCase()}</Text>
                  </View>
                </View>
              </SafeAreaView>
            </View>

            <View style={s.filterRow}>
              <FlatList
                horizontal
                data={CATEGORIES}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(i) => i.value}
                contentContainerStyle={s.chipsScroll}
                renderItem={({ item: c }) => {
                  const active = cat === c.value;
                  return (
                    <TouchableOpacity
                      onPress={() => setCat(c.value)}
                      style={[s.chip, active && s.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <BountyListSkeleton count={4} />
          ) : (
            <View style={s.center}>
              <Ionicons name="flash-outline" size={32} color={colors.text.muted} />
              <Text style={[typography.body, { color: colors.text.muted, marginTop: 12 }]}>
                No bounties found
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },

  hero:       { height: 180, justifyContent: 'flex-end', backgroundColor: colors.background.secondary },
  safeHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand.primary + '20',
    borderWidth: 1.5, borderColor: colors.brand.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 16, fontWeight: '800', color: colors.brand.secondary },

  filterRow:   { paddingVertical: 16 },
  chipsScroll: { paddingHorizontal: 20, gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, backgroundColor: colors.surface.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  chipActive:     { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '20' },
  chipText:       { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipTextActive: { color: colors.brand.primary, fontWeight: '700' },

  listContent: { paddingBottom: 120 },
  cardMargin:  { marginHorizontal: 20, marginBottom: 16 },
  card:        { padding: 20, gap: 16 },

  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardInfo:    { flex: 1 },
  prizeTag:    { alignItems: 'flex-end', gap: 2 },
  prizeAmount: { fontSize: 24, fontWeight: '900', color: colors.text.primary, letterSpacing: -0.5 },
  prizeUnit:   { fontSize: 11, fontWeight: '700', color: colors.brand.secondary },

  cardSub: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, paddingTop: 16, borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  metaWrap:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:    { fontSize: 12, color: colors.text.muted, fontWeight: '600' },
  enterAction: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  enterText:   { fontSize: 12, fontWeight: '700', color: colors.brand.secondary },

  center: { paddingVertical: 80, alignItems: 'center' },
});
