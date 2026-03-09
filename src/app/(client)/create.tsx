import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';
import { GlassCard, PremiumButton } from '../../components/ui';
import { useCreateBountyMutation, useConfirmBountyMutation } from '../../store/api/bountiesApi';
import { useSolanaTransaction } from '../../hooks/useSolanaTransaction';
import { BountyCategory, DeliverableFormat } from '../../types/api';
import { useToast } from '../../components/ui/Toast';

const CATEGORIES: { value: BountyCategory; label: string; icon: string }[] = [
  { value: 'DEVELOPMENT', label: 'Development', icon: '💻' },
  { value: 'RESEARCH', label: 'Research', icon: '🔬' },
  { value: 'WRITING', label: 'Writing', icon: '✍️' },
  { value: 'SECURITY', label: 'Security', icon: '🔐' },
];

const FORMATS: { value: DeliverableFormat; label: string }[] = [
  { value: 'document', label: 'Document' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'code', label: 'Code' },
  { value: 'data', label: 'Data' },
];

type DatePickerTarget = 'submission' | 'review' | null;

export default function PostJobScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [createBounty, { isLoading }] = useCreateBountyMutation();
  const [confirmBounty] = useConfirmBountyMutation();
  const { signAndSend } = useSolanaTransaction();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BountyCategory | null>(null);
  const [format, setFormat] = useState<DeliverableFormat | null>(null);
  const [prize, setPrize] = useState('');
  const [maxAgents, setMaxAgents] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [reviewDeadline, setReviewDeadline] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 9);
    return d;
  });
  // iOS only — Android uses imperative DateTimePickerAndroid.open()
  const [iosPickerTarget, setIosPickerTarget] = useState<DatePickerTarget>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fmtDate = (d: Date) =>
    d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Open date picker (platform-aware) ───────────────────────────
  const openDatePicker = (target: 'submission' | 'review') => {
    const current = target === 'submission' ? submissionDeadline : reviewDeadline;

    if (Platform.OS === 'android') {
      // Imperative API — no component needed, avoids the Fabric dismiss() crash
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: new Date(),
        onChange: (_evt: DateTimePickerEvent, selected?: Date) => {
          if (!selected) return;
          if (target === 'submission') setSubmissionDeadline(selected);
          else setReviewDeadline(selected);
        },
      });
    } else {
      // iOS: render the component inline
      setIosPickerTarget(target);
    }
  };

  // iOS picker onChange
  const onIosDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    setIosPickerTarget(null);
    if (!selected) return;
    if (iosPickerTarget === 'submission') setSubmissionDeadline(selected);
    if (iosPickerTarget === 'review') setReviewDeadline(selected);
  };

  const prizeNum = parseFloat(prize);
  const prizeError = prize.length > 0 && (isNaN(prizeNum) || prizeNum < 5)
    ? 'Minimum prize is $5 USDC'
    : null;

  const isValid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    category !== null &&
    format !== null &&
    prizeNum >= 5 &&
    reviewDeadline > submissionDeadline;

  const handleCreate = async () => {
    if (!category || !format) return;
    setIsSubmitting(true);
    try {
      const { bountyId, tx } = await createBounty({
        title: title.trim(),
        description: description.trim(),
        category,
        deliverableFormat: format,
        prizeUsdc: parseFloat(prize),
        submissionDeadline: submissionDeadline.toISOString(),
        reviewDeadline: reviewDeadline.toISOString(),
        maxParticipants: maxAgents ? parseInt(maxAgents, 10) : undefined,
      }).unwrap();

      let signature: string;
      try {
        signature = await signAndSend(tx);
      } catch {
        toast({ message: 'Transaction cancelled.', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      await confirmBounty({ bountyId, signature }).unwrap();

      toast({ message: 'Bounty created! Agents will start registering soon.', type: 'success' });
      router.replace('/(client)/jobs');
    } catch (err) {
      const apiMessage = (err as any)?.data?.message;
      toast({ message: apiMessage ?? 'Failed to create bounty. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[colors.brand.primary + '14', 'transparent']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1, marginBottom: 32 }} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post a Bounty</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <GlassCard intensity="low" style={s.card}>
              <Text style={s.label}>Title *</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Write a market analysis report"
                placeholderTextColor={colors.text.muted}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />
              <Text style={s.charCount}>{title.length}/200</Text>
            </GlassCard>

            {/* Description */}
            <GlassCard intensity="low" style={s.card}>
              <Text style={s.label}>Description & Acceptance Criteria *</Text>
              <TextInput
                style={[s.input, s.textarea]}
                placeholder="Describe the task in detail. Include what a good submission looks like."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={5}
                value={description}
                onChangeText={setDescription}
                textAlignVertical="top"
              />
            </GlassCard>

            {/* Category */}
            <Text style={s.sectionLabel}>Category *</Text>
            <View style={s.chipRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[s.chip, category === cat.value && s.chipActive]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={s.chipEmoji}>{cat.icon}</Text>
                  <Text style={[s.chipText, category === cat.value && s.chipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Deliverable Format */}
            <Text style={s.sectionLabel}>Deliverable Format *</Text>
            <View style={s.chipRow}>
              {FORMATS.map((fmt) => (
                <TouchableOpacity
                  key={fmt.value}
                  style={[s.chip, format === fmt.value && s.chipActive]}
                  onPress={() => setFormat(fmt.value)}
                >
                  <Text style={[s.chipText, format === fmt.value && s.chipTextActive]}>
                    {fmt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Prize + Max Agents row */}
            <View style={s.row}>
              <GlassCard intensity="low" style={[s.card, s.rowCard]}>
                <Text style={s.label}>Prize (USDC) *</Text>
                <View style={s.prizeRow}>
                  <TextInput
                    style={[s.input, s.prizeInput]}
                    placeholder="50"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="decimal-pad"
                    value={prize}
                    onChangeText={setPrize}
                  />
                  <Text style={s.usdcSymbol}>USDC</Text>
                </View>
                {prizeError && <Text style={s.errorText}>{prizeError}</Text>}
              </GlassCard>

              <GlassCard intensity="low" style={[s.card, s.rowCard]}>
                <Text style={s.label}>Max Agents</Text>
                <TextInput
                  style={s.input}
                  placeholder="Unlimited"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="number-pad"
                  value={maxAgents}
                  onChangeText={setMaxAgents}
                />
              </GlassCard>
            </View>

            {/* Deadlines */}
            <Text style={s.sectionLabel}>Deadlines *</Text>

            <TouchableOpacity onPress={() => openDatePicker('submission')} activeOpacity={0.8}>
              <GlassCard intensity="low" style={[s.card, s.deadlineCard]}>
                <View style={s.deadlineIcon}>
                  <Ionicons name="time-outline" size={18} color={colors.brand.secondary} />
                </View>
                <View style={s.deadlineText}>
                  <Text style={s.deadlineLabel}>Submission Deadline</Text>
                  <Text style={s.deadlineValue}>{fmtDate(submissionDeadline)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => openDatePicker('review')} activeOpacity={0.8}>
              <GlassCard intensity="low" style={[s.card, s.deadlineCard]}>
                <View style={s.deadlineIcon}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.brand.primary} />
                </View>
                <View style={s.deadlineText}>
                  <Text style={s.deadlineLabel}>Review Deadline</Text>
                  <Text style={s.deadlineValue}>{fmtDate(reviewDeadline)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
              </GlassCard>
            </TouchableOpacity>

            {reviewDeadline <= submissionDeadline && (
              <Text style={s.errorText}>Review deadline must be after submission deadline.</Text>
            )}

            {/* iOS-only inline picker — Android uses DateTimePickerAndroid.open() above */}
            {Platform.OS === 'ios' && iosPickerTarget !== null && (
              <DateTimePicker
                value={iosPickerTarget === 'submission' ? submissionDeadline : reviewDeadline}
                mode="datetime"
                display="inline"
                minimumDate={new Date()}
                onChange={onIosDateChange}
              />
            )}

            {/* Submit */}
            <PremiumButton
              label="Create Bounty & Sign Transaction"
              onPress={handleCreate}
              loading={isLoading || isSubmitting}
              disabled={!isValid || isLoading || isSubmitting}
              style={s.submitBtn}
            />

            <Text style={s.hint}>
              A Solana transaction will open to lock the prize in escrow. The bounty goes live immediately after confirmation.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },
  card: { padding: 16, borderRadius: 20, gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text.secondary, letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    color: colors.text.primary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  textarea: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: colors.text.muted, textAlign: 'right' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: colors.brand.primary + '20',
    borderColor: colors.brand.primary,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipTextActive: { color: colors.brand.electric },
  row: { flexDirection: 'row', gap: 12 },
  rowCard: { flex: 1 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usdcSymbol: { fontSize: 13, fontWeight: '700', color: colors.brand.secondary },
  prizeInput: { flex: 1 },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  deadlineIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deadlineText: { flex: 1 },
  deadlineLabel: { fontSize: 12, fontWeight: '600', color: colors.text.muted },
  deadlineValue: { fontSize: 14, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  errorText: { fontSize: 12, color: colors.states.error, marginTop: -4 },
  submitBtn: { marginTop: 16, borderRadius: 20 },
  hint: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
