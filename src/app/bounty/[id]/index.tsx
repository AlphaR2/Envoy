import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { GlassCard, PremiumButton } from '../../../components/ui';
import {
  useGetBountyQuery,
  useGetSubmissionsQuery,
  useGetMyRegistrationQuery,
  useRegisterAgentForBountyMutation,
  useDeregisterAgentMutation,
  useRetryDispatchMutation,
  useClaimRefundMutation,
} from '../../../store/api/bountiesApi';
import { useGetMyAgentsQuery } from '../../../store/api/agentsApi';
import { useSolanaTransaction } from '../../../hooks/useSolanaTransaction';
import { useToast } from '../../../components/ui/Toast';
import { useAppSelector } from '../../../store/store';
import { openInExplorer, shortAddress } from '../../../utils/solanaExplorer';
import { BountyState, DispatchState, Agent } from '../../../types/api';
// DispatchState used via DISPATCH_CONFIG record key

const DISPATCH_CONFIG: Record<DispatchState, { label: string; color: string; icon: string }> = {
  pending:    { label: 'Notifying agent...',          color: colors.text.muted,         icon: 'time-outline' },
  dispatched: { label: 'Agent notified',              color: colors.states.success,     icon: 'checkmark-circle' },
  queued:     { label: 'Waiting for agent to poll',   color: colors.brand.secondary,    icon: 'hourglass-outline' },
  failed:     { label: 'Delivery failed',             color: colors.states.error,       icon: 'alert-circle-outline' },
};

const STATE_CONFIG: Record<BountyState, { label: string; color: string; icon: string }> = {
  draft:        { label: 'Confirming Escrow', color: colors.text.muted,      icon: 'time-outline' },
  open:         { label: 'Accepting Agents',  color: colors.states.success,  icon: 'radio-button-on' },
  under_review: { label: 'Under Review',      color: colors.brand.secondary, icon: 'eye-outline' },
  settled:      { label: 'Settled',           color: colors.brand.primary,   icon: 'checkmark-circle' },
  cancelled:    { label: 'Cancelled',         color: colors.states.error,    icon: 'close-circle' },
  refunded:     { label: 'Refunded',          color: colors.states.warning,  icon: 'arrow-undo-circle' },
};

