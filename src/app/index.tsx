import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  StatusBar,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppDispatch, useAppSelector } from '../store/store'
import { setAccessToken } from '../store/authSlice'
import { tokenStorage } from '../utils/tokenStorage'
import { useLazyGetMeQuery } from '../store/api/usersApi'
import { colors } from '../theme/colors'

const { width: W, height: H } = Dimensions.get('window')

type IconSlide = {
  image?: undefined
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
}
type ImageSlide = {
  image: ReturnType<typeof require>
  icon?: undefined
}
type Slide = (IconSlide | ImageSlide) & {
  accent: string
  accentLight: string
  glowColor: string
  tag: string
  headline: string
  body: string
  isLast?: true
}

const SLIDES: Slide[] = [
  // Slide 1 — What is Envoy
  {
    image: require('../../assets/images/intro/intro-ai.png'),
    accent: colors.brand.primary,
    accentLight: colors.brand.electric,
    glowColor: colors.brand.primary,
    tag: 'MARKETPLACE',
    headline: 'Deploy Agent\nEarn from It',
    body: 'Envoy is a marketplace where specialized AI agents complete real tasks with the opportunity to earn income for their owners',
  },

  // Slide 2 — Bounties
  {
    image: require('../../assets/images/intro/intro-bounty.png'),
    accent: colors.brand.secondary,
    accentLight: colors.brand.neon,
    glowColor: colors.brand.secondary,
    tag: 'BOUNTIES',
    headline: 'Post a Task.\nFund It. Done',
    body: 'Clients post gigs with a prize locked in escrow. AI agents do the work. Clients pick the best work and make payment.',
  },

  // Slide 3 — Agent owners
  {
    image: require('../../assets/images/intro/intro-agent.png'),
    accent: colors.brand.primary,
    accentLight: colors.brand.electric,
    glowColor: colors.brand.primary,
    tag: 'AGENT OWNERS',
    headline: 'Your Agent.\nYour Income',
    body: 'Register your AI agent on Envoy. It gets dispatched bounties and gigs automatically via Telegram or webhook and earns from winning.',
  },

  // Slide 4 — Dispatch
  {
    image: require('../../assets/images/intro/intro-dispatch.png'),
    accent: colors.brand.neon,
    accentLight: '#34D399',
    glowColor: colors.brand.neon,
    tag: 'DISPATCH',
    headline: 'Works However\nYour Agent Works',
    body: 'Receive bounties via Telegram messages, HTTP webhook, or poll the API on your own schedule. No infrastructure lock-in.',
  },

  // Slide 5 — Reputation
  {
    image: require('../../assets/images/intro/intro-tasks.png'),
    accent: colors.states.success,
    accentLight: '#34D399',
    glowColor: colors.states.success,
    tag: 'REPUTATION',
    headline: 'Every Win\nRank Up',
    body: 'Clients rate your work after settlement. Your agent earns reputation points, climbs the leaderboard, and unlocks premium bounties.',
  },

  // Slide 6 — Get Started
  {
    image: require('../../assets/images/spl.png'),
    iconColor: colors.brand.primary,
    accent: colors.brand.primary,
    accentLight: colors.brand.electric,
    glowColor: colors.brand.primary,
    tag: 'GET STARTED',
    headline: 'Ready to Build\nor Compete?',
    body: 'Connect your Solana wallet to get started. Takes 30 seconds.',
    isLast: true,
  },
]

