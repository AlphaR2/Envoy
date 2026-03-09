import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../theme/colors';
import { GlassCard, PremiumButton } from '../../../components/ui';
import { useGetBountyQuery } from '../../../store/api/bountiesApi';
import { useRateBountyMutation } from '../../../store/api/reputationApi';
import { useToast } from '../../../components/ui/Toast';

const STAR_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
const STAR_COLORS = ['', colors.states.error, colors.states.warning, colors.brand.secondary, colors.brand.primary, colors.states.success];

export default function RateDeliverableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [rateBounty, { isLoading }] = useRateBountyMutation();
  const { data: bounty } = useGetBountyQuery(id ?? '', { skip: !id });

  const [qualityScore, setQualityScore] = useState(0); // 0 = unset, 1-5 = star rating
  const [wasOnTime, setWasOnTime] = useState(true);

  const scoreColor = qualityScore > 0 ? STAR_COLORS[qualityScore] : colors.text.muted;
  const scoreLabel = qualityScore > 0 ? STAR_LABELS[qualityScore] : 'Select a rating';

  const handleSubmit = async () => {
    if (!id || !bounty?.winner_agent_id || qualityScore === 0) return;
    try {
      await rateBounty({
        bountyId: id,
        agentId: bounty.winner_agent_id,
        qualityScore,
        wasOnTime,
      }).unwrap();
      toast({ message: 'Rating submitted! +15 XP earned.', type: 'success' });
      router.back();
    } catch (err) {
      console.error('Rating failed:', err);
      toast({ message: 'Failed to submit rating. Try again.', type: 'error' });
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
          <Text style={s.headerTitle}>Rate the Work</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.content}>
          {/* Score display */}
          <GlassCard intensity="medium" style={s.scoreCard}>
            <LinearGradient
              colors={[scoreColor + '20', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            {qualityScore > 0 ? (
              <View style={s.starDisplay}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons
                    key={n}
                    name={n <= qualityScore ? 'star' : 'star-outline'}
                    size={32}
                    color={scoreColor}
                  />
                ))}
              </View>
            ) : (
              <Text style={s.scorePlaceholder}>★★★★★</Text>
            )}
            <Text style={[s.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>
            <Text style={s.scoreSubLabel}>Quality Score (1–5)</Text>
          </GlassCard>

          {/* Star selector */}
          <Text style={s.sectionLabel}>Select a Star Rating</Text>
          <View style={s.scoreRow}>
            {[1, 2, 3, 4, 5].map((val) => {
              const active = qualityScore === val;
              const col = STAR_COLORS[val];
              return (
                <TouchableOpacity
                  key={val}
                  style={[s.scoreBtn, active && { backgroundColor: col + '30', borderColor: col }]}
                  onPress={() => setQualityScore(val)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="star" size={18} color={active ? col : colors.text.muted} />
                  <Text style={[s.scoreBtnText, active && { color: col }]}>{val}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* On time toggle */}
          <GlassCard intensity="low" style={s.onTimeCard}>
            <View style={s.onTimeRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.onTimeLabel}>Was the work delivered on time?</Text>
                <Text style={s.onTimeSubLabel}>Agents are rewarded for meeting deadlines.</Text>
              </View>
              <Switch
                value={wasOnTime}
                onValueChange={setWasOnTime}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.brand.primary }}
                thumbColor={wasOnTime ? colors.brand.electric : colors.text.muted}
              />
            </View>
          </GlassCard>

          <PremiumButton
            label={isLoading ? 'Submitting...' : 'Submit Rating'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || qualityScore === 0}
            style={s.submitBtn}
          />

          <Text style={s.hint}>
            Ratings update the agent's leaderboard score immediately. You earn +15 XP.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
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
  content: { flex: 1, padding: 16, gap: 16 },
  scoreCard: { alignItems: 'center', padding: 32, borderRadius: 24, overflow: 'hidden', gap: 8 },
  starDisplay: { flexDirection: 'row', gap: 6 },
  scorePlaceholder: { fontSize: 36, color: 'rgba(255,255,255,0.15)', letterSpacing: 4 },
  scoreLabel: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },
  scoreSubLabel: { fontSize: 12, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  scoreRow: { flexDirection: 'row', gap: 10 },
  scoreBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 4,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scoreBtnText: { fontSize: 13, fontWeight: '700', color: colors.text.muted },
  onTimeCard: { padding: 16, borderRadius: 20 },
  onTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  onTimeLabel: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  onTimeSubLabel: { fontSize: 12, color: colors.text.muted, marginTop: 3 },
  submitBtn: { borderRadius: 20 },
  hint: { fontSize: 12, color: colors.text.muted, textAlign: 'center', lineHeight: 18 },
});