// ── Register Agent Modal ─────────────────────────────────────────────────────
function RegisterModal({
  visible,
  agents,
  onClose,
  onRegister,
  registering,
}: {
  visible: boolean;
  agents: Agent[];
  onClose: () => void;
  onRegister: (agentId: string) => void;
  registering: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedId) onRegister(selectedId);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <TouchableOpacity style={m.overlay} activeOpacity={1} onPress={handleClose} />
      <View style={m.sheet}>
        {/* Drag handle */}
        <View style={m.handle} />

        <Text style={m.title}>Choose an Agent</Text>
        <Text style={m.subtitle}>Select which agent will enter this bounty</Text>

        {agents.length === 0 ? (
          <View style={m.emptyWrap}>
            <Ionicons name="hardware-chip-outline" size={40} color={colors.text.muted} />
            <Text style={m.emptyText}>No agents deployed yet.{'\n'}Deploy an agent first.</Text>
          </View>
        ) : (
          <FlatList
            data={agents}
            keyExtractor={(a) => a.id}
            style={m.list}
            contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
            renderItem={({ item }) => {
              const selected = selectedId === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedId(item.id)}
                  style={[m.agentCard, selected && m.agentCardActive]}
                >
                  <View style={[m.agentIcon, selected && m.agentIconActive]}>
                    <Image
                      source={require('../../../../assets/images/headaai.png')}
                      style={m.agentImg}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.agentName, selected && m.agentNameActive]}>{item.name}</Text>
                    <Text style={m.agentCats} numberOfLines={1}>
                      {item.categories.join(' · ')}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.brand.secondary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        <TouchableOpacity
          style={[m.confirmBtn, (!selectedId || registering) && m.confirmBtnDisabled]}
          activeOpacity={0.85}
          onPress={handleConfirm}
          disabled={!selectedId || registering}
        >
          {registering ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <LinearGradient
                colors={[colors.brand.secondary, colors.brand.neon]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={m.confirmBtnText}>Register Agent</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function BountyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const user = useAppSelector((s) => s.auth.user);
  const isClient = user?.user_type === 'client';

  const { data: bounty, isLoading } = useGetBountyQuery(id ?? '', { skip: !id });
  const { data: submissions } = useGetSubmissionsQuery(id ?? '', {
    skip: !id || (bounty?.state !== 'under_review' && bounty?.state !== 'settled'),
  });
  const { data: myAgents = [] } = useGetMyAgentsQuery(undefined, { skip: isClient });
  // Fetch server-side registration — covers all states (pending/dispatched/queued/failed/submitted/winner)
  const { data: myRegistration, isLoading: regLoading } = useGetMyRegistrationQuery(id ?? '', {
    skip: !id || isClient,
  });

  const [registerAgent] = useRegisterAgentForBountyMutation();
  const [deregisterAgent] = useDeregisterAgentMutation();
  const [retryDispatch] = useRetryDispatchMutation();
  const [claimRefund] = useClaimRefundMutation();
  const { signAndSend } = useSolanaTransaction();

  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deregistering, setDeregistering] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [claimingRefund, setClaimingRefund] = useState(false);


  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRegister = async (agentId: string) => {
    if (!id) return;
    setRegistering(true);
    try {
      await registerAgent({ bountyId: id, agentId }).unwrap();
      setRegisterModalVisible(false);
      toast({ message: "Agent registered! You'll be dispatched the bounty soon.", type: 'success' });
    } catch (err) {
      const msg = (err as any)?.data?.message;
      toast({ message: msg ?? 'Failed to register. Please try again.', type: 'error' });
    } finally {
      setRegistering(false);
    }
  };

  const handleDeregister = async () => {
    if (!id || !myRegistration) return;
    setDeregistering(true);
    try {
      await deregisterAgent({ bountyId: id, agentId: myRegistration.agent_id }).unwrap();
      toast({ message: 'Withdrawn from bounty.', type: 'success' });
    } catch (err) {
      const msg = (err as any)?.data?.message;
      toast({ message: msg ?? 'Failed to withdraw. Please try again.', type: 'error' });
    } finally {
      setDeregistering(false);
    }
  };

  const handleRetry = async () => {
    if (!id || !myRegistration) return;
    setRetrying(true);
    try {
      await retryDispatch({ bountyId: id, registrationId: myRegistration.id }).unwrap();
      toast({ message: 'Retrying dispatch to your agent...', type: 'success' });
    } catch (err) {
      const msg = (err as any)?.data?.message;
      toast({ message: msg ?? 'Retry failed. Please try again.', type: 'error' });
    } finally {
      setRetrying(false);
    }
  };

  const handleClaimRefund = async () => {
    if (!id) return;
    setClaimingRefund(true);
    try {
      const { tx } = await claimRefund(id).unwrap();
      let signature: string;
      try {
        signature = await signAndSend(tx);
      } catch {
        toast({ message: 'Transaction cancelled.', type: 'error' });
        return;
      }
      toast({ message: 'Refund claimed! Funds returned to your wallet.', type: 'success' });
      router.back();
    } catch (err) {
      const msg = (err as any)?.data?.message;
      toast({ message: msg ?? 'Failed to claim refund. Please try again.', type: 'error' });
    } finally {
      setClaimingRefund(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading || !bounty) {
    return (
      <View style={s.loader}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  const cfg = STATE_CONFIG[bounty.state] ?? STATE_CONFIG.draft;
  const submissionCount = submissions?.length ?? 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const registeredAgent = myRegistration ? myAgents.find((a) => a.id === myRegistration.agent_id) : undefined;
  const isSubmitted = !!myRegistration?.deliverable_id;
  const isWinner = !!myRegistration?.is_winner;
  const canClaimRefund = isClient && (bounty.state === 'cancelled' || bounty.state === 'refunded');

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[colors.brand.primary + '10', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>Bounty Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* State badge */}
          <View style={[s.stateBadge, { borderColor: cfg.color + '50', backgroundColor: cfg.color + '15' }]}>
            <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[s.stateText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {/* Title & category */}
          <Text style={s.title}>{bounty.title}</Text>
          <View style={s.metaRow}>
            <View style={s.categoryChip}>
              <Text style={s.categoryText}>{bounty.category}</Text>
            </View>
            <View style={s.categoryChip}>
              <Text style={s.categoryText}>{bounty.deliverable_format}</Text>
            </View>
          </View>

          {/* Prize card */}
          <GlassCard intensity="medium" style={s.prizeCard}>
            <LinearGradient
              colors={[colors.brand.primary + '20', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.prizeRow}>
              <View>
                <Text style={s.prizeLabel}>Prize</Text>
                <Text style={s.prizeValue}>{bounty.prize_usdc} USDC</Text>
              </View>
              {bounty.escrow_address && (
                <View style={s.escrowBadge}>
                  <Ionicons name="shield-checkmark" size={14} color={colors.states.success} />
                  <Text style={s.escrowText}>In Escrow</Text>
                </View>
              )}
            </View>
            {bounty.escrow_address && (
              <TouchableOpacity
                style={s.escrowAddressRow}
                onPress={() => openInExplorer(bounty.escrow_address!)}
                activeOpacity={0.7}
              >
                <Ionicons name="lock-closed-outline" size={12} color={colors.brand.secondary} />
                <Text style={s.escrowAddressText} numberOfLines={1}>
                  {shortAddress(bounty.escrow_address)}
                </Text>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={async () => {
                    await Clipboard.setStringAsync(bounty.escrow_address!);
                    toast({ message: 'Escrow address copied', type: 'success' });
                  }}
                >
                  <Ionicons name="copy-outline" size={12} color={colors.text.muted} />
                </TouchableOpacity>
                <Ionicons name="open-outline" size={12} color={colors.brand.secondary} />
              </TouchableOpacity>
            )}
          </GlassCard>

          {/* Registration & submission stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Ionicons name="people-outline" size={16} color={colors.text.muted} />
              <Text style={s.statValue}>{bounty.registration_count}</Text>
              <Text style={s.statLabel}>registered</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Ionicons name="document-text-outline" size={16} color={colors.text.muted} />
              <Text style={s.statValue}>{bounty.submission_count}</Text>
              <Text style={s.statLabel}>submitted</Text>
            </View>
            {bounty.max_participants !== null && (
              <>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Ionicons name="shield-outline" size={16} color={colors.text.muted} />
                  <Text style={s.statValue}>{bounty.max_participants}</Text>
                  <Text style={s.statLabel}>max agents</Text>
                </View>
              </>
            )}
          </View>

          {/* Description */}
          <GlassCard intensity="low" style={s.descCard}>
            <Text style={s.sectionLabel}>Task Description</Text>
            <Text style={s.description}>{bounty.description}</Text>
          </GlassCard>

          {/* Deadlines */}
          <GlassCard intensity="low" style={s.infoCard}>
            <Text style={s.sectionLabel}>Timeline</Text>
            <View style={s.infoRow}>
              <Ionicons name="time-outline" size={16} color={colors.brand.secondary} />
              <View>
                <Text style={s.infoLabel}>Submission Deadline</Text>
                <Text style={s.infoValue}>{formatDate(bounty.submission_deadline)}</Text>
              </View>
            </View>
            <View style={s.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.brand.primary} />
              <View>
                <Text style={s.infoLabel}>Review Deadline</Text>
                <Text style={s.infoValue}>{formatDate(bounty.review_deadline)}</Text>
              </View>
            </View>
          </GlassCard>

          {/* ── State-based content ────────────────────────────────────── */}

          {/* DRAFT */}
          {bounty.state === 'draft' && (
            <GlassCard intensity="low" style={s.stateCard}>
              <ActivityIndicator size="small" color={colors.brand.primary} />
              <Text style={s.stateMessage}>Waiting for escrow confirmation on Solana...</Text>
            </GlassCard>
          )}

          {/* OPEN — client sees live notice; freelancer sees register state machine */}
          {bounty.state === 'open' && (
            <>
              {isClient ? (
                <GlassCard intensity="low" style={s.stateCard}>
                  <Ionicons name="radio-button-on" size={20} color={colors.states.success} />
                  <Text style={s.stateMessage}>Live — accepting agent registrations</Text>
                </GlassCard>
              ) : regLoading ? (
                <GlassCard intensity="low" style={s.stateCard}>
                  <ActivityIndicator size="small" color={colors.brand.secondary} />
                  <Text style={s.stateMessage}>Checking registration...</Text>
                </GlassCard>
              ) : isWinner ? (
                /* 🏆 Winner */
                <GlassCard intensity="low" style={[s.stateCard, { borderColor: colors.brand.primary + '60' }]}>
                  <Text style={{ fontSize: 22 }}>🏆</Text>
                  <Text style={[s.stateMessage, { color: colors.brand.primary }]}>Winner!</Text>
                </GlassCard>
              ) : isSubmitted ? (
                /* Submitted ✓ */
                <GlassCard intensity="low" style={[s.stateCard, { borderColor: colors.states.success + '40' }]}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.states.success} />
                  <Text style={[s.stateMessage, { color: colors.states.success }]}>Submitted ✓</Text>
                </GlassCard>
              ) : myRegistration ? (
                /* Registered — show dispatch state badge + withdraw/retry */
                <GlassCard intensity="low" style={[s.stateCard, { borderColor: DISPATCH_CONFIG[myRegistration.dispatch_state].color + '40' }]}>
                  <View style={s.registeredIconWrap}>
                    <Ionicons name={DISPATCH_CONFIG[myRegistration.dispatch_state].icon as any} size={22} color={DISPATCH_CONFIG[myRegistration.dispatch_state].color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.stateMessage, { color: DISPATCH_CONFIG[myRegistration.dispatch_state].color }]}>
                      {DISPATCH_CONFIG[myRegistration.dispatch_state].label}
                    </Text>
                    {registeredAgent && (
                      <Text style={s.registeredAgentLabel}>{registeredAgent.name}</Text>
                    )}
                  </View>
                  {myRegistration.dispatch_state === 'failed' ? (
                    <TouchableOpacity style={s.retryBtn} activeOpacity={0.75} onPress={handleRetry} disabled={retrying}>
                      {retrying
                        ? <ActivityIndicator size="small" color={colors.states.warning} />
                        : <Text style={s.retryBtnText}>Retry</Text>}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={s.withdrawBtn} activeOpacity={0.75} onPress={handleDeregister} disabled={deregistering}>
                      {deregistering
                        ? <ActivityIndicator size="small" color={colors.states.error} />
                        : <Text style={s.withdrawBtnText}>Withdraw</Text>}
                    </TouchableOpacity>
                  )}
                </GlassCard>
              ) : (
                /* Not registered */
                <>
                  <GlassCard intensity="low" style={s.stateCard}>
                    <Ionicons name="radio-button-on" size={20} color={colors.states.success} />
                    <Text style={s.stateMessage}>Live — open for agent registration</Text>
                  </GlassCard>
                  <PremiumButton
                    label="Enter Bounty"
                    onPress={() => setRegisterModalVisible(true)}
                    style={s.actionBtn}
                  />
                </>
              )}
            </>
          )}

          {/* UNDER REVIEW */}
          {bounty.state === 'under_review' && (
            <>
              <GlassCard intensity="low" style={s.stateCard}>
                <Ionicons name="eye-outline" size={20} color={colors.brand.secondary} />
                <Text style={s.stateMessage}>
                  {isClient
                    ? `${submissionCount} submission${submissionCount !== 1 ? 's' : ''} ready for review`
                    : isWinner ? '🏆 Your agent won!'
                    : myRegistration?.deliverable_id ? 'Your submission is under review'
                    : 'Under review — awaiting client decision'}
                </Text>
              </GlassCard>

              {submissions && submissions.length > 0 && (
                <>
                  <Text style={s.subHeader}>Submissions</Text>
                  {submissions.map((sub) => (
                    <GlassCard key={sub.id} intensity="low" style={s.submissionCard}>
                      <View style={s.submissionHeader}>
                        <View style={s.agentAvatar}>
                          <Image source={require('../../../../assets/images/headaai.png')} style={s.agentAvatarImg} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.agentName}>{sub.agent_name ?? 'Agent'}</Text>
                          <Text style={s.submittedAt}>
                            {new Date(sub.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <View style={s.formatBadge}>
                          <Text style={s.formatText}>{sub.deliverable_format}</Text>
                        </View>
                      </View>
                      {sub.notes && (
                        <Text style={s.submissionNotes} numberOfLines={3}>{sub.notes}</Text>
                      )}
                      {sub.deliverable_url && (
                        <View style={s.deliverableLink}>
                          <Ionicons name="link-outline" size={14} color={colors.brand.secondary} />
                          <Text style={s.deliverableLinkText} numberOfLines={1}>{sub.deliverable_url}</Text>
                        </View>
                      )}
                    </GlassCard>
                  ))}

                  {isClient && (
                    <PremiumButton
                      label="Select Winner"
                      onPress={() => router.push(`/bounty/${id}/winner`)}
                      style={s.actionBtn}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* SETTLED */}
          {bounty.state === 'settled' && (
            <>
              <GlassCard intensity="low" style={[s.stateCard, { borderColor: isWinner ? colors.brand.primary + '60' : colors.brand.primary + '40' }]}>
                {isWinner ? (
                  <Text style={{ fontSize: 20 }}>🏆</Text>
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                )}
                <Text style={[s.stateMessage, isWinner && { color: colors.brand.primary }]}>
                  {isWinner ? 'Your agent won this bounty!' : 'Bounty settled — winner has been paid'}
                </Text>
              </GlassCard>
              {isClient && bounty.winner_agent_id && (
                <PremiumButton
                  label="Rate the Work"
                  onPress={() => router.push(`/bounty/${id}/rate`)}
                  style={s.actionBtn}
                  variant="secondary"
                />
              )}
            </>
          )}

          {/* CANCELLED — client can claim escrow refund */}
          {bounty.state === 'cancelled' && (
            <>
              <GlassCard intensity="low" style={[s.stateCard, { borderColor: colors.states.error + '30' }]}>
                <Ionicons name="close-circle" size={20} color={colors.states.error} />
                <Text style={s.stateMessage}>Bounty was cancelled</Text>
              </GlassCard>
              {canClaimRefund && (
                <PremiumButton
                  label={claimingRefund ? 'Signing Transaction...' : 'Claim Refund'}
                  onPress={handleClaimRefund}
                  loading={claimingRefund}
                  disabled={claimingRefund}
                  style={s.actionBtn}
                  variant="secondary"
                />
              )}
            </>
          )}

          {/* REFUNDED — client can also claim if they haven't yet */}
          {bounty.state === 'refunded' && (
            <>
              <GlassCard intensity="low" style={[s.stateCard, { borderColor: colors.states.warning + '30' }]}>
                <Ionicons name="arrow-undo-circle" size={20} color={colors.states.warning} />
                <Text style={s.stateMessage}>Bounty refunded — no winner was selected in time</Text>
              </GlassCard>
              {canClaimRefund && (
                <PremiumButton
                  label={claimingRefund ? 'Signing Transaction...' : 'Claim Refund'}
                  onPress={handleClaimRefund}
                  loading={claimingRefund}
                  disabled={claimingRefund}
                  style={s.actionBtn}
                  variant="secondary"
                />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Register Agent Modal */}
      <RegisterModal
        visible={registerModalVisible}
        agents={myAgents}
        onClose={() => setRegisterModalVisible(false)}
        onRegister={handleRegister}
        registering={registering}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  loader: { flex: 1, backgroundColor: colors.background.primary, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text.primary, flex: 1, textAlign: 'center' },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },
  stateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  stateText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text.primary, lineHeight: 30, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  categoryText: { fontSize: 12, fontWeight: '600', color: colors.text.muted },
  prizeCard: { padding: 20, borderRadius: 20, overflow: 'hidden' },
  prizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prizeLabel: { fontSize: 12, fontWeight: '600', color: colors.text.muted },
  prizeValue: { fontSize: 28, fontWeight: '900', color: colors.brand.secondary, marginTop: 2 },
  escrowBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.states.success + '20',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  escrowText: { fontSize: 12, fontWeight: '700', color: colors.states.success },
  escrowAddressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    marginTop: 4,
  },
  escrowAddressText: {
    fontSize: 12, fontFamily: 'monospace', color: colors.brand.secondary,
    flex: 1,
  },
  descCard: { padding: 16, borderRadius: 20, gap: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  description: { fontSize: 14, color: colors.text.secondary, lineHeight: 22 },
  infoCard: { padding: 16, borderRadius: 20, gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: 11, fontWeight: '600', color: colors.text.muted },
  infoValue: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  stateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 20,
  },
  stateMessage: { fontSize: 14, fontWeight: '600', color: colors.text.secondary, flex: 1 },
  registeredIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  registeredAgentLabel: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  withdrawBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1, borderColor: colors.states.error + '60',
    backgroundColor: colors.states.error + '10',
    minWidth: 72, alignItems: 'center',
  },
  withdrawBtnText: { fontSize: 13, fontWeight: '700', color: colors.states.error },
  retryBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1, borderColor: colors.states.warning + '60',
    backgroundColor: colors.states.warning + '10',
    minWidth: 72, alignItems: 'center',
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: colors.states.warning },
  subHeader: { fontSize: 13, fontWeight: '700', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  submissionCard: { padding: 16, borderRadius: 20, gap: 10 },
  submissionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentAvatar: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: colors.brand.secondary + '15',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  agentAvatarImg: { width: 36, height: 36, borderRadius: 12 },
  agentName: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  submittedAt: { fontSize: 11, color: colors.text.muted, marginTop: 1 },
  formatBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  formatText: { fontSize: 11, fontWeight: '600', color: colors.text.muted },
  submissionNotes: { fontSize: 13, color: colors.text.secondary, lineHeight: 19 },
  deliverableLink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.brand.secondary + '10',
    borderRadius: 10, padding: 10,
  },
  deliverableLinkText: { fontSize: 12, color: colors.brand.secondary, flex: 1 },
  actionBtn: { marginTop: 8, borderRadius: 20 },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, borderWidth: 1, borderColor: colors.border.subtle,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1, alignItems: 'center', gap: 4,
  },
  statValue: {
    fontSize: 20, fontWeight: '900', color: colors.text.primary,
  },
  statLabel: {
    fontSize: 10, fontWeight: '600', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  statDivider: {
    width: 1, height: 36, backgroundColor: colors.border.subtle,
  },
});

// ── Modal Styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border.default,
    alignSelf: 'center', marginBottom: 20,
  },
  title: {
    fontSize: 20, fontWeight: '800', color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13, color: colors.text.muted, marginBottom: 16,
  },
  list: { flexGrow: 0, maxHeight: 320 },
  agentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: colors.surface.base,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  agentCardActive: {
    borderColor: colors.brand.secondary,
    backgroundColor: colors.brand.secondary + '10',
  },
  agentIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  agentIconActive: {
    backgroundColor: colors.brand.secondary + '15',
  },
  agentImg: { width: 40, height: 40, borderRadius: 12 },
  agentName: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  agentNameActive: { color: colors.brand.secondary },
  agentCats: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  confirmBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand.secondary,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emptyWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText: { fontSize: 14, color: colors.text.muted, textAlign: 'center', lineHeight: 22 },
});
