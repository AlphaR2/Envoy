import React, { useState } from 'react'
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { colors, healthColor } from '../../theme/colors'
import { GlassCard, AgentSetupModal, useModal } from '../../components/ui'
import { useGetAgentQuery, useGetMyAgentsQuery, useRotateTokenMutation } from '../../store/api/agentsApi'
import { useGetAgentStatsQuery } from '../../store/api/reputationApi'
import type { AgentBadge, AgentTier } from '../../types/api'
import { useAppSelector } from '../../store/store'
import { openInExplorer, shortAddress } from '../../utils/solanaExplorer'
import { useToast } from '../../components/ui/Toast'

function StatBlock({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={sb.wrap}>
      <Text style={[sb.value, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={sb.label}>{label}</Text>
      {sub && <Text style={sb.sub}>{sub}</Text>}
    </View>
  )
}

const sb = StyleSheet.create({
  wrap: { alignItems: 'center', flex: 1 },
  value: { fontSize: 26, fontWeight: '900', color: colors.text.primary, letterSpacing: -0.5 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  sub: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
})

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? ''
const SKILL_URL = `${API_URL}/skill.md`

/** Show the first `visible` chars then pad with bullet dots */
const maskString = (value: string, visible = 8): string =>
  value.slice(0, visible) + '•'.repeat(10)

// ── Tier config 
const TIER_CONFIG: Record<AgentTier, { label: string; color: string }> = {
  unranked: { label: 'Unranked', color: '#6B7280' },
  bronze: { label: 'Bronze', color: '#CD7F32' },
  silver: { label: 'Silver', color: '#9CA3AF' },
  gold: { label: 'Gold', color: '#F59E0B' },
  platinum: { label: 'Platinum', color: colors.brand.secondary },
}

// Composite score thresholds: unranked < 0.10, bronze < 0.30, silver < 0.50, gold < 0.70, platinum
const TIER_THRESHOLDS = [
  { score: 0.1, tier: 'bronze' },
  { score: 0.3, tier: 'silver' },
  { score: 0.5, tier: 'gold' },
  { score: 0.7, tier: 'platinum' },
] as const

// ── Badge config 
const BADGE_CONFIG: Record<AgentBadge, { label: string; hint: string }> = {
  first_win: { label: 'First Win', hint: 'Won first bounty' },
  hat_trick: { label: 'Hat Trick', hint: '3+ wins' },
  veteran: { label: 'Veteran', hint: '10+ wins' },
  speed_demon: { label: 'Speed Demon', hint: '≥95% on-time with 5+ subs' },
  consistent: { label: 'Consistent', hint: '≥90% completion with 10+ regs' },
  five_star: { label: '5-Star Agent', hint: '≥4.8 rating with 3+ subs' },
}

export default function AgentStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const userType = useAppSelector((s) => s.auth.user?.user_type)
  const isClient = userType === 'client'
  const { toast } = useToast()
  const { showModal } = useModal()

  const { data: agent, isLoading: agentLoading } = useGetAgentQuery(id ?? '', { skip: !id })
  const { data: stats, isLoading: statsLoading } = useGetAgentStatsQuery(id ?? '', { skip: !id })
  // /agents/mine is backend-authoritative — if this agent is in the list, the current user owns it
  const { data: myAgents } = useGetMyAgentsQuery(undefined, { skip: !id })
  const [rotateToken, { isLoading: isRotating }] = useRotateTokenMutation()

  // Setup modal state — shared for both "just rotated" and "view existing" flows
  const [showSetupModal, setShowSetupModal]       = useState(false)
  const [modalToken, setModalToken]               = useState('')
  const [modalIsViewing, setModalIsViewing]       = useState(false)

  const isLoading = agentLoading || statsLoading
  // Use /agents/mine membership — avoids owner_id vs pubkey/UUID mismatch
  const isOwner = !!agent && !!(myAgents?.some((a) => a.id === agent.id))

  const doRotate = async () => {
    if (!id) return
    try {
      const { agentToken } = await rotateToken(id).unwrap()
      setModalToken(agentToken)
      setModalIsViewing(false)
      setShowSetupModal(true)
    } catch {
      toast({ message: 'Failed to rotate token', type: 'error' })
    }
  }

  const handleRotateToken = () => {
    if (!agent?.agent_token) {
      // No token yet — generate immediately, no warning needed
      doRotate()
      return
    }
    // Token already exists — warn before invalidating it
    showModal({
      title: 'Rotate Agent Token?',
      message:
        'This will invalidate the current token immediately. Any in-progress submissions using the old token will be rejected.\n\nYou must update ENVOY_AGENT_TOKEN in your AI agent after rotating.',
      actions: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Yes, Rotate Token', style: 'destructive', onPress: doRotate },
      ],
    })
  }

  const handleViewSetup = () => {
    if (!agent?.agent_token) return
    setModalToken(agent.agent_token)
    setModalIsViewing(true)
    setShowSetupModal(true)
  }

  const handleCloseModal = () => {
    setShowSetupModal(false)
    setModalToken('')
    setModalIsViewing(false)
  }

  if (isLoading) {
    return (
      <View style={s.loader}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={colors.brand.secondary} />
      </View>
    )
  }

  if (!agent) {
    return (
      <View style={s.loader}>
        <Ionicons name="warning-outline" size={36} color={colors.states.error} />
        <Text style={s.errText}>Agent not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
          <Text style={s.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const hColor = healthColor[agent.health_status] ?? colors.text.muted

  const dispatchIcon =
    agent.dispatch_method === 'telegram' ? 'paper-plane' : agent.dispatch_method === 'webhook' ? 'link' : 'refresh'

  const dispatchLabel =
    agent.dispatch_method === 'telegram'
      ? `Telegram · ${agent.telegram_chat_id ?? '—'}`
      : agent.dispatch_method === 'webhook'
        ? 'Webhook'
        : agent.dispatch_method === 'polling'
          ? 'Polling API'
          : 'Not configured'

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[colors.brand.secondary + '12', 'transparent']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>
            {agent.name}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Identity card */}
          <GlassCard intensity="medium" style={s.heroCard}>
            <LinearGradient colors={[colors.brand.secondary + '20', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={s.agentIconWrap}>
              <Image source={require('../../../assets/images/headaai.png')} style={s.agentImg} />
            </View>
            <Text style={s.agentName}>{agent.name}</Text>
            {agent.description && <Text style={s.agentDesc}>{agent.description}</Text>}

            {/* Health + dispatch row */}
            <View style={s.badgeRow}>
              <View style={[s.badge, { borderColor: hColor + '50', backgroundColor: hColor + '15' }]}>
                <View style={[s.healthDot, { backgroundColor: hColor }]} />
                <Text style={[s.badgeText, { color: hColor }]}>{agent.health_status}</Text>
              </View>
              {agent.dispatch_method && (
                <View style={s.badge}>
                  <Ionicons name={dispatchIcon as any} size={12} color={colors.brand.secondary} />
                  <Text style={s.badgeText}>{agent.dispatch_method.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Categories */}
            <View style={s.tagRow}>
              {agent.categories.map((c) => (
                <View key={c} style={s.tag}>
                  <Text style={s.tagText}>{c}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* ── Stats Panel  */}
          {stats &&
            (() => {
              const tier = TIER_CONFIG[stats.tier] ?? TIER_CONFIG.unranked
              const compositeScore = stats.composite_score ?? 0
              const scorePct = Math.min(100, compositeScore * 100)
              const uptimePct = Math.min(100, (stats.uptime ?? 0) * 100)
              return (
                <>
                  {/* Tier + Score card */}
                  <GlassCard intensity="low" style={s.tierCard}>
                    {/* Tier badge */}
                    <View style={s.tierRow}>
                      <View
                        style={[s.tierPill, { borderColor: tier.color + '50', backgroundColor: tier.color + '18' }]}
                      >
                        <Text style={[s.tierLabel, { color: tier.color }]}>{tier.label}</Text>
                      </View>
                      <View style={s.xpBadge}>
                        <Ionicons name="flash" size={12} color={colors.brand.neon} />
                        <Text style={s.xpText}>{(stats.xp_points ?? 0).toLocaleString()} XP</Text>
                      </View>
                      {(stats.win_streak ?? 0) > 0 && (
                        <View style={s.streakBadge}>
                          <Text style={s.streakText}>🔥 {stats.win_streak}</Text>
                        </View>
                      )}
                    </View>

                    {/* Composite score bar with tier markers */}
                    <View style={{ gap: 6 }}>
                      <View style={s.barHeaderRow}>
                        <Text style={s.barLabel}>Composite Score</Text>
                        <Text style={s.barValue}>{compositeScore.toFixed(3)}</Text>
                      </View>
                      <View style={s.barTrack}>
                        <LinearGradient
                          colors={[colors.brand.secondary, colors.brand.neon]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[s.barFill, { width: `${scorePct}%` }]}
                        />
                        {/* Tier threshold markers */}
                        {TIER_THRESHOLDS.map((t) => (
                          <View key={t.tier} style={[s.tierMark, { left: `${t.score * 100}%` as any }]} />
                        ))}
                      </View>
                      <View style={s.tierMarkLabels}>
                        {TIER_THRESHOLDS.map((t) => (
                          <Text key={t.tier} style={s.tierMarkLabel}>
                            {t.score}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </GlassCard>

                  {/* Stats 2×3 grid */}
                  <GlassCard intensity="low" style={s.statsCard}>
                    <View style={s.statsGrid}>
                      <StatBlock label="Wins" value={String(stats.bounty_wins ?? 0)} accent={colors.states.success} />
                      <View style={s.statDivider} />
                      <StatBlock
                        label="Win Rate"
                        value={`${((stats.bounty_win_rate ?? 0) * 100).toFixed(1)}%`}
                        accent={colors.brand.secondary}
                      />
                      <View style={s.statDivider} />
                      <StatBlock
                        label="Earned"
                        value={`$${(stats.total_earned_usdc ?? 0).toLocaleString()}`}
                        accent={colors.brand.neon}
                      />
                    </View>
                    <View style={s.statDividerH} />
                    <View style={s.statsGrid}>
                      <StatBlock
                        label="On Time"
                        value={`${((stats.on_time_rate ?? 0) * 100).toFixed(0)}%`}
                        accent={colors.text.primary}
                      />
                      <View style={s.statDivider} />
                      <StatBlock
                        label="Rating"
                        value={
                          (stats.avg_quality_rating ?? 0) > 0 ? `${(stats.avg_quality_rating ?? 0).toFixed(1)}/5` : '—'
                        }
                        accent={colors.states.warning}
                      />
                      <View style={s.statDivider} />
                      <StatBlock
                        label="Completion"
                        value={`${((stats.completion_rate ?? 0) * 100).toFixed(0)}%`}
                        accent={colors.brand.primary}
                      />
                    </View>
                  </GlassCard>

                  {/* Badges */}
                  {(stats.badges ?? []).length > 0 && (
                    <GlassCard intensity="low" style={s.badgesCard}>
                      <Text style={s.sectionLabel}>Achievements</Text>
                      <View style={s.badgesList}>
                        {(stats.badges ?? []).map((b) => {
                          const cfg = BADGE_CONFIG[b]
                          return (
                            <View key={b} style={s.badgeItem}>
                              <View style={{ flex: 1 }}>
                                <Text style={s.badgeItemLabel}>{cfg.label}</Text>
                                <Text style={s.badgeItemHint}>{cfg.hint}</Text>
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    </GlassCard>
                  )}
                </>
              )
            })()}

          {/* Dispatch info */}
          <GlassCard intensity="low" style={s.dispatchCard}>
            <Text style={s.sectionLabel}>Dispatch Configuration</Text>
            <View style={s.dispatchRow}>
              <Ionicons name={dispatchIcon as any} size={18} color={colors.brand.secondary} />
              <Text style={s.dispatchText}>{dispatchLabel}</Text>
            </View>
            {agent.supported_formats.length > 0 && (
              <View style={s.formatsRow}>
                {agent.supported_formats.map((f) => (
                  <View key={f} style={s.formatChip}>
                    <Text style={s.formatChipText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>

          {/* Wallet / NFT */}
          {agent.asset_pubkey && (
            <GlassCard intensity="low" style={s.nftCard}>
              <Text style={s.sectionLabel}>Agent NFT</Text>
              <TouchableOpacity
                style={s.addressRow}
                activeOpacity={0.7}
                onPress={() => openInExplorer(agent.asset_pubkey!)}
              >
                <Ionicons name="wallet-outline" size={13} color={colors.brand.secondary} />
                <Text style={s.nftAddress} numberOfLines={1}>
                  {shortAddress(agent.asset_pubkey)}
                </Text>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={async () => {
                    await Clipboard.setStringAsync(agent.asset_pubkey!)
                    toast({ message: 'Address copied', type: 'success' })
                  }}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.text.muted} />
                </TouchableOpacity>
                <Ionicons name="open-outline" size={14} color={colors.brand.secondary} />
              </TouchableOpacity>
              <Text style={s.nftSub}>Solana NFT · Proof of agent ownership</Text>
            </GlassCard>
          )}

          {/* ── Owner-only: AI Setup + Token cards  */}
          {isOwner && (
            <>
              {/* AI Setup card */}
              <GlassCard intensity="low" style={s.ownerCard}>
                <View style={s.ownerCardHeader}>
                  <Ionicons name="code-slash-outline" size={16} color={colors.brand.secondary} />
                  <Text style={s.sectionLabel}>AI Setup</Text>
                </View>
                <Text style={s.ownerCardHint}>Give your AI the SKILL.md so it knows Envoy's submission rules.</Text>

                {/* SKILL URL row */}
                <View style={s.copyRow}>
                  <Text style={s.copyRowValue} numberOfLines={1} ellipsizeMode="middle">
                    {SKILL_URL}
                  </Text>
                  <TouchableOpacity
                    style={s.copyRowBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                    onPress={async () => {
                      await Clipboard.setStringAsync(SKILL_URL)
                      toast({ message: 'SKILL.md URL copied', type: 'success' })
                    }}
                  >
                    <Ionicons name="copy-outline" size={15} color={colors.brand.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Copy Setup Message */}
                <TouchableOpacity
                  style={s.setupMsgBtn}
                  activeOpacity={0.8}
                  onPress={async () => {
                    const msg = [
                      `Read this skill file: ${SKILL_URL}`,
                      ``,
                      `Your credentials:`,
                      `- agent_id: ${agent!.id}`,
                    ].join('\n')
                    await Clipboard.setStringAsync(msg)
                    toast({ message: 'Setup message copied', type: 'success' })
                  }}
                >
                  <LinearGradient
                    colors={[colors.brand.secondary + '22', colors.brand.primary + '12']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="copy-outline" size={14} color={colors.brand.secondary} />
                  <Text style={s.setupMsgText}>Copy Setup Message</Text>
                </TouchableOpacity>

                {/* Open full setup guide modal — only if token exists */}
                {agent!.agent_token && (
                  <TouchableOpacity
                    style={s.setupGuideBtn}
                    activeOpacity={0.8}
                    onPress={handleViewSetup}
                  >
                    <LinearGradient
                      colors={[colors.brand.primary + '20', colors.brand.secondary + '12']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="book-outline" size={14} color={colors.brand.primary} />
                    <Text style={s.setupGuideText}>Open Setup Guide</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>

              {/* Submission Token card */}
              <GlassCard intensity="low" style={s.ownerCard}>
                <View style={s.ownerCardHeader}>
                  <Ionicons name="key-outline" size={16} color={colors.brand.neon} />
                  <Text style={s.sectionLabel}>Agent Credentials</Text>
                </View>

                {/* Agent ID row — always shown to owner */}
                <View style={s.credLabelRow}>
                  <Text style={s.credLabel}>AGENT ID</Text>
                  <Text style={s.credHint}>Set as ENVOY_AGENT_ID in your AI</Text>
                </View>
                <View style={s.copyRow}>
                  <Text style={s.copyRowValue} numberOfLines={1}>
                    {maskString(agent!.id, 8)}
                  </Text>
                  <TouchableOpacity
                    style={s.copyRowBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                    onPress={async () => {
                      await Clipboard.setStringAsync(agent!.id)
                      toast({ message: 'Agent ID copied', type: 'success' })
                    }}
                  >
                    <Ionicons name="copy-outline" size={15} color={colors.brand.secondary} />
                  </TouchableOpacity>
                </View>

                {/* Token presence indicator */}
                <View style={s.credLabelRow}>
                  <Text style={s.credLabel}>AGENT TOKEN</Text>
                  <Text style={s.credHint}>Set as ENVOY_AGENT_TOKEN in your AI</Text>
                </View>
                <View style={s.tokenStatusRow}>
                  <View
                    style={[
                      s.tokenDot,
                      { backgroundColor: agent!.agent_token ? colors.states.success : colors.states.warning },
                    ]}
                  />
                  <Text style={s.tokenStatusText}>
                    {agent!.agent_token
                      ? (agent!.agent_token.startsWith('agt_') && agent!.agent_token.length > 10
                          ? maskString(agent!.agent_token, 8)
                          : 'agt_••••••••••') + '  (active)'
                      : 'No token — generate one to enable submissions'}
                  </Text>
                </View>

                <Text style={s.ownerCardHint}>
                  {agent!.agent_token
                    ? 'Rotating generates a new token. Update your AI immediately — the old one stops working.'
                    : 'Generate a token so your AI can submit deliverables on your behalf.'}
                </Text>

                <TouchableOpacity
                  style={[s.rotateBtn, isRotating && s.rotateBtnDisabled]}
                  activeOpacity={0.8}
                  onPress={handleRotateToken}
                  disabled={isRotating}
                >
                  <LinearGradient
                    colors={[colors.brand.neon + '25', colors.brand.secondary + '15']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {isRotating ? (
                    <ActivityIndicator size="small" color={colors.brand.neon} />
                  ) : (
                    <Ionicons name={agent!.agent_token ? 'refresh-outline' : 'add-circle-outline'} size={15} color={colors.brand.neon} />
                  )}
                  <Text style={s.rotateBtnText}>{agent!.agent_token ? 'Rotate Token' : 'Generate Token'}</Text>
                </TouchableOpacity>
              </GlassCard>
            </>
          )}

          {/* Hire Agent — clients only */}
          {isClient && (
            <View style={s.hireWrap}>
              <TouchableOpacity style={s.hireBtn} activeOpacity={0.7} disabled>
                <View style={s.hireBtnInner}>
                  <Ionicons name="flash-outline" size={18} color={colors.text.muted} />
                  <Text style={s.hireBtnText}>Hire Agent</Text>
                  <View style={s.comingSoonBadge}>
                    <Text style={s.comingSoonText}>Coming Soon</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={s.hireHint}>Direct hiring will let you assign tasks to a specific agent.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Setup guide modal — rotate/generate flow OR view existing credentials */}
      {showSetupModal && modalToken.length > 0 && (
        <AgentSetupModal
          visible={showSetupModal}
          agentId={id ?? ''}
          agentToken={modalToken}
          isNewAgent={false}
          isViewingExisting={modalIsViewing}
          onDone={handleCloseModal}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  loader: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errText: { fontSize: 16, fontWeight: '700', color: colors.text.secondary },
  backLink: { padding: 8 },
  backLinkText: { color: colors.brand.secondary, fontSize: 14, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text.primary, flex: 1, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },

  // Hero card
  heroCard: { alignItems: 'center', padding: 24, borderRadius: 24, gap: 12, overflow: 'hidden' },
  agentIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.brand.secondary + '15',
    borderWidth: 1,
    borderColor: colors.brand.secondary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  agentImg: { width: 72, height: 72, borderRadius: 22 },
  agentName: { fontSize: 22, fontWeight: '900', color: colors.text.primary, textAlign: 'center' },
  agentDesc: { fontSize: 13, color: colors.text.secondary, textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.text.muted, letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 11, fontWeight: '700', color: colors.text.secondary },

  // Tier card
  tierCard: { padding: 16, borderRadius: 20, gap: 14 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tierEmoji: { fontSize: 16 },
  tierLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand.neon + '18',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.brand.neon + '35',
  },
  xpText: { fontSize: 12, fontWeight: '800', color: colors.brand.neon },
  streakBadge: {
    backgroundColor: '#FF6B3518',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FF6B3535',
  },
  streakText: { fontSize: 12, fontWeight: '800', color: '#FF6B35' },
  barHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barLabel: { fontSize: 11, fontWeight: '700', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 },
  barValue: { fontSize: 13, fontWeight: '800', color: colors.brand.neon },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
    position: 'relative',
  },
  barFill: { height: '100%', borderRadius: 4, position: 'absolute', left: 0, top: 0 },
  tierMark: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  tierMarkLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  tierMarkLabel: { fontSize: 9, color: colors.text.muted, fontWeight: '600' },

  // Stats grid
  statsCard: { padding: 20, borderRadius: 20, gap: 0 },
  statsGrid: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' },
  statDividerH: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },

  // Badges
  badgesCard: { padding: 16, borderRadius: 20, gap: 12 },
  badgesList: { gap: 10 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badgeItemIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  badgeItemLabel: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  badgeItemHint: { fontSize: 11, color: colors.text.muted, marginTop: 1 },

  // Health
  healthCard: { padding: 16, borderRadius: 20, gap: 10 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  healthDotLg: { width: 10, height: 10, borderRadius: 5 },
  healthStatusText: { fontSize: 13, fontWeight: '700', color: colors.text.primary, flex: 1 },
  healthUptime: { fontSize: 12, fontWeight: '600', color: colors.text.muted },

  // Dispatch
  dispatchCard: { padding: 16, borderRadius: 20, gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  dispatchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dispatchText: { fontSize: 14, fontWeight: '600', color: colors.text.primary, flex: 1 },
  formatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  formatChipText: { fontSize: 11, fontWeight: '600', color: colors.text.muted },

  // NFT
  nftCard: { padding: 16, borderRadius: 20, gap: 8 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  nftAddress: { fontSize: 12, fontFamily: 'monospace', color: colors.brand.secondary, flex: 1 },
  nftSub: { fontSize: 11, color: colors.text.muted },

  // Owner cards
  ownerCard: { padding: 16, borderRadius: 20, gap: 12 },
  ownerCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownerCardHint: { fontSize: 12, color: colors.text.muted, lineHeight: 17 },

  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  copyRowValue: { flex: 1, fontSize: 12, fontFamily: 'monospace', color: colors.brand.secondary },
  copyRowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.brand.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },

  setupMsgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.brand.secondary + '35',
  },
  setupMsgText: { fontSize: 13, fontWeight: '700', color: colors.brand.secondary },
  setupGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.brand.primary + '40',
  },
  setupGuideText: { fontSize: 13, fontWeight: '700', color: colors.brand.primary },

  credLabelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  credLabel: {
    fontSize: 10, fontWeight: '800', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  credHint: { fontSize: 10, fontWeight: '500', color: colors.text.muted, flex: 1 },

  tokenStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tokenDot: { width: 8, height: 8, borderRadius: 4 },
  tokenStatusText: { fontSize: 13, fontWeight: '600', color: colors.text.primary, flex: 1, fontFamily: 'monospace' },

  rotateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.brand.neon + '35',
  },
  rotateBtnDisabled: { opacity: 0.5 },
  rotateBtnText: { fontSize: 13, fontWeight: '700', color: colors.brand.neon },

  // Hire Agent
  hireWrap: { gap: 10, marginTop: 4 },
  hireBtn: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
    opacity: 0.55,
  },
  hireBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  hireBtnText: { fontSize: 16, fontWeight: '800', color: colors.text.muted, flex: 1 },
  comingSoonBadge: {
    backgroundColor: colors.surface.elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  comingSoonText: { fontSize: 10, fontWeight: '800', color: colors.text.muted, letterSpacing: 0.5 },
  hireHint: { fontSize: 12, color: colors.text.muted, textAlign: 'center', lineHeight: 17 },
})
