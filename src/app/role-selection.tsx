import React, { useRef, useState } from 'react';
import {
  Animated, Dimensions, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, categoryTextColor, categoryColor } from '../theme/colors';
import { typography } from '../theme/typography';
import { useUpdateMeMutation } from '../store/api/usersApi';
import { useToast, PremiumButton, GlassCard } from '../components/ui';
import { getApiErrorMessage } from '../utils/apiError';
import type { BountyCategory, UserType } from '../types/api';
import { useAppSelector } from '../store/store';

const { width: W } = Dimensions.get('window');

// ─── Data ───────────────────────────────────────────────────────────────────

const ROLES = [
  {
    type:       'client'          as UserType,
    icon:       'flash-outline'   as const,
    iconActive: 'flash'           as const,
    title:      'Post Bounties',
    tagline:    'Fund tasks, review submissions, and hire the best agents.',
    color:      colors.brand.primary,
  },
  {
    type:       'owner'                 as UserType,
    icon:       'hardware-chip-outline' as const,
    iconActive: 'hardware-chip'         as const,
    title:      'Deploy Agents',
    tagline:    'Register AI agents, enter bounties, and earn USDC.',
    color:      colors.brand.secondary,
  },
] as const;

const CATS = [
  { value: 'DEVELOPMENT' as BountyCategory, label: 'Development', icon: '⌨' },
  { value: 'RESEARCH'    as BountyCategory, label: 'Research',    icon: '⚗' },
  { value: 'WRITING'     as BountyCategory, label: 'Writing',     icon: '✍' },
  { value: 'SECURITY'    as BountyCategory, label: 'Security',    icon: '⬡' },
] as const;

// ─── Components ──────────────────────────────────────────────────────────────

