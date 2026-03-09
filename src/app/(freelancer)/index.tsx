import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  colors, bountyStateColor, categoryTextColor,
} from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useBrowseBountiesQuery } from '../../store/api/bountiesApi';
import { useGetOwnerStatsQuery } from '../../store/api/reputationApi';
import { useAppSelector } from '../../store/store';
import { GlassCard, BountyListSkeleton } from '../../components/ui';
import type { Bounty, BountyCategory, OwnerTier } from '../../types/api';

const { width: W } = Dimensions.get('window');

const CATEGORIES: { label: string; value: BountyCategory | 'ALL' }[] = [
  { label: 'All',      value: 'ALL' },
  { label: 'Dev',      value: 'DEVELOPMENT' },
  { label: 'Research', value: 'RESEARCH' },
  { label: 'Writing',  value: 'WRITING' },
  { label: 'Security', value: 'SECURITY' },
];

const OWNER_TIER_CONFIG: Record<OwnerTier, { emoji: string; color: string }> = {
  client:   { emoji: '🆕', color: '#6B7280' },
  bronze:   { emoji: '🥉', color: '#CD7F32' },
  silver:   { emoji: '🥈', color: '#9CA3AF' },
  gold:     { emoji: '🥇', color: '#F59E0B' },
  platinum: { emoji: '💎', color: colors.brand.secondary },
};

