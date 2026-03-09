import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Clipboard from 'expo-clipboard'
import { openInExplorer } from '../../utils/solanaExplorer'
import { colors } from '../../theme/colors'
import { typography } from '../../theme/typography'
import { useAppSelector } from '../../store/store'
import { useLogout } from '../../hooks/useLogout'
import { useUsdcBalance } from '../../hooks/useUsdcBalance'
import { useGetMyOwnerStatsQuery } from '../../store/api/reputationApi'
import { GlassCard, useModal, useToast, ProfileHeroSkeleton } from '../../components/ui'
import type { OwnerTier, OwnerBadge } from '../../types/api'

const NETWORK = (process.env.EXPO_PUBLIC_NETWORK ?? 'devnet').toLowerCase()
const isDevnet = NETWORK !== 'mainnet'

const OWNER_TIER_CONFIG: Record<OwnerTier, { label: string; color: string; xpNeeded: number }> = {
  client: { label: 'New Client', color: '#6B7280', xpNeeded: 50 },
  bronze: { label: 'Bronze', color: '#CD7F32', xpNeeded: 200 },
  silver: { label: 'Silver', color: '#9CA3AF', xpNeeded: 800 },
  gold: { label: 'Gold', color: '#F59E0B', xpNeeded: 2000 },
  platinum: { label: 'Platinum', color: colors.brand.secondary, xpNeeded: 9999 },
}

const OWNER_BADGE_CONFIG: Record<OwnerBadge, { label: string }> = {
  active_client: { label: 'Active Client' },
  big_spender: { label: 'Big Spender' },
  great_reviewer: { label: 'Great Reviewer' },
}