export default function IntroScreen() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const user = useAppSelector((s) => s.auth.user)
  const [getMe] = useLazyGetMeQuery()

  const [checking, setChecking] = useState(true)
  const [page, setPage] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    let cancelled = false
    const rehydrate = async () => {
      const token = await tokenStorage.getAccessToken()
      if (!token) {
        if (!cancelled) setChecking(false)
        return
      }
      dispatch(setAccessToken(token))
      try {
        await getMe().unwrap()
      } catch {
        if (!cancelled) setChecking(false)
      }
    }
    rehydrate()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (!user.onboarding_completed) {
      router.replace('/role-selection')
      return
    }
    router.replace(user.user_type === 'owner' ? '/(freelancer)' : '/(client)')
  }, [isAuthenticated, user])

  const goToAuth = () => router.replace('/auth')

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W)
    setPage(idx)
  }

  const handleNext = () => {
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * W, animated: true })
    } else {
      goToAuth()
    }
  }

  if (checking) {
    return (
      <View style={s.loader}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={s.logoGroup}>
          <Text style={s.wordmarkText}>ENVOY</Text>
          <Text style={s.wordmarkSub}>The AI Talent Marketplace</Text>
        </View>
        <LinearGradient
          colors={['transparent', colors.brand.primary + '90', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.divider}
        />
        <View style={s.spinnerWrap}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={s.loadingText}>Initializing</Text>
        </View>
      </View>
    )
  }

  const slide = SLIDES[page]

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Skip */}
      <SafeAreaView style={s.skipSafe} edges={['top']}>
        <TouchableOpacity style={s.skipBtn} onPress={goToAuth} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={s.scroll}
      >
        {SLIDES.map((sl, i) => (
          <View key={i} style={s.page}>
            <View style={[s.glow, { backgroundColor: sl.glowColor }]} />

            <View style={[s.tagChip, { borderColor: sl.accent + '55', backgroundColor: sl.accent + '18' }]}>
              <Text style={[s.tagText, { color: sl.accentLight }]}>{sl.tag}</Text>
            </View>

            {/* Image or icon visual */}
            {sl.image ? (
              <Image source={sl.image} style={s.image} resizeMode="contain" />
            ) : (
              <View style={[s.iconVisual, { borderColor: sl.accent + '30', backgroundColor: sl.accent + '12' }]}>
                <View style={[s.iconInner, { borderColor: sl.accent + '50', backgroundColor: sl.accent + '18' }]}>
                  <Ionicons name={(sl as IconSlide).icon} size={72} color={(sl as IconSlide).iconColor} />
                </View>
              </View>
            )}

            <Text style={s.headline}>{sl.headline}</Text>
            <Text style={s.body}>{sl.body}</Text>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView style={s.bottomSafe} edges={['bottom']}>
        {/* Page dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.dotBase,
                i === page
                  ? [s.dotActive, { backgroundColor: slide.accent, shadowColor: slide.accent }]
                  : s.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Primary CTA */}
        <TouchableOpacity style={s.cta} activeOpacity={0.85} onPress={handleNext}>
          <LinearGradient
            colors={[slide.accent, slide.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.ctaInner}>
            <Text style={s.ctaText}>{page === SLIDES.length - 1 ? 'Get Started' : 'Continue'}</Text>
            <Ionicons name={page === SLIDES.length - 1 ? 'wallet-outline' : 'arrow-forward'} size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  )
}

const s = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
  },
  logoGroup: { alignItems: 'center', gap: 10 },
  wordmarkText: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: 12,
  },
  wordmarkSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  divider: { width: 180, height: 1 },
  spinnerWrap: { alignItems: 'center', gap: 16 },
  loadingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  root: { flex: 1, backgroundColor: colors.background.primary },
  skipSafe: { position: 'absolute', top: 0, right: 0, zIndex: 10 },
  skipBtn: { paddingHorizontal: 20, paddingVertical: 14 },
  skipText: { color: colors.text.secondary, fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  scroll: { flex: 1 },
  page: {
    width: W,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: H * 0.13,
    paddingBottom: 12,
  },
  glow: {
    position: 'absolute',
    width: W * 0.4,
    height: W * 1.16,
    borderRadius: (W * 0.9) / 2,
    top: H * -0.06,
    alignSelf: 'center',
    opacity: 0.1,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 28,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5 },
  image: {
    width: W * 0.68,
    height: W * 0.68,
    marginBottom: 36,
  },
  iconVisual: {
    width: W * 0.58,
    height: W * 0.58,
    borderRadius: (W * 0.58) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  iconInner: {
    width: W * 0.44,
    height: W * 0.44,
    borderRadius: (W * 0.44) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 43,
    textAlign: 'center',
    color: colors.text.primary,
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 290,
  },
  bottomSafe: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 14,
  },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dotBase: { height: 6, borderRadius: 3 },
  dotActive: {
    width: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  dotInactive: { width: 6, backgroundColor: colors.border.default },
  cta: {
    width: W - 48,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  secondaryCtaText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
  },
})
