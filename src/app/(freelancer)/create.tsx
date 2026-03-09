import React, { useState } from 'react'
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
  Dimensions,
  Linking,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { colors } from '../../theme/colors'
import { GlassCard, AgentGuideCarousel, PremiumButton, AgentSetupModal } from '../../components/ui'
import { useRegisterAgentMutation, useConfirmRegistrationMutation } from '../../store/api/agentsApi'
import { useSolanaTransaction } from '../../hooks/useSolanaTransaction'
import { useToast } from '../../components/ui/Toast'
import { BountyCategory, DeliverableFormat, DispatchMethod } from '../../types/api'

const { width: W } = Dimensions.get('window')

type Step = 'GUIDE' | 'INFO' | 'DISPATCH' | 'REVIEW' | 'REGISTERING' | 'SUCCESS'

const CATEGORIES: BountyCategory[] = ['DEVELOPMENT', 'RESEARCH', 'WRITING', 'SECURITY']
const FORMATS: DeliverableFormat[] = ['document', 'markdown', 'code', 'data']

// ─── Telegram guide steps ─────────────────────────────────────────────────────
interface TgStep {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  body: string
  deeplink?: string
}
const TG_STEPS: TgStep[] = [
  {
    icon: 'paper-plane-outline',
    title: 'Open Telegram',
    body: 'Open the Telegram app on your phone or desktop.',
  },
  {
    icon: 'search-outline',
    title: 'Find the Envoy Bot',
    body: 'Search for @envoy_arena_bot in Telegram or tap the button below.',
    deeplink: 'https://t.me/envoy_arena_bot',
  },
  {
    icon: 'chatbubble-outline',
    title: 'Send /start',
    body: 'Tap START or type /start. The bot will reply with your unique Chat ID.',
  },
  {
    icon: 'copy-outline',
    title: 'Copy Your Chat ID',
    body: 'Copy the number the bot sent and paste it in the field below.',
  },
]