function Dots({ step }: { step: number }) {
  return (
    <View style={ss.dots}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            ss.dot,
            i < step   ? ss.dotDone   :
            i === step ? ss.dotActive :
                         ss.dotIdle,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Step 1 — Role ───────────────────────────────────────────────────────────

function S1({ role, pick }: { role: UserType | null; pick: (r: UserType) => void }) {
  return (
    <View style={ss.step}>
      <View style={ss.headline}>
        <Text style={ss.eyebrow}>STEP 1 OF 3</Text>
        <Text style={typography.h1}>
          Choose your <Text style={{ color: colors.brand.primary }}>path</Text>
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          This determines your primary interface and features.
        </Text>
      </View>

      <View style={ss.roleList}>
        {ROLES.map((r) => {
          const active = role === r.type;
          return (
            <TouchableOpacity
              key={r.type}
              onPress={() => pick(r.type)}
              activeOpacity={0.8}
              style={[
                ss.roleCard,
                active ? { borderColor: r.color, backgroundColor: `${r.color}15` } : ss.roleCardInactive
              ]}
            >
              <View style={[ss.roleIconWrap, { backgroundColor: active ? r.color : colors.surface.elevated }]}>
                <Ionicons 
                  name={active ? r.iconActive : r.icon} 
                  size={24} 
                  color={active ? '#fff' : colors.text.muted} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, active && { color: r.color }]}>{r.title}</Text>
                <Text style={[typography.bodySmall, { color: colors.text.muted, marginTop: 2 }]}>{r.tagline}</Text>
              </View>
              <View style={[ss.checkCircle, active && { backgroundColor: r.color, borderColor: r.color }]}>
                {active && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 2 — Display name ─────────────────────────────────────────────────────

function S2({
  name, set, focused, onFocus, onBlur,
}: {
  name: string;
  set: (s: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View style={ss.step}>
      <View style={ss.headline}>
        <Text style={ss.eyebrow}>STEP 2 OF 3</Text>
        <Text style={typography.h1}>
          What should we <Text style={{ color: colors.brand.secondary }}>call you?</Text>
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          Shown on your public profile. You can change this anytime.
        </Text>
      </View>

      <View style={[ss.inputContainer, focused && ss.inputFocused]}>
        <Ionicons name="person-outline" size={20} color={focused ? colors.brand.secondary : colors.text.muted} />
        <TextInput
          style={ss.input}
          placeholder="Your name or alias"
          placeholderTextColor={colors.text.muted}
          value={name}
          onChangeText={set}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus
          maxLength={40}
        />
      </View>
      <Text style={[typography.caption, { color: colors.text.muted }]}>
        Leave blank to keep your wallet address as your name.
      </Text>
    </View>
  );
}

// ─── Step 3 — Categories ───────────────────────────────────────────────────────

function S3({
  cats, toggle, role,
}: {
  cats: BountyCategory[];
  toggle: (c: BountyCategory) => void;
  role: UserType;
}) {
  return (
    <View style={ss.step}>
      <View style={ss.headline}>
        <Text style={ss.eyebrow}>STEP 3 OF 3</Text>
        <Text style={typography.h1}>
          Areas of <Text style={{ color: colors.states.success }}>interest</Text>
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          {role === 'owner' ? "Relevant bounties for your agents." : "Specialists for your specific needs."}
        </Text>
      </View>

      <View style={ss.catGrid}>
        {CATS.map((c) => {
          const active = cats.includes(c.value);
          return (
            <TouchableOpacity
              key={c.value}
              onPress={() => toggle(c.value)}
              activeOpacity={0.8}
              style={[
                ss.catCard,
                active ? { borderColor: colors.states.success, backgroundColor: `${colors.states.success}15` } : ss.catCardInactive
              ]}
            >
              <Text style={ss.catEmoji}>{c.icon}</Text>
              <Text style={[typography.bodySmall, { color: active ? colors.text.primary : colors.text.secondary }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router          = useRouter();
  const { toast }       = useToast();
  const user            = useAppSelector((s) => s.auth.user);
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  const [step,    setStep]    = useState(0);
  const [role,    setRole]    = useState<UserType | null>(null);
  const [name,    setName]    = useState('');
  const [cats,    setCats]    = useState<BountyCategory[]>([]);
  const [focused, setFocused] = useState(false);

  // Redirect if already onboarded
  React.useEffect(() => {
    if (user?.onboarding_completed) {
      router.replace(user.user_type === 'owner' ? '/(freelancer)' : '/(client)');
    }
  }, [user, router]);

  const slideX = useRef(new Animated.Value(0)).current;

  const goTo = (next: number) => {
    const forward = next > step;
    Animated.timing(slideX, {
      toValue:         forward ? -W : W,
      duration:        250,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);
      slideX.setValue(forward ? W : -W);
      Animated.spring(slideX, {
        toValue:         0,
        tension:         60,
        friction:        10,
        useNativeDriver: true,
      }).start();
    });
  };

  const toggleCat = (c: BountyCategory) =>
    setCats((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const handleSubmit = async () => {
    try {
      await updateMe({
        user_type: role!,
        ...(name.trim().length >= 2 ? { display_name: name.trim() } : {}),
        ...(cats.length > 0         ? { preferred_categories: cats } : {}),
      }).unwrap();
      router.replace(role === 'owner' ? '/(freelancer)' : '/(client)');
    } catch (err) {
      toast({ type: 'error', message: getApiErrorMessage(err, 'Could not save profile. Please try again.') });
    }
  };

  const isLast = step === 2;
  const canContinue = step === 0 ? role !== null : true;

  return (
    <SafeAreaView style={ss.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Glows */}
      <View style={ss.abs}>
        <View style={[ss.glow, { top: -100, left: -100, backgroundColor: colors.brand.primary }]} />
      </View>

      <View style={ss.topContainer}>
         <TouchableOpacity 
           onPress={() => goTo(step - 1)}
           disabled={step === 0}
           style={[ss.backBtn, step === 0 && { opacity: 0 }]}
         >
           <Ionicons name="arrow-back" size={24} color={colors.text.secondary} />
         </TouchableOpacity>
         <Dots step={step} />
         <View style={ss.placeholder} />
      </View>

      <Animated.View style={[ss.body, { transform: [{ translateX: slideX }] }]}>
        {step === 0 && <S1 role={role} pick={(r) => { setRole(r); }} />}
        {step === 1 && (
          <S2 
            name={name} set={setName} 
            focused={focused} 
            onFocus={() => setFocused(true)} 
            onBlur={() => setFocused(false)} 
          />
        )}
        {step === 2 && <S3 cats={cats} toggle={toggleCat} role={role!} />}
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={ss.footer}
      >
        <PremiumButton 
          label={isLast ? 'Launch Envoy' : 'Continue'} 
          onPress={isLast ? handleSubmit : () => goTo(step + 1)}
          loading={isLoading}
          disabled={!canContinue}
          size="large"
          icon={isLast ? <Ionicons name="rocket-outline" size={20} color="#fff" /> : undefined}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.primary },
  abs: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.1 },
  
  topContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    height: 60,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  placeholder: { width: 40 },
  
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 4, borderRadius: 2 },
  dotActive: { width: 24, backgroundColor: colors.brand.primary },
  dotDone: { width: 8, backgroundColor: colors.brand.primary, opacity: 0.4 },
  dotIdle: { width: 8, backgroundColor: colors.surface.elevated2 },
  
  body: { flex: 1 },
  step: { flex: 1, paddingHorizontal: 28, paddingTop: 32, gap: 32 },
  headline: { gap: 12 },
  eyebrow: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: colors.text.muted, 
    letterSpacing: 2.5, 
    textTransform: 'uppercase' 
  },
  
  roleList: { gap: 16 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 16,
  },
  roleCardInactive: {
    backgroundColor: colors.surface.base,
    borderColor: colors.border.subtle,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.base,
    gap: 12,
  },
  inputFocused: {
    borderColor: colors.brand.secondary,
    backgroundColor: colors.surface.elevated,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    width: (W - 56 - 12) / 2,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 10,
  },
  catCardInactive: {
    backgroundColor: colors.surface.base,
    borderColor: colors.border.subtle,
  },
  catEmoji: { fontSize: 24 },
  
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 24,
  }
});
