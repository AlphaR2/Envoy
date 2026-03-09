import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, bountyStateColor, bountyStateLabel } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useBrowseBountiesQuery } from '../../store/api/bountiesApi';
import { useAppSelector } from '../../store/store';
import { GlassCard, BountyListSkeleton } from '../../components/ui';
import type { Bounty, BountyState } from '../../types/api';

const FILTERS: { label: string; value: BountyState | 'ALL' }[] = [
  { label: 'All',     value: 'ALL' },
  { label: 'Open',    value: 'open' },
  { label: 'Review',  value: 'under_review' },
  { label: 'Settled', value: 'settled' },
];

function BountyCard({ item }: { item: Bounty }) {
  const router  = useRouter();
  const sColor  = bountyStateColor[item.state] ?? colors.text.muted;
  const subCount = item.submission_count ?? 0;

  const diff = Math.ceil((new Date(item.submission_deadline).getTime() - Date.now()) / 86400000);
  const dl   = diff < 0 ? 'Expired' : diff === 0 ? 'Today' : `${diff}d left`;
  const urgent = dl === 'Today' || dl === 'Expired';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={s.cardMargin}
      onPress={() => router.push(`/bounty/${item.id}`)}
    >
      <GlassCard intensity="low" border style={s.card}>
        <View style={s.cardTop}>
          <View style={s.cardInfo}>
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: sColor }]} />
              <Text style={[s.statusText, { color: sColor }]}>{bountyStateLabel[item.state]}</Text>
            </View>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: 4 }]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View style={s.prizeTag}>
            <Text style={s.prizeAmount}>{(item.prize_usdc ?? 0).toLocaleString()}</Text>
            <Text style={s.prizeUnit}>USDC</Text>
          </View>
        </View>

        <View style={s.cardBottom}>
          <View style={s.meta}>
            <Ionicons name="document-text-outline" size={13} color={colors.text.muted} />
            <Text style={s.metaText}>
              {subCount} submission{subCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={s.meta}>
            <Ionicons
              name="time-outline"
              size={13}
              color={urgent ? colors.states.warning : colors.text.muted}
            />
            <Text style={[s.metaText, urgent && { color: colors.states.warning }]}>{dl}</Text>
          </View>
          <View style={s.viewHint}>
            <Text style={s.viewHintText}>View</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.brand.primary} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function ClientJobs() {
  const router = useRouter();
  const user   = useAppSelector((s) => s.auth.user);
  const [filter, setFilter] = useState<BountyState | 'ALL'>('ALL');

  const { data, isLoading, isFetching, refetch } = useBrowseBountiesQuery(
    filter !== 'ALL' ? { state: filter } : {},
  );

  const myBounties = isLoading ? [] : (data?.filter((b) => b.client_id === user?.id) ?? []);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={myBounties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BountyCard item={item} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <>
            <View style={s.hero}>
              <LinearGradient
                colors={[colors.brand.primary + '15', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <SafeAreaView edges={['top']} style={s.safeHeader}>
                <View style={s.headerRow}>
                  <View>
                    <Text style={[typography.h1, { color: colors.text.primary }]}>My Bounties</Text>
                    <Text style={[typography.bodySmall, { color: colors.text.muted }]}>
                      {isLoading ? 'Loading…' : `${myBounties.length} active posting${myBounties.length !== 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <TouchableOpacity style={s.postBtn} onPress={() => router.push('/(client)/create')}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>

            <View style={s.filterRow}>
              <FlatList
                horizontal
                data={FILTERS}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(i) => i.value}
                contentContainerStyle={s.chipsScroll}
                renderItem={({ item: f }) => {
                  const active = filter === f.value;
                  return (
                    <TouchableOpacity
                      onPress={() => setFilter(f.value)}
                      style={[s.chip, active && s.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.chipText, active && s.chipTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <BountyListSkeleton count={3} />
          ) : (
            <View style={s.center}>
              <Ionicons name="albums-outline" size={32} color={colors.text.muted} />
              <Text style={[typography.body, { color: colors.text.muted, marginTop: 12 }]}>
                No bounties posted yet
              </Text>
              <TouchableOpacity
                style={s.emptyPostBtn}
                onPress={() => router.push('/(client)/create')}
                activeOpacity={0.8}
              >
                <Text style={s.emptyPostText}>Post your first bounty</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brand.primary} />
              </TouchableOpacity>
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
  postBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },

  filterRow:   { paddingVertical: 16 },
  chipsScroll: { paddingHorizontal: 20, gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, backgroundColor: colors.surface.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  chipActive:     { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '15' },
  chipText:       { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipTextActive: { color: colors.brand.primary, fontWeight: '700' },

  listContent: { paddingBottom: 120 },
  cardMargin:  { marginHorizontal: 20, marginBottom: 16 },
  card:        { padding: 20, gap: 16 },

  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardInfo:   { flex: 1 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  prizeTag:    { alignItems: 'flex-end' },
  prizeAmount: { fontSize: 24, fontWeight: '900', color: colors.text.primary, letterSpacing: -0.5 },
  prizeUnit:   { fontSize: 11, fontWeight: '700', color: colors.brand.secondary },

  cardBottom: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border.subtle,
  },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: colors.text.muted, fontWeight: '600' },
  viewHint: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewHintText: { fontSize: 13, fontWeight: '700', color: colors.brand.primary },

  center: { paddingVertical: 80, alignItems: 'center', gap: 12 },
  emptyPostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4, padding: 10,
  },
  emptyPostText: { fontSize: 14, fontWeight: '700', color: colors.brand.primary },
});