function ClientTierBadge({ clientId }: { clientId: string }) {
  const { data } = useGetOwnerStatsQuery(clientId);
  if (!data) return null;
  const tier = data.tier ?? 'client';
  const cfg = OWNER_TIER_CONFIG[tier] ?? OWNER_TIER_CONFIG.client;
  return (
    <View style={[s.clientBadge, { borderColor: cfg.color + '40', backgroundColor: cfg.color + '12' }]}>
      <Text style={s.clientBadgeText}>{cfg.emoji} {tier.charAt(0).toUpperCase() + tier.slice(1)} · {data.bounties_settled ?? 0} settled</Text>
    </View>
  );
}

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
    <TouchableOpacity activeOpacity={0.88} style={s.cardMargin} onPress={() => router.push(`/bounty/${item.id}`)}>
      <GlassCard intensity="low" border style={s.card}>
        {/* Header row */}
        <View style={s.cardTop}>
          <View style={s.cardInfo}>
            <View style={[s.catPill, { backgroundColor: catText + '18', borderColor: catText + '40' }]}>
              <Text style={[s.catPillText, { color: catText }]}>{cat}</Text>
            </View>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: 8 }]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          {/* Prize block */}
          <View style={s.prizeBlock}>
            <Text style={s.prizeAmount}>{(item.prize_usdc ?? 0).toLocaleString()}</Text>
            <Text style={s.prizeUnit}>USDC</Text>
          </View>
        </View>

        {/* Client tier badge */}
        <ClientTierBadge clientId={item.client_id} />

        {/* Footer row */}
        <View style={s.cardFooter}>
          <View style={s.metaWrap}>
            <Ionicons
              name="time-outline"
              size={13}
              color={urgent ? colors.states.warning : colors.text.muted}
            />
            <Text style={[s.metaText, urgent && { color: colors.states.warning }]}>{dl}</Text>
          </View>

          <View style={s.metaWrap}>
            <Ionicons name="people-outline" size={13} color={colors.text.muted} />
            <Text style={s.metaText}>{item.registration_count} registered</Text>
          </View>
          {item.submission_count > 0 && (
            <View style={s.metaWrap}>
              <Ionicons name="document-text-outline" size={13} color={colors.brand.secondary} />
              <Text style={[s.metaText, { color: colors.brand.secondary }]}>{item.submission_count} submitted</Text>
            </View>
          )}

          <TouchableOpacity style={s.enterBtn} activeOpacity={0.75} onPress={() => router.push(`/bounty/${item.id}`)}>
            <LinearGradient
              colors={[colors.brand.secondary, colors.brand.neon]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={s.enterBtnText}>Enter</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

/* ── Empty state ── */
function EmptyState({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return <BountyListSkeleton count={4} />;
  }

  return (
    <View style={s.emptyWrap}>
      {/* AI illustration as bg image */}
      <Image
        source={require('../../../assets/images/intro/intro-ai.png')}
        style={s.emptyImage}
        resizeMode="contain"
      />
      <Text style={s.emptyTitle}>No Bounties Yet</Text>
      <Text style={s.emptyBody}>
        New missions drop daily.{'\n'}Check back soon or clear your filters.
      </Text>
    </View>
  );
}

export default function FreelancerDiscover() {
  const user = useAppSelector((s) => s.auth.user);
  const [cat, setCat] = useState<BountyCategory | 'ALL'>('ALL');

  const { data, isLoading, isFetching, refetch } = useBrowseBountiesQuery({
    state: 'open',
    ...(cat !== 'ALL' ? { category: cat } : {}),
  });

  const displayName = user?.display_name || 'Agent';
  const initial     = displayName[0].toUpperCase();

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BountyCard item={item} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <>
            {/* ── Hero header ── */}
            <View style={s.hero}>
              <LinearGradient
                colors={[colors.brand.secondary + '18', colors.brand.primary + '08', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <SafeAreaView edges={['top']} style={s.safeHeader}>
                <View style={s.headerRow}>
                  <View style={s.headerText}>
                    <Text style={[typography.h1, { color: colors.text.primary }]}>Dashboard</Text>
                    <Text style={[typography.bodySmall, { color: colors.text.muted, marginTop: 2 }]}>
                      {data?.length ?? 0} open {data?.length === 1 ? 'bounty' : 'bounties'}
                    </Text>
                  </View>
                  <View style={s.avatarBtn}>
                    <Text style={s.avatarLetter}>{initial}</Text>
                  </View>
                </View>
              </SafeAreaView>
            </View>

            {/* ── Category filter chips ── */}
            <FlatList
              horizontal
              data={CATEGORIES}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(i) => i.value}
              contentContainerStyle={s.chipsScroll}
              style={s.chipsRow}
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
          </>
        }
        ListEmptyComponent={<EmptyState isLoading={isLoading} />}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.brand.secondary}
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },

  /* ── Hero ── */
  hero: {
    height: 190,
    justifyContent: 'flex-end',
    backgroundColor: colors.background.secondary,
  },
  safeHeader:  { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerText:  { flex: 1 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand.secondary + '20',
    borderWidth: 1.5, borderColor: colors.brand.secondary + '50',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 17, fontWeight: '900', color: colors.brand.secondary },

  /* ── Filter chips ── */
  chipsRow:    { paddingVertical: 14 },
  chipsScroll: { paddingHorizontal: 20, gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  chipActive: {
    borderColor: colors.brand.secondary,
    backgroundColor: colors.brand.secondary + '15',
  },
  chipText:       { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipTextActive: { color: colors.brand.secondary, fontWeight: '700' },

  /* ── Card ── */
  listContent: { paddingBottom: 120 },
  cardMargin:  { marginHorizontal: 20, marginBottom: 14 },
  card:        { padding: 18, gap: 14 },

  cardTop:  { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardInfo: { flex: 1 },

  catPill: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  catPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  prizeBlock:  { alignItems: 'flex-end', justifyContent: 'flex-start' },
  prizeAmount: { fontSize: 26, fontWeight: '900', color: colors.text.primary, letterSpacing: -0.5 },
  prizeUnit:   { fontSize: 11, fontWeight: '700', color: colors.brand.secondary },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border.subtle,
  },
  metaWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: colors.text.muted, fontWeight: '600' },

  enterBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  enterBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  /* ── Client tier badge ── */
  clientBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  clientBadgeText: { fontSize: 10, fontWeight: '700', color: colors.text.secondary },

  /* ── Empty state ── */
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyImage: {
    width: W * 0.6,
    height: W * 0.6,
    opacity: 0.35,
    marginBottom: 28,
  },
  emptyLoadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.secondary,
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
