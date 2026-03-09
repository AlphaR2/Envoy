import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, StatusBar, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, healthColor, categoryTextColor } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useBrowseAgentsQuery } from '../../store/api/agentsApi';
import { GlassCard } from '../../components/ui';
import type { Agent, BountyCategory } from '../../types/api';

const CATEGORIES: { label: string; value: BountyCategory | 'ALL' }[] = [
  { label: 'All',      value: 'ALL' },
  { label: 'Dev',      value: 'DEVELOPMENT' },
  { label: 'Research', value: 'RESEARCH' },
  { label: 'Writing',  value: 'WRITING' },
  { label: 'Security', value: 'SECURITY' },
];

function AgentCard({ item }: { item: Agent }) {
  const router  = useRouter();
  const hColor  = healthColor[item.health_status] ?? colors.text.muted;
  const isAlive = item.health_status === 'healthy';

  return (
    <TouchableOpacity activeOpacity={0.88} style={s.cardMargin} onPress={() => router.push(`/agent/${item.id}`)}>
      <GlassCard intensity="low" border style={s.card}>
        {/* Top row */}
        <View style={s.cardTop}>
          <View style={[s.agentIcon, { borderColor: hColor + '40', backgroundColor: hColor + '10' }]}>
            <Image source={require('../../../assets/images/headaai.png')} style={s.agentImg} />
          </View>

          <View style={s.cardInfo}>
            <Text style={s.agentName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.description ? (
              <Text style={s.agentDesc} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>

          {/* Health badge */}
          <View style={[s.healthBadge, { borderColor: hColor + '50', backgroundColor: hColor + '15' }]}>
            <View style={[s.healthDot, { backgroundColor: hColor }]} />
            <Text style={[s.healthText, { color: hColor }]}>{item.health_status}</Text>
          </View>
        </View>

        {/* Categories */}
        {item.categories.length > 0 && (
          <View style={s.tagRow}>
            {item.categories.map((cat) => {
              const catColor = categoryTextColor[cat as BountyCategory] ?? colors.text.secondary
              return (
                <View key={cat} style={[s.catTag, { backgroundColor: catColor + '15', borderColor: catColor + '40' }]}>
                  <Text style={[s.catTagText, { color: catColor }]}>{cat}</Text>
                </View>
              )
            })}
            {item.specialisation_tags.slice(0, 2).map((tag) => (
              <View key={tag} style={s.specTag}>
                <Text style={s.specTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={s.cardFooter}>
          {item.dispatch_method && (
            <View style={s.metaWrap}>
              <Ionicons
                name={item.dispatch_method === 'telegram' ? 'paper-plane-outline' : 'link-outline'}
                size={12}
                color={colors.text.muted}
              />
              <Text style={s.metaText}>{item.dispatch_method}</Text>
            </View>
          )}
          <View style={s.viewHint}>
            <Text style={s.viewHintText}>View Agent</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.brand.secondary} />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  )
}

export default function ClientAgents() {
  const [cat, setCat] = useState<BountyCategory | 'ALL'>('ALL');

  const { data, isLoading, isFetching, refetch } = useBrowseAgentsQuery(
    cat !== 'ALL' ? { category: cat } : {},
  );

  const agents = data ?? [];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={isLoading ? [] : agents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AgentCard item={item} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <>
            <View style={s.hero}>
              <LinearGradient
                colors={[colors.brand.secondary + '18', colors.brand.primary + '08', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <SafeAreaView edges={['top']} style={s.safeHeader}>
                <View style={s.headerRow}>
                  <View>
                    <Text style={[typography.h1, { color: colors.text.primary }]}>AI Agents</Text>
                    <Text style={[typography.bodySmall, { color: colors.text.muted, marginTop: 2 }]}>
                      {isLoading ? 'Loading…' : `${agents.length} agent${agents.length !== 1 ? 's' : ''} available`}
                    </Text>
                  </View>
                  <View style={s.iconWrap}>
                    <Ionicons name="hardware-chip-outline" size={22} color={colors.brand.secondary} />
                  </View>
                </View>
              </SafeAreaView>
            </View>

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
        ListEmptyComponent={
          isLoading ? null : (
            <View style={s.emptyWrap}>
              <Ionicons name="hardware-chip-outline" size={40} color={colors.text.muted} />
              <Text style={s.emptyTitle}>No Agents Found</Text>
              <Text style={s.emptyBody}>
                {cat !== 'ALL'
                  ? 'No agents in this category yet.'
                  : 'No agents are available right now.'}
              </Text>
            </View>
          )
        }
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

  hero: { height: 180, justifyContent: 'flex-end', backgroundColor: colors.background.secondary },
  safeHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand.secondary + '20',
    borderWidth: 1.5, borderColor: colors.brand.secondary + '50',
    alignItems: 'center', justifyContent: 'center',
  },

  chipsRow:    { paddingVertical: 14 },
  chipsScroll: { paddingHorizontal: 20, gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surface.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  chipActive:     { borderColor: colors.brand.secondary, backgroundColor: colors.brand.secondary + '15' },
  chipText:       { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipTextActive: { color: colors.brand.secondary, fontWeight: '700' },

  listContent: { paddingBottom: 120 },
  cardMargin:  { marginHorizontal: 20, marginBottom: 14 },
  card:        { padding: 16, gap: 12 },

  cardTop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  agentIcon: {
    width: 44, height: 44, borderRadius: 14,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, overflow: 'hidden',
  },
  agentImg: { width: 44, height: 44, borderRadius: 14 },
  cardInfo:  { flex: 1 },
  agentName: { fontSize: 15, fontWeight: '800', color: colors.text.primary, marginBottom: 3 },
  agentDesc: { fontSize: 12, color: colors.text.muted, lineHeight: 17 },

  healthBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    flexShrink: 0,
  },
  healthDot:  { width: 5, height: 5, borderRadius: 3 },
  healthText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catTag: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  catTagText:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  specTag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3,
  },
  specTagText: { fontSize: 10, fontWeight: '600', color: colors.text.muted },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border.subtle,
  },
  metaWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: colors.text.muted, fontWeight: '600', textTransform: 'capitalize' },
  viewHint: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  viewHintText: { fontSize: 12, fontWeight: '700', color: colors.brand.secondary },

  emptyWrap: { paddingTop: 60, paddingHorizontal: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text.secondary },
  emptyBody:  { fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 21 },
});
