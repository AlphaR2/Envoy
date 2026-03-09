import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, StatusBar, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, healthColor } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useRouter } from 'expo-router'
import { useGetMyAgentsQuery } from '../../store/api/agentsApi'
import { GlassCard, PremiumButton, AgentListSkeleton } from '../../components/ui'
import type { Agent } from '../../types/api'

function AgentCard({ agent }: { agent: Agent }) {
  const router = useRouter()
  const hColor = healthColor[agent.health_status] ?? colors.text.muted

  return (
    <TouchableOpacity activeOpacity={0.85} style={s.cardMargin} onPress={() => router.push(`/agent/${agent.id}`)}>
      <GlassCard intensity="low" border style={s.card}>
        <View style={s.cardTop}>
          <View style={s.healthStatus}>
            <View style={[s.healthDot, { backgroundColor: hColor }]} />
            <Text style={[s.healthText, { color: hColor }]}>{agent.health_status}</Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={16} color={colors.text.muted} />
        </View>

        <View style={s.cardMid}>
          <View style={s.agentNameRow}>
            <Image source={require('../../../assets/images/headaai.png')} style={s.agentImg} />
            <Text style={[typography.h3, { color: colors.text.primary, flex: 1 }]}>{agent.name}</Text>
          </View>
          <View style={s.tagRow}>
            {agent.categories.map((c) => (
              <View key={c} style={s.tag}>
                <Text style={s.tagText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.cardBottom}>
          <View style={s.metric}>
            <Text style={s.metricLabel}>Uptime</Text>
            <Text style={s.metricValue}>99.2%</Text>
          </View>
          <View style={s.metricLine} />
          <View style={s.metric}>
            <Text style={s.metricLabel}>Success</Text>
            <Text style={s.metricValue}>12/14</Text>
          </View>
          <TouchableOpacity style={s.manageBtn} activeOpacity={0.7} onPress={() => router.push(`/agent/${agent.id}`)}>
            <Text style={s.manageText}>View Stats</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  )
}

export default function FreelancerAgents() {
  const router = useRouter()
  const { data: agents, isLoading, isFetching, refetch } = useGetMyAgentsQuery()

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={isLoading ? [] : agents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AgentCard agent={item} />}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <>
            <View style={s.hero}>
              <LinearGradient colors={[colors.brand.primary + '15', 'transparent']} style={StyleSheet.absoluteFill} />
              <SafeAreaView edges={['top']} style={s.safeHeader}>
                <View style={s.headerRow}>
                  <View>
                    <Text style={[typography.h1, { color: colors.text.primary }]}>My Agents</Text>
                    <Text style={[typography.bodySmall, { color: colors.text.muted }]}>
                      {isLoading ? 'Loading…' : `${agents?.length ?? 0} agents online`}
                    </Text>
                  </View>
                </View>
              </SafeAreaView>
            </View>
            <View style={{ height: 16 }} />
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <AgentListSkeleton count={3} />
          ) : (
            <View style={s.center}>
              <View style={s.emptyIconWrap}>
                <Image source={require('../../../assets/images/headaai.png')} style={s.emptyImg} />
              </View>
              <Text style={[typography.h3, { color: colors.text.primary, marginTop: 20 }]}>No agents found</Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.muted, textAlign: 'center', paddingHorizontal: 40, marginTop: 8 },
                ]}
              >
                Deploy your first AI agent to start completing bounties automatically.
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.brand.primary} />
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },

  hero: { height: 180, justifyContent: 'flex-end', backgroundColor: colors.background.secondary },
  safeHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  listContent: { paddingBottom: 120 },
  cardMargin: { marginHorizontal: 20, marginBottom: 16 },
  card: { padding: 20, gap: 20 },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  healthStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  cardMid: { gap: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surface.elevated2,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tagText: { fontSize: 10, fontWeight: '700', color: colors.text.secondary },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  metric: { gap: 2 },
  metricLabel: { fontSize: 10, color: colors.text.muted, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { fontSize: 14, fontWeight: '800', color: colors.text.primary },
  metricLine: { width: 1, height: 24, backgroundColor: colors.border.subtle, marginHorizontal: 20 },

  manageBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.brand.secondary + '20',
    borderWidth: 1,
    borderColor: colors.brand.secondary + '40',
  },
  manageText: { fontSize: 13, fontWeight: '800', color: colors.brand.secondary },

  center: { paddingVertical: 80, alignItems: 'center' },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.surface.base,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  emptyImg: { width: 100, height: 100, borderRadius: 50 },
  agentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentImg: { width: 36, height: 36, borderRadius: 10 },
})
