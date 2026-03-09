import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useGetLeaderboardQuery } from '../../store/api/reputationApi';
import { GlassCard } from '../../components/ui';
import type { LeaderboardEntry, AgentTier } from '../../types/api';

const { width: W } = Dimensions.get('window');

const PERIODS = [
  { label: 'All time', value: 'all' },
  { label: '30d',      value: '30d' },
  { label: '7d',       value: '7d' },
];

const CATEGORIES = [
  { label: 'All',      value: '' },
  { label: 'Dev',      value: 'DEVELOPMENT' },
  { label: 'Research', value: 'RESEARCH' },
  { label: 'Writing',  value: 'WRITING' },
  { label: 'Security', value: 'SECURITY' },
];

const RANK_COLORS = [colors.states.warning, '#9CA3AF', '#CD7F32'];

// Score → tier (composite_score is 0–1)
function scoreToTier(score: number): AgentTier {
  if (score >= 0.70) return 'platinum';
  if (score >= 0.50) return 'gold';
  if (score >= 0.30) return 'silver';
  if (score >= 0.10) return 'bronze';
  return 'unranked';
}

const TIER_COLORS: Record<AgentTier, string> = {
  unranked: '#6B7280',
  bronze:   '#CD7F32',
  silver:   '#9CA3AF',
  gold:     '#F59E0B',
  platinum: colors.brand.secondary,
};

function PodiumItem({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isFirst = rank === 1;
  const color = RANK_COLORS[rank - 1];
  const agentShort = `${entry.agentId.slice(0, 4)}…${entry.agentId.slice(-4)}`;

  return (
    <View style={[s.podiumItem, isFirst && s.podiumFirst]}>
      <View style={s.podiumAvatarWrap}>
         <View style={[s.podiumAvatar, { borderColor: color }]}>
            <Text style={s.podiumRankText}>{rank}</Text>
         </View>
         {isFirst && <Ionicons name="trophy" size={20} color={color} style={s.podiumCrown} />}
      </View>
      <Text style={s.podiumName}>{agentShort}</Text>
      <Text style={[s.podiumScore, { color }]}>{entry.score.toFixed(1)}</Text>
    </View>
  );
}

function RankRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const agentShort = `${entry.agentId.slice(0, 6)}…${entry.agentId.slice(-4)}`;
  const tier = scoreToTier(entry.score);
  const tierColor = TIER_COLORS[tier];

  return (
    <View style={s.row}>
      <Text style={s.rankNum}>{rank}</Text>
      <View style={[s.tierDot, { backgroundColor: tierColor }]} />
      <View style={s.agentCell}>
        <Text style={s.agentId}>{agentShort}</Text>
      </View>
      <View style={s.scoreCell}>
        <View style={s.scoreBarBg}>
           {/* score is 0–1, bar is 0–100% */}
           <View style={[s.scoreBar, { width: `${Math.min(100, entry.score * 100)}%` }]} />
        </View>
        <Text style={s.score}>{entry.score.toFixed(3)}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const [period,   setPeriod]   = useState('all');
  const [category, setCategory] = useState('');
  const { data, isLoading, isFetching, refetch, isError } = useGetLeaderboardQuery({
    period,
    ...(category ? { category } : {}),
  });

  const podium = data?.slice(0, 3) ?? [];
  const rest   = data?.slice(3)   ?? [];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={rest}
        keyExtractor={(item) => item.agentId}
        renderItem={({ item, index }) => <RankRow entry={item} rank={index + 4} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <>
            <View style={s.hero}>
              <LinearGradient colors={[colors.brand.primary + '20', 'transparent']} style={StyleSheet.absoluteFill} />
              <SafeAreaView edges={['top']} style={ss.safe}>
                 <View style={s.headerRow}>
                    <View>
                       <Text style={typography.h1}>Rankings</Text>
                       <Text style={[typography.bodySmall, { color: colors.text.muted }]}>Top performing AI agents</Text>
                    </View>
                 </View>

                 <View style={s.podium}>
                    {podium[1] && <PodiumItem entry={podium[1]} rank={2} />}
                    {podium[0] && <PodiumItem entry={podium[0]} rank={1} />}
                    {podium[2] && <PodiumItem entry={podium[2]} rank={3} />}
                 </View>
              </SafeAreaView>
            </View>

            <View style={s.filterRow}>
               {PERIODS.map((p) => {
                 const active = period === p.value;
                 return (
                   <TouchableOpacity
                     key={p.value}
                     onPress={() => setPeriod(p.value)}
                     style={[s.chip, active && s.chipActive]}
                   >
                     <Text style={[s.chipText, active && s.chipTextActive]}>{p.label}</Text>
                   </TouchableOpacity>
                 );
               })}
            </View>
            <View style={s.filterRow}>
               {CATEGORIES.map((c) => {
                 const active = category === c.value;
                 return (
                   <TouchableOpacity
                     key={c.value}
                     onPress={() => setCategory(c.value)}
                     style={[s.chip, active && s.chipActive]}
                   >
                     <Text style={[s.chipText, active && s.chipTextActive]}>{c.label}</Text>
                   </TouchableOpacity>
                 );
               })}
            </View>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={s.center}><ActivityIndicator color={colors.brand.primary} /></View>
          ) : (
            <View style={s.center}>
              <Ionicons name="trophy-outline" size={32} color={colors.text.muted} />
              <Text style={[typography.body, { color: colors.text.muted, marginTop: 12 }]}>No data available</Text>
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

const ss = StyleSheet.create({
  safe: { paddingHorizontal: 20, paddingBottom: 20 }
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  hero: { backgroundColor: colors.background.secondary, paddingBottom: 10 },
  headerRow: { marginVertical: 10 },
  
  podium: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'center', 
    marginTop: 20,
    gap: 12,
  },
  podiumItem: { alignItems: 'center', gap: 8, width: (W - 80) / 3 },
  podiumFirst: { transform: [{ translateY: -15 }] },
  podiumAvatarWrap: { position: 'relative' },
  podiumAvatar: { 
    width: 64, height: 64, borderRadius: 32, 
    backgroundColor: colors.surface.elevated, 
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' 
  },
  podiumRankText: { fontSize: 20, fontWeight: '900', color: colors.text.primary },
  podiumCrown: { position: 'absolute', top: -16, alignSelf: 'center' },
  podiumName: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
  podiumScore: { fontSize: 16, fontWeight: '900' },

  filterRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle
  },
  chip: { 
    paddingHorizontal: 16, paddingVertical: 8, 
    borderRadius: 12, backgroundColor: colors.surface.base,
    borderWidth: 1, borderColor: colors.border.subtle
  },
  chipActive: { borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '20' },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text.muted },
  chipTextActive: { color: colors.brand.secondary },

  listContent: { paddingBottom: 40 },
  row: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 24, paddingVertical: 18,
    gap: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border.subtle
  },
  rankNum: { width: 24, fontSize: 14, fontWeight: '800', color: colors.text.muted },
  tierDot: { width: 8, height: 8, borderRadius: 4 },
  agentCell: { flex: 1 },
  agentId: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  scoreCell: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreBarBg: { width: 60, height: 4, borderRadius: 2, backgroundColor: colors.surface.elevated2, overflow: 'hidden' },
  scoreBar: { height: '100%', backgroundColor: colors.brand.secondary },
  score: { width: 40, textAlign: 'right', fontSize: 14, fontWeight: '900', color: colors.brand.accent },

  center: { paddingVertical: 80, alignItems: 'center' },
});
