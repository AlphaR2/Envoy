import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { GlassCard, PremiumButton } from '../../../components/ui';
import {
  useGetSubmissionsQuery,
  useSelectWinnerMutation,
} from '../../../store/api/bountiesApi';
import { useSolanaTransaction } from '../../../hooks/useSolanaTransaction';
import { useToast } from '../../../components/ui/Toast';

export default function SelectWinnerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { signAndSend } = useSolanaTransaction();
  const [selectWinner, { isLoading }] = useSelectWinnerMutation();

  const { data: submissions, isLoading: loadingSubmissions } = useGetSubmissionsQuery(id ?? '', { skip: !id });
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const handleConfirm = async () => {
    if (!selectedAgentId || !id) return;
    setIsSigning(true);
    try {
      const { tx } = await selectWinner({ bountyId: id, winnerAgentId: selectedAgentId }).unwrap();
      await signAndSend(tx);
      toast({ message: 'Winner selected! Payment released from escrow.', type: 'success' });
      router.back();
      router.back(); // back to bounty detail which will refresh
    } catch (err) {
      console.error('Select winner failed:', err);
      toast({ message: 'Failed to select winner. Please try again.', type: 'error' });
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[colors.brand.primary + '14', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Select Winner</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={s.subtitle}>
          The winner receives the full prize from escrow. This action cannot be undone.
        </Text>

        {loadingSubmissions ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
          </View>
        ) : !submissions || submissions.length === 0 ? (
          <View style={s.center}>
            <Ionicons name="document-outline" size={40} color={colors.text.muted} />
            <Text style={s.emptyText}>No submissions yet</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {submissions.map((sub) => {
              const isSelected = selectedAgentId === sub.agent_id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => setSelectedAgentId(sub.agent_id)}
                  activeOpacity={0.85}
                >
                  <GlassCard
                    intensity="low"
                    style={[s.card, isSelected && s.cardSelected]}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[colors.brand.primary + '18', 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <View style={s.cardHeader}>
                      <View style={s.agentAvatar}>
                        <Image source={require('../../../../assets/images/headaai.png')} style={s.agentAvatarImg} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.agentName}>{sub.agent_name ?? 'Agent'}</Text>
                        <Text style={s.submittedAt}>
                          {new Date(sub.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View style={[s.selectCircle, isSelected && s.selectCircleActive]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </View>

                    {sub.notes && (
                      <Text style={s.notes} numberOfLines={4}>{sub.notes}</Text>
                    )}

                    {sub.deliverable_url && (
                      <View style={s.linkRow}>
                        <Ionicons name="link-outline" size={14} color={colors.brand.secondary} />
                        <Text style={s.linkText} numberOfLines={1}>{sub.deliverable_url}</Text>
                      </View>
                    )}

                    <View style={s.formatBadge}>
                      <Text style={s.formatText}>{sub.deliverable_format}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Bottom action */}
        <View style={s.footer}>
          <PremiumButton
            label={isSigning ? 'Signing Transaction...' : 'Confirm & Pay Winner'}
            onPress={handleConfirm}
            loading={isLoading || isSigning}
            disabled={!selectedAgentId || isLoading || isSigning}
            style={s.confirmBtn}
          />
          {selectedAgentId && (
            <Text style={s.footerHint}>
              A Solana transaction will release funds from escrow to the winner's wallet.
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: colors.text.muted },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text.primary },
  subtitle: {
    fontSize: 13, color: colors.text.muted, textAlign: 'center',
    paddingHorizontal: 24, marginBottom: 16, lineHeight: 19,
  },
  scroll: { padding: 16, gap: 12, paddingBottom: 20 },
  card: { padding: 16, borderRadius: 20, gap: 12, overflow: 'hidden' },
  cardSelected: { borderColor: colors.brand.primary + '80', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentAvatar: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: colors.brand.secondary + '15',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  agentAvatarImg: { width: 40, height: 40, borderRadius: 14 },
  agentName: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  submittedAt: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  selectCircle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  selectCircleActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  notes: { fontSize: 13, color: colors.text.secondary, lineHeight: 19 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.brand.secondary + '10',
    borderRadius: 10, padding: 10,
  },
  linkText: { fontSize: 12, color: colors.brand.secondary, flex: 1 },
  formatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  formatText: { fontSize: 11, fontWeight: '600', color: colors.text.muted },
  footer: { padding: 16, paddingBottom: 8, gap: 10 },
  confirmBtn: { borderRadius: 20 },
  footerHint: { fontSize: 11, color: colors.text.muted, textAlign: 'center', lineHeight: 16 },
});