export default function ClientProfile() {
  const user = useAppSelector((s) => s.auth.user)
  const { logout, isLoggingOut } = useLogout()
  const { balance, isLoading: balanceLoading } = useUsdcBalance()
  const { data: ownerStats } = useGetMyOwnerStatsQuery()
  const { showModal } = useModal()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const displayName = user?.display_name || 'Anonymous'
  const handle = '@' + displayName.toLowerCase().replace(/\s+/g, '.')
  const initial = displayName[0].toUpperCase()
  const pubkey = user?.pubkey ?? ''
  const pubkeyShort = pubkey ? `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}` : '—'

  /* ── Copy wallet address ── */
  const copyAddress = async () => {
    if (!pubkey) return
    await Clipboard.setStringAsync(pubkey)
    setCopied(true)
    toast({ type: 'success', message: 'Wallet address copied to clipboard' })
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Logout confirmation ── */
  const confirmLogout = () => {
    showModal({
      title: 'Sign Out?',
      message: 'You will be returned to the sign-in screen. Your wallet stays connected.',
      actions: [
        {
          label: 'Cancel',
          style: 'cancel',
        },
        {
          label: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ],
    })
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Hero  */}
        <View style={s.hero}>
          <LinearGradient
            colors={[colors.brand.primary + '30', colors.brand.electric + '10', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          {!user ? (
            <ProfileHeroSkeleton />
          ) : (
            <SafeAreaView edges={['top']} style={s.heroContent}>
              <View style={s.avatarWrap}>
                <View style={s.avatarGlow} />
                <View style={s.avatar}>
                  <Text style={s.avatarLetter}>{initial}</Text>
                </View>
              </View>

              <Text style={[typography.h2, s.nameText]}>{displayName}</Text>
              <Text style={s.handleText}>{handle}</Text>

              {/* Wallet address — tap opens explorer, copy icon copies */}
              <TouchableOpacity style={s.pubkeyRow} onPress={() => openInExplorer(pubkey)} activeOpacity={0.7}>
                <Ionicons name="wallet-outline" size={13} color={colors.text.muted} />
                <Text style={s.pubkeyText}>{pubkeyShort}</Text>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={copyAddress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={14}
                    color={copied ? colors.states.success : colors.text.muted}
                  />
                </TouchableOpacity>
                <Ionicons name="open-outline" size={13} color={colors.text.muted} />
              </TouchableOpacity>
            </SafeAreaView>
          )}
        </View>

        <View style={s.body}>
          {/* ── Balance  */}
          <GlassCard intensity="low" border style={s.balanceCard}>
            <Text style={s.cardLabel}>CURRENT BALANCE</Text>
            <View style={s.balanceRow}>
              {balanceLoading ? (
                <ActivityIndicator size="small" color={colors.brand.secondary} style={{ marginVertical: 8 }} />
              ) : (
                <>
                  <Text style={s.balance}>
                    {(balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={s.unit}>USDC</Text>
                </>
              )}
            </View>
          </GlassCard>

          {/* ── Account details  */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Account Details</Text>
            <View style={s.infoGroup}>
              <View style={s.infoRow}>
                <View style={s.infoIcon}>
                  <Ionicons name="ribbon-outline" size={18} color={colors.brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>Account Rank</Text>
                  <Text style={s.infoValue}>Elite Client</Text>
                </View>
              </View>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <View style={s.infoIcon}>
                  <Ionicons name="person-outline" size={18} color={colors.brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>Username</Text>
                  <Text style={s.infoValue}>{handle}</Text>
                </View>
              </View>
              <View style={s.divider} />
              <View style={s.infoRow}>
                <View style={s.infoIcon}>
                  <Ionicons name="calendar-outline" size={18} color={colors.brand.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.infoLabel}>Member Since</Text>
                  <Text style={s.infoValue}>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                      : '—'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Reputation  */}
          {ownerStats &&
            (() => {
              const cfg = OWNER_TIER_CONFIG[ownerStats.tier] ?? OWNER_TIER_CONFIG.client
              const nextXp = cfg.xpNeeded
              const xp = ownerStats.xp_points ?? 0
              const xpPct = Math.min(100, (xp / nextXp) * 100)
              return (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Reputation</Text>
                  <GlassCard intensity="low" border style={s.repCard}>
                    {/* Tier row */}
                    <View style={s.repTierRow}>
                      <View
                        style={[s.repTierPill, { borderColor: cfg.color + '50', backgroundColor: cfg.color + '18' }]}
                      >
                        <Text style={[s.repTierLabel, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                      <View style={s.repXpBadge}>
                        <Ionicons name="flash" size={12} color={colors.brand.neon} />
                        <Text style={s.repXpText}>{xp.toLocaleString()} XP</Text>
                      </View>
                    </View>

                    {/* XP bar */}
                    {ownerStats.tier !== 'platinum' && (
                      <View style={{ gap: 4 }}>
                        <View style={s.repBarTrack}>
                          <LinearGradient
                            colors={[cfg.color + '90', cfg.color]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[s.repBarFill, { width: `${xpPct}%` }]}
                          />
                        </View>
                        <Text style={s.repBarHint}>
                          {xp} / {nextXp} XP to next tier
                        </Text>
                      </View>
                    )}

                    {/* Stats row */}
                    <View style={s.repStatsRow}>
                      <View style={s.repStat}>
                        <Text style={s.repStatValue}>{ownerStats.bounties_posted ?? 0}</Text>
                        <Text style={s.repStatLabel}>Posted</Text>
                      </View>
                      <View style={s.repStatDivider} />
                      <View style={s.repStat}>
                        <Text style={s.repStatValue}>{ownerStats.bounties_settled ?? 0}</Text>
                        <Text style={s.repStatLabel}>Settled</Text>
                      </View>
                      <View style={s.repStatDivider} />
                      <View style={s.repStat}>
                        <Text style={[s.repStatValue, { color: colors.brand.neon }]}>
                          ${(ownerStats.total_usdc_awarded ?? 0).toLocaleString()}
                        </Text>
                        <Text style={s.repStatLabel}>Awarded</Text>
                      </View>
                    </View>

                    {/* Badges */}
                    {(ownerStats.badges ?? []).length > 0 && (
                      <View style={s.repBadgesRow}>
                        {(ownerStats.badges ?? []).map((b) => {
                          const bc = OWNER_BADGE_CONFIG[b]
                          return (
                            <View key={b} style={s.repBadge}>
                              <Text style={s.repBadgeLabel}>{bc.label}</Text>
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </GlassCard>
                </View>
              )
            })()}

          {/* ── Sign out  */}
          <TouchableOpacity
            style={[s.logoutBtn, isLoggingOut && s.logoutBtnDisabled]}
            onPress={confirmLogout}
            activeOpacity={0.8}
            disabled={isLoggingOut}
          >
            <LinearGradient colors={['transparent', colors.states.error + '12']} style={StyleSheet.absoluteFill} />
            {isLoggingOut ? (
              <>
                <ActivityIndicator size="small" color={colors.states.error} />
                <Text style={s.logoutText}>Signing out…</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={18} color={colors.states.error} />
                <Text style={s.logoutText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.version}>Envoy v1.0 · AI Talent Marketplace</Text>
            <View style={[s.networkBadge, isDevnet ? s.networkDevnet : s.networkMainnet]}>
              <View style={[s.networkDot, { backgroundColor: isDevnet ? colors.states.warning : colors.states.success }]} />
              <Text style={[s.networkText, { color: isDevnet ? colors.states.warning : colors.states.success }]}>
                {isDevnet ? 'Devnet' : 'Mainnet'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { paddingBottom: 130 },

  /* ── Hero ── */
  hero: { backgroundColor: colors.background.secondary, overflow: 'hidden', minHeight: 260 },
  heroContent: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },

  avatarWrap: { position: 'relative', width: 96, height: 96 },
  avatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 52,
    backgroundColor: colors.brand.primary,
    opacity: 0.18,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface.elevated2,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 34, fontWeight: '900', color: colors.brand.primary },

  nameText: { color: colors.text.primary, marginTop: 14 },
  handleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.primaryLight,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  pubkeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.surface.base,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  pubkeyText: { fontSize: 12, color: colors.text.muted, fontWeight: '600', letterSpacing: 0.3 },

  /* ── Body ── */
  body: { paddingHorizontal: 20, paddingTop: 28, gap: 28 },

  /* ── Balance card ── */
  balanceCard: { padding: 24, alignItems: 'center', gap: 10 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: colors.text.muted, letterSpacing: 2 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  dollar: { fontSize: 18, fontWeight: '900', color: colors.brand.secondary },
  balance: { fontSize: 42, fontWeight: '900', color: colors.text.primary, letterSpacing: -1 },
  unit: { fontSize: 14, fontWeight: '800', color: colors.text.muted },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.states.success + '12',
    borderWidth: 1,
    borderColor: colors.states.success + '30',
  },
  balanceBadgeText: { fontSize: 12, fontWeight: '600', color: colors.states.success },

  /* ── Section ── */
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  infoGroup: {
    backgroundColor: colors.surface.base,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.brand.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border.subtle, marginHorizontal: 18 },

  /* ── Reputation card ── */
  repCard: { padding: 18, gap: 14 },
  repTierRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  repTierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  repTierEmoji: { fontSize: 16 },
  repTierLabel: { fontSize: 13, fontWeight: '800' },
  repXpBadge: {
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
  repXpText: { fontSize: 12, fontWeight: '800', color: colors.brand.neon },
  repBarTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  repBarFill: { height: '100%', borderRadius: 3 },
  repBarHint: { fontSize: 10, color: colors.text.muted, fontWeight: '600' },
  repStatsRow: { flexDirection: 'row', alignItems: 'center' },
  repStat: { flex: 1, alignItems: 'center', gap: 3 },
  repStatValue: { fontSize: 22, fontWeight: '900', color: colors.text.primary },
  repStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  repStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  repBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  repBadgeIcon: { fontSize: 14 },
  repBadgeLabel: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },

  /* ── Logout ── */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.states.error + '35',
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  logoutBtnDisabled: { opacity: 0.6 },
  logoutText: { fontSize: 16, fontWeight: '800', color: colors.states.error },

  version: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },

  /* ── Network flag ── */
  footer: { alignItems: 'center', gap: 8 },
  networkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  networkDevnet: {
    backgroundColor: colors.states.warning + '12',
    borderColor: colors.states.warning + '40',
  },
  networkMainnet: {
    backgroundColor: colors.states.success + '12',
    borderColor: colors.states.success + '40',
  },
  networkDot: { width: 6, height: 6, borderRadius: 3 },
  networkText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
})