// ─── Button-driven Telegram helper ───────────────────────────────────────────
function TelegramHelper({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0)
  const step = TG_STEPS[idx]
  const isFirst = idx === 0
  const isLast = idx === TG_STEPS.length - 1

  return (
    <View style={tg.wrap}>
      {/* Counter */}
      <Text style={tg.counter}>
        {String(idx + 1).padStart(2, '0')} / {String(TG_STEPS.length).padStart(2, '0')}
      </Text>

      {/* Icon row with flanking nav buttons */}
      <View style={tg.navRow}>
        <TouchableOpacity
          style={[tg.navBtn, isFirst && tg.navBtnDisabled]}
          onPress={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={isFirst ? colors.text.muted + '44' : colors.brand.secondary}
          />
        </TouchableOpacity>

        <View style={[tg.iconWrap, { borderColor: colors.brand.secondary + '50' }]}>
          <LinearGradient
            colors={[colors.brand.secondary + '25', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name={step.icon} size={28} color={colors.brand.secondary} />
        </View>

        <TouchableOpacity
          style={[tg.navBtn, isLast && tg.navBtnDisabled]}
          onPress={() => setIdx((i) => Math.min(TG_STEPS.length - 1, i + 1))}
          disabled={isLast}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isLast ? colors.text.muted + '44' : colors.brand.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Text content */}
      <Text style={tg.stepTitle}>{step.title}</Text>
      <Text style={tg.stepBody}>{step.body}</Text>

      {/* Deeplink button */}
      {step.deeplink && (
        <TouchableOpacity
          style={tg.deeplinkBtn}
          onPress={() => Linking.openURL(step.deeplink!)}
          activeOpacity={0.8}
        >
          <Ionicons name="open-outline" size={13} color="#0088cc" />
          <Text style={tg.deeplinkText}>Open @envoy_arena_bot</Text>
        </TouchableOpacity>
      )}

      {/* Dot indicators */}
      <View style={tg.dots}>
        {TG_STEPS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setIdx(i)} activeOpacity={0.8}>
            <View
              style={[
                tg.dot,
                i === idx && { width: 18, backgroundColor: colors.brand.secondary },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Collapse button on last step */}
      {isLast && (
        <TouchableOpacity style={tg.doneBtn} onPress={onDone} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle-outline" size={15} color={colors.brand.secondary} />
          <Text style={tg.doneBtnText}>Got it — enter Chat ID below</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ─── Review details modal ─────────────────────────────────────────────────────
interface ReviewModalProps {
  visible: boolean
  onClose: () => void
  name: string
  description: string
  selectedCategories: BountyCategory[]
  selectedFormats: DeliverableFormat[]
  dispatch: DispatchMethod | null
  telegramChatId: string
}

function ReviewModal({
  visible,
  onClose,
  name,
  description,
  selectedCategories,
  selectedFormats,
  dispatch,
  telegramChatId,
}: ReviewModalProps) {
  const dispatchLabel =
    dispatch === 'telegram'
      ? `Telegram · ID ${telegramChatId}`
      : dispatch === 'webhook'
        ? 'Webhook'
        : 'Polling API'

  const dispatchIcon: keyof typeof Ionicons.glyphMap =
    dispatch === 'telegram' ? 'paper-plane' : dispatch === 'webhook' ? 'link' : 'refresh'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={m.sheet}>
          {/* Drag handle */}
          <View style={m.handle} />

          {/* Header */}
          <View style={m.header}>
            <Text style={m.headerTitle}>Agent Details</Text>
            <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={m.scroll}
            contentContainerStyle={m.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Agent Name */}
            <View style={m.section}>
              <Text style={m.sectionLabel}>Agent Name</Text>
              <Text style={m.sectionValue} numberOfLines={2}>{name}</Text>
            </View>
            <View style={m.divider} />

            {/* Categories */}
            <View style={m.section}>
              <Text style={m.sectionLabel}>Categories</Text>
              <View style={m.tagRow}>
                {selectedCategories.map((cat) => (
                  <View key={cat} style={m.tag}>
                    <Text style={m.tagText}>{cat}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Formats — only if selected */}
            {selectedFormats.length > 0 && (
              <>
                <View style={m.divider} />
                <View style={m.section}>
                  <Text style={m.sectionLabel}>Output Formats</Text>
                  <View style={m.tagRow}>
                    {selectedFormats.map((fmt) => (
                      <View key={fmt} style={[m.tag, m.tagSecondary]}>
                        <Text style={[m.tagText, { color: colors.brand.neon }]}>{fmt}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={m.divider} />

            {/* Dispatch */}
            <View style={m.section}>
              <Text style={m.sectionLabel}>Dispatch Method</Text>
              <View style={m.dispatchRow}>
                <View style={m.dispatchIconWrap}>
                  <Ionicons name={dispatchIcon} size={14} color={colors.brand.secondary} />
                </View>
                <Text style={m.sectionValue}>{dispatchLabel}</Text>
              </View>
            </View>

            {/* Description — only if provided */}
            {description.trim().length > 0 && (
              <>
                <View style={m.divider} />
                <View style={m.section}>
                  <Text style={m.sectionLabel}>Description</Text>
                  <Text style={m.descValue}>{description.trim()}</Text>
                </View>
              </>
            )}

            {/* Spacer for safe area */}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AddAgentScreen() {
  const router = useRouter()
  const { toast } = useToast()
  const [registerAgent, { isLoading: isRegistering }] = useRegisterAgentMutation()
  const [confirmRegistration] = useConfirmRegistrationMutation()
  const { signAndSend } = useSolanaTransaction()

  const [step, setStep] = useState<Step>('GUIDE')

  // INFO fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUri, setImageUri] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<BountyCategory[]>([])
  const [selectedFormats, setSelectedFormats] = useState<DeliverableFormat[]>([])
  const [tags, setTags] = useState('')

  // DISPATCH fields
  const [dispatch, setDispatch] = useState<DispatchMethod | null>(null)
  const [telegramChatId, setTelegramChatId] = useState('')
  const [showTgHelper, setShowTgHelper] = useState(false)

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Setup modal — holds token shown once after registration
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupToken, setSetupToken] = useState('')
  const [setupAgentId, setSetupAgentId] = useState('')

  // Track last-deployed agent name for the success screen
  const [deployedName, setDeployedName] = useState('')

  const toggleCategory = (cat: BountyCategory) =>
    setSelectedCategories((p) => (p.includes(cat) ? p.filter((c) => c !== cat) : [...p, cat]))
  const toggleFormat = (fmt: DeliverableFormat) =>
    setSelectedFormats((p) => (p.includes(fmt) ? p.filter((f) => f !== fmt) : [...p, fmt]))

  const infoValid = name.trim().length > 0 && selectedCategories.length > 0
  // Only telegram is live; webhook/polling are coming soon
  const dispatchValid = dispatch === 'telegram' && telegramChatId.trim().length > 0

  // Reset all form state so the user can register another agent
  const resetForm = () => {
    setName('')
    setDescription('')
    setImageUri('')
    setSelectedCategories([])
    setSelectedFormats([])
    setTags('')
    setDispatch(null)
    setTelegramChatId('')
    setShowTgHelper(false)
    setShowReviewModal(false)
    setShowSetupModal(false)
    setSetupToken('')
    setSetupAgentId('')
    setDeployedName('')
    setStep('INFO')
  }

  const handleRegister = async () => {
    setStep('REGISTERING')
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        categories: selectedCategories,
        supportedFormats: selectedFormats.length > 0 ? selectedFormats : undefined,
        specialisationTags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        imageUri: imageUri.trim() || undefined,
        telegramChatId: dispatch === 'telegram' ? telegramChatId.trim() : undefined,
      }

      const { agentId, tx, agentToken } = await registerAgent(payload).unwrap()
      const signature = await signAndSend(tx)
      await confirmRegistration({ id: agentId, signature }).unwrap()

      setDeployedName(payload.name)
      setSetupAgentId(agentId)
      setSetupToken(agentToken)
      setStep('SUCCESS')
      setShowSetupModal(true)
    } catch (err) {
      console.error('Agent registration failed:', err)
      toast({ message: 'Registration failed. Please try again.', type: 'error' })
      setStep('REVIEW')
    }
  }

  // ── Step: GUIDE ────────────────────────────────────────────────
  if (step === 'GUIDE') {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={[colors.brand.secondary + '12', 'transparent']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.guideContainer} edges={['top', 'bottom']}>
          <Text style={s.guideTitle}>Deploy Your Agent</Text>
          <Text style={s.guideSub}>Here's how Envoy works for agent owners</Text>
          <AgentGuideCarousel onComplete={() => setStep('INFO')} />
        </SafeAreaView>
      </View>
    )
  }

  // ── Step: REGISTERING ──────────────────────────────────────────
  if (step === 'REGISTERING') {
    return (
      <View style={[s.root, s.centerFull]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={s.signingWrap}>
          <LinearGradient colors={[colors.brand.secondary, colors.brand.neon]} style={StyleSheet.absoluteFill} />
          <Ionicons name="hardware-chip" size={40} color="#fff" />
        </View>
        <Text style={s.registTitle}>Deploying Agent...</Text>
        <Text style={s.registSub}>Sign the transaction in your wallet</Text>
      </View>
    )
  }

  // ── Step: SUCCESS ──────────────────────────────────────────────
  if (step === 'SUCCESS') {
    return (
      <View style={[s.root, s.centerFull]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={[colors.states.success + '18', 'transparent']}
          style={StyleSheet.absoluteFill}
        />

        {/* Check + name */}
        <View style={s.successIconWrap}>
          <LinearGradient
            colors={[colors.states.success + '30', colors.states.success + '08']}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="checkmark-circle" size={52} color={colors.states.success} />
        </View>
        <Text style={s.registTitle}>Agent Deployed!</Text>
        {deployedName.length > 0 && (
          <View style={s.deployedNameBadge}>
            <Ionicons name="hardware-chip-outline" size={13} color={colors.brand.secondary} />
            <Text style={s.deployedNameText} numberOfLines={1}>{deployedName}</Text>
          </View>
        )}
        <Text style={[s.registSub, { maxWidth: 300, textAlign: 'center', marginTop: 10 }]}>
          Your agent is live on Solana. Bounties will land in your Telegram chat automatically.
        </Text>

        {/* Primary: deploy another */}
        <TouchableOpacity style={s.deployAnotherBtn} onPress={resetForm} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.brand.secondary, colors.brand.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={s.deployAnotherText}>Deploy Another Agent</Text>
        </TouchableOpacity>

        {/* Secondary row */}
        <View style={s.successSecondaryRow}>
          <TouchableOpacity
            style={s.successSecondaryBtn}
            onPress={() => router.push('/(freelancer)/agents')}
            activeOpacity={0.8}
          >
            <Ionicons name="hardware-chip-outline" size={16} color={colors.text.secondary} />
            <Text style={s.successSecondaryText}>My Agents</Text>
          </TouchableOpacity>

          <View style={s.successSecondaryDivider} />

          <TouchableOpacity
            style={s.successSecondaryBtn}
            onPress={() => router.push('/(freelancer)')}
            activeOpacity={0.8}
          >
            <Ionicons name="flash-outline" size={16} color={colors.text.secondary} />
            <Text style={s.successSecondaryText}>Find Work</Text>
          </TouchableOpacity>
        </View>

        {/* Setup modal — shown once after registration */}
        {setupToken.length > 0 && (
          <AgentSetupModal
            visible={showSetupModal}
            agentId={setupAgentId}
            agentToken={setupToken}
            isNewAgent
            onDone={() => setShowSetupModal(false)}
          />
        )}
      </View>
    )
  }

  // ── Steps INFO / DISPATCH / REVIEW — shared scroll container ──
  const stepIndex = step === 'INFO' ? 0 : step === 'DISPATCH' ? 1 : 2

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[colors.brand.secondary + '10', 'transparent']} style={StyleSheet.absoluteFill} />

      {/* Review details modal */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        name={name}
        description={description}
        selectedCategories={selectedCategories}
        selectedFormats={selectedFormats}
        dispatch={dispatch}
        telegramChatId={telegramChatId}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => {
              if (step === 'INFO') setStep('GUIDE')
              else if (step === 'DISPATCH') setStep('INFO')
              else setStep('DISPATCH')
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Register Agent</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress bar */}
        <View style={s.progressRow}>
          {['INFO', 'DISPATCH', 'REVIEW'].map((_, i) => (
            <View
              key={i}
              style={[
                s.progressDot,
                i === stepIndex && { backgroundColor: colors.brand.secondary, width: 24 },
                i < stepIndex && { backgroundColor: colors.states.success },
              ]}
            />
          ))}
        </View>
        <Text style={s.progressLabel}>
          {step === 'INFO'
            ? 'Step 1 of 3 — Agent Info'
            : step === 'DISPATCH'
              ? 'Step 2 of 3 — Dispatch Method'
              : 'Step 3 of 3 — Review & Sign'}
        </Text>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── STEP 1: INFO ─────────────────────────────── */}
            {step === 'INFO' && (
              <View style={s.screen}>
                <GlassCard intensity="low" style={s.card}>
                  <Text style={s.label}>Agent Name *</Text>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. OpenClaw Research"
                    placeholderTextColor={colors.text.muted}
                    value={name}
                    onChangeText={setName}
                    maxLength={100}
                  />

                  <Text style={s.label}>Description</Text>
                  <TextInput
                    style={[s.input, s.textarea]}
                    placeholder="What does your agent do? What are its strengths?"
                    placeholderTextColor={colors.text.muted}
                    multiline
                    numberOfLines={3}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                  />

                  <Text style={s.label}>Profile Image URL (optional)</Text>
                  <TextInput
                    style={s.input}
                    placeholder="https://your-image.com/avatar.png"
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="none"
                    value={imageUri}
                    onChangeText={setImageUri}
                  />
                </GlassCard>

                <Text style={s.sectionLabel}>Categories *</Text>
                <View style={s.chipRow}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[s.chip, selectedCategories.includes(cat) && s.chipActive]}
                      onPress={() => toggleCategory(cat)}
                    >
                      <Text style={[s.chipText, selectedCategories.includes(cat) && s.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.sectionLabel}>Supported Output Formats</Text>
                <View style={s.chipRow}>
                  {FORMATS.map((fmt) => (
                    <TouchableOpacity
                      key={fmt}
                      style={[s.chip, selectedFormats.includes(fmt) && s.chipActive]}
                      onPress={() => toggleFormat(fmt)}
                    >
                      <Text style={[s.chipText, selectedFormats.includes(fmt) && s.chipTextActive]}>{fmt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.label}>Specialization Tags (comma-separated)</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. web-scraping, summarization, solana"
                  placeholderTextColor={colors.text.muted}
                  value={tags}
                  onChangeText={setTags}
                />

                <PremiumButton
                  label="Choose Dispatch"
                  onPress={() => setStep('DISPATCH')}
                  disabled={!infoValid}
                  style={s.nextBtn}
                />
              </View>
            )}

            {/* ── STEP 2: DISPATCH ─────────────────────────── */}
            {step === 'DISPATCH' && (
              <>
                <Text style={s.dispatchTitle}>How should bounties reach your agent?</Text>

                {/* ── Telegram (live) ─────────────────────────── */}
                <TouchableOpacity
                  onPress={() => { setDispatch('telegram'); setShowTgHelper(true) }}
                  activeOpacity={0.85}
                >
                  <GlassCard
                    intensity="low"
                    style={[s.dispatchCard, dispatch === 'telegram' && s.dispatchCardActive]}
                  >
                    {dispatch === 'telegram' && (
                      <LinearGradient
                        colors={[colors.brand.secondary + '18', 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}

                    <View style={s.dispatchHeader}>
                      <View style={[s.dispatchIcon, { backgroundColor: '#0088cc20' }]}>
                        <Ionicons name="paper-plane" size={22} color="#0088cc" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={s.dispatchTitleRow}>
                          <Text style={s.dispatchMethodTitle}>Telegram</Text>
                          <View style={s.recommendedBadge}>
                            <Text style={s.recommendedText}>Recommended</Text>
                          </View>
                        </View>
                        <Text style={s.dispatchMethodSub} numberOfLines={2}>
                          Bounties land in your bot chat. Reply to submit. No server needed.
                        </Text>
                      </View>
                      {dispatch === 'telegram' && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.brand.secondary} />
                      )}
                    </View>

                    {dispatch === 'telegram' && (
                      <>
                        {/* Step-through guide */}
                        {showTgHelper && <TelegramHelper onDone={() => setShowTgHelper(false)} />}

                        {!showTgHelper && (
                          <TouchableOpacity
                            style={s.howToBtn}
                            onPress={() => setShowTgHelper(true)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="help-circle-outline" size={16} color={colors.brand.secondary} />
                            <Text style={s.howToText}>How to get your Chat ID</Text>
                          </TouchableOpacity>
                        )}

                        <Text style={s.label}>Telegram Chat ID</Text>
                        <TextInput
                          style={s.input}
                          placeholder="e.g. 123456789"
                          placeholderTextColor={colors.text.muted}
                          keyboardType="number-pad"
                          value={telegramChatId}
                          onChangeText={setTelegramChatId}
                        />
                      </>
                    )}
                  </GlassCard>
                </TouchableOpacity>

                {/* ── Webhook (coming soon) ────────────────────── */}
                <View style={s.comingSoonWrap}>
                  <GlassCard intensity="low" style={[s.dispatchCard, s.dispatchCardDimmed]}>
                    <View style={s.dispatchHeader}>
                      <View style={[s.dispatchIcon, { backgroundColor: colors.brand.primary + '12' }]}>
                        <Ionicons name="link" size={22} color={colors.brand.primary + '70'} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={s.dispatchTitleRow}>
                          <Text style={[s.dispatchMethodTitle, s.dimmedText]}>Webhook</Text>
                          <View style={s.comingSoonBadge}>
                            <Ionicons name="time-outline" size={10} color={colors.text.muted} />
                            <Text style={s.comingSoonText}>Coming Soon</Text>
                          </View>
                        </View>
                        <Text style={[s.dispatchMethodSub, s.dimmedText]} numberOfLines={2}>
                          Direct Agent-to-Agent Communication via Custom Webhooks.
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                  {/* Tap blocker overlay */}
                  <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
                </View>

                {/* ── Polling (coming soon) ────────────────────── */}
                <View style={s.comingSoonWrap}>
                  <GlassCard intensity="low" style={[s.dispatchCard, s.dispatchCardDimmed]}>
                    <View style={s.dispatchHeader}>
                      <View style={[s.dispatchIcon, { backgroundColor: colors.brand.neon + '12' }]}>
                        <Ionicons name="refresh" size={22} color={colors.brand.neon + '60'} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={s.dispatchTitleRow}>
                          <Text style={[s.dispatchMethodTitle, s.dimmedText]}>Polling</Text>
                          <View style={s.comingSoonBadge}>
                            <Ionicons name="time-outline" size={10} color={colors.text.muted} />
                            <Text style={s.comingSoonText}>Coming Soon</Text>
                          </View>
                        </View>
                        <Text style={[s.dispatchMethodSub, s.dimmedText]} numberOfLines={2}>
                          Your agent calls GET /bounties/dispatched on a schedule.
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                  <View style={StyleSheet.absoluteFill} pointerEvents="box-only" />
                </View>

                <PremiumButton
                  label="Next: Review →"
                  onPress={() => setStep('REVIEW')}
                  disabled={!dispatchValid}
                  style={s.nextBtn}
                />
              </>
            )}

            {/* ── STEP 3: REVIEW ───────────────────────────── */}
            {step === 'REVIEW' && (
              <>
                {/* Compact summary card */}
                <GlassCard intensity="medium" style={s.summaryCard}>
                  <LinearGradient
                    colors={[colors.brand.secondary + '18', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Agent name */}
                  <View style={s.summaryRow}>
                    <View style={s.summaryIconWrap}>
                      <Ionicons name="hardware-chip-outline" size={18} color={colors.brand.secondary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.summaryLabel}>Agent Name</Text>
                      <Text style={s.summaryValue} numberOfLines={1}>{name}</Text>
                    </View>
                  </View>

                  <View style={s.summaryDivider} />

                  {/* Dispatch */}
                  <View style={s.summaryRow}>
                    <View style={s.summaryIconWrap}>
                      <Ionicons name="paper-plane-outline" size={18} color="#0088cc" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.summaryLabel}>Dispatch</Text>
                      <Text style={s.summaryValue} numberOfLines={1}>
                        Telegram · ID {telegramChatId}
                      </Text>
                    </View>
                  </View>
                </GlassCard>

                {/* View details button */}
                <TouchableOpacity
                  style={s.viewDetailsBtn}
                  onPress={() => setShowReviewModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text-outline" size={16} color={colors.brand.secondary} />
                  <Text style={s.viewDetailsBtnText}>View all details</Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.text.muted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>

                {/* Wallet note */}
                <GlassCard intensity="low" style={s.txNote}>
                  <Ionicons name="wallet-outline" size={20} color={colors.brand.primary} />
                  <Text style={s.txNoteText}>
                    Signing will mint your Agent NFT on Solana. Your wallet will open to approve.
                  </Text>
                </GlassCard>

                <PremiumButton
                  label="Register on Solana"
                  onPress={handleRegister}
                  loading={isRegistering}
                  style={s.nextBtn}
                />
              </>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  centerFull: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  guideContainer: { flex: 1, paddingTop: 60 },
  guideTitle: {
    fontSize: 28, fontWeight: '800', color: colors.text.primary,
    textAlign: 'center', paddingHorizontal: 24,
  },
  guideSub: {
    fontSize: 15, fontWeight: '500', color: colors.text.muted,
    textAlign: 'center', marginTop: 8, paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text.primary },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  progressLabel: {
    fontSize: 11, fontWeight: '700', color: colors.text.muted,
    textAlign: 'center', letterSpacing: 0.5, marginBottom: 8,
  },
  scroll: { padding: 16, paddingBottom: 60, gap: 12 },
  screen: { gap: 16, paddingTop: 12, paddingBottom: 50 },

  // Form
  card: { padding: 16, borderRadius: 20, gap: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.text.secondary },
  input: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14,
    color: colors.text.primary, fontSize: 15, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.brand.secondary,
    textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: colors.brand.secondary + '20', borderColor: colors.brand.secondary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  chipTextActive: { color: colors.brand.neon },
  nextBtn: { marginTop: 8, borderRadius: 20 },

  // Dispatch
  dispatchTitle: { fontSize: 15, fontWeight: '700', color: colors.text.secondary, lineHeight: 22 },
  dispatchCard: { padding: 16, borderRadius: 20, gap: 12, overflow: 'hidden' },
  dispatchCardActive: { borderColor: colors.brand.secondary + '60', borderWidth: 1 },
  dispatchCardDimmed: { opacity: 0.42 },
  dispatchHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dispatchIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dispatchTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' },
  dispatchMethodTitle: { fontSize: 16, fontWeight: '800', color: colors.text.primary },
  dispatchMethodSub: { fontSize: 13, color: colors.text.muted, lineHeight: 18 },
  dimmedText: { color: colors.text.muted },
  recommendedBadge: {
    backgroundColor: colors.brand.secondary + '20', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: colors.brand.neon, letterSpacing: 0.3 },
  comingSoonWrap: { position: 'relative' },
  comingSoonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  comingSoonText: { fontSize: 10, fontWeight: '600', color: colors.text.muted },
  howToBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: colors.brand.secondary + '10', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  howToText: { fontSize: 12, fontWeight: '600', color: colors.brand.secondary },

  // Review summary
  summaryCard: { padding: 18, borderRadius: 20, gap: 14, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 0.5, marginBottom: 3 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  viewDetailsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.brand.secondary + '10',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.brand.secondary + '30',
  },
  viewDetailsBtnText: { fontSize: 14, fontWeight: '700', color: colors.brand.secondary },
  txNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 20 },
  txNoteText: { fontSize: 13, color: colors.text.secondary, lineHeight: 19, flex: 1 },

  // Registering / Success
  signingWrap: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 24,
  },
  registTitle: { fontSize: 28, fontWeight: '800', color: colors.text.primary, textAlign: 'center' },
  registSub: { fontSize: 14, fontWeight: '500', color: colors.text.muted, marginTop: 8 },

  // Success screen
  successIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 20,
    borderWidth: 1, borderColor: colors.states.success + '30',
  },
  deployedNameBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.brand.secondary + '15',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.brand.secondary + '30',
    marginTop: 8, maxWidth: '85%',
  },
  deployedNameText: {
    fontSize: 13, fontWeight: '700', color: colors.brand.secondary,
    flexShrink: 1,
  },
  deployAnotherBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, overflow: 'hidden',
    paddingVertical: 16, paddingHorizontal: 28,
    marginTop: 28, width: '100%',
    justifyContent: 'center',
  },
  deployAnotherText: {
    color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2,
  },
  successSecondaryRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  successSecondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14,
  },
  successSecondaryText: { fontSize: 14, fontWeight: '700', color: colors.text.secondary },
  successSecondaryDivider: {
    width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)',
  },
})

// ─── Telegram helper styles ───────────────────────────────────────────────────
const tg = StyleSheet.create({
  wrap: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 16, gap: 10, alignItems: 'center',
  },
  counter: {
    fontSize: 10, fontWeight: '800', color: colors.text.muted,
    letterSpacing: 2.5, textTransform: 'uppercase',
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.brand.secondary + '15',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.brand.secondary + '30',
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 60, height: 60, borderRadius: 18, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  stepTitle: {
    fontSize: 15, fontWeight: '800', color: colors.text.primary,
    textAlign: 'center', marginTop: 2,
  },
  stepBody: {
    fontSize: 12, color: colors.text.secondary, textAlign: 'center',
    lineHeight: 18, paddingHorizontal: 12,
  },
  deeplinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#0088cc18', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  deeplinkText: { fontSize: 12, fontWeight: '700', color: '#0088cc' },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.brand.secondary + '12',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: colors.brand.secondary + '30',
  },
  doneBtnText: { fontSize: 12, fontWeight: '700', color: colors.brand.secondary },
})

// ─── Review modal styles ──────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface.elevated,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '82%',
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text.primary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  section: { paddingVertical: 14 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6,
  },
  sectionValue: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  descValue: {
    fontSize: 14, fontWeight: '500', color: colors.text.secondary,
    lineHeight: 21,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  tag: {
    backgroundColor: colors.brand.secondary + '20', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.brand.secondary + '40',
  },
  tagSecondary: {
    backgroundColor: colors.brand.neon + '12',
    borderColor: colors.brand.neon + '35',
  },
  tagText: { fontSize: 12, fontWeight: '700', color: colors.brand.secondary },
  dispatchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  dispatchIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: colors.brand.secondary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
})
