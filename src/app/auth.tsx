import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppSelector } from '../store/store';
import { useWalletAuth } from '../hooks/useWalletAuth';
import { useToast, PremiumButton, GlassCard } from '../components/ui';
import { getApiErrorMessage } from '../utils/apiError';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const FEATURES = [
  '8004-Solana for verified specialist agents',
  'Escrow for secure payments',
  'Performance tracked and verified',
] as const;

const OVERLAYS = [0.04, 0.12, 0.26, 0.44, 0.64, 0.82, 1] as const;

export default function AuthScreen() {
  const router        = useRouter();
  const { height: H } = useWindowDimensions();
  const [loading, setLoading] = useState(false);

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user            = useAppSelector((s) => s.auth.user);
  const { connectAndAuth } = useWalletAuth();
  const { toast }          = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (!user.onboarding_completed) { router.replace('/role-selection'); return; }
    router.replace(user.user_type === 'owner' ? '/(freelancer)' : '/(client)');
  }, [isAuthenticated, user, router]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await connectAndAuth();
    } catch (err) {
      toast({
        type: 'error',
        message: getApiErrorMessage(err, 'Could not connect wallet. Please try again.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const imgH = Math.round(H * 0.6);
  const overlayHeights = OVERLAYS.map((_, i) =>
    Math.round(imgH * (0.75 - i * 0.1)),
  );

  return (
    <View style={styles.root}>
      {/* Background hero image */}
      <Image
        source={require('../../assets/images/spl.png')}
        style={[styles.heroImg, { height: imgH }]}
        resizeMode="cover"
      />

      {/* Gradient fade over image bottom */}
      {OVERLAYS.map((opacity, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.fadeSlice,
            { opacity, height: overlayHeights[i], top: imgH - overlayHeights[i] },
          ]}
        />
      ))}

      <View style={[styles.bgGlow, { top: H * 0.5, left: -100, backgroundColor: colors.brand.primary }]} />
      <View style={[styles.bgGlow, { top: H * 0.7, right: -100, backgroundColor: colors.brand.secondary }]} />

      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <View style={styles.content}>

          {/* Wordmark */}
          <View style={styles.wordmarkRow}>
            <View style={styles.wordmarkPill}>
              <View style={styles.wordmarkDot} />
              <Text style={styles.wordmarkText}>ENVOY</Text>
            </View>
          </View>

          {/* Headline */}
          <View style={styles.headlineBlock}>
            <Text style={[typography.h1, { color: colors.text.primary }]}>
              The Specialist{'\n'}
              <Text style={{ color: colors.brand.secondary }}>Talent Marketplace</Text>
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, marginTop: 8 }]}>
              Connect with elite AI agents. Get work done fast and permissionless.
            </Text>
          </View>

          {/* Feature list */}
          <View style={styles.features}>
            {FEATURES.map((feat) => (
              <View key={feat} style={styles.featureRow}>
                <View style={styles.checkWrap}>
                   <View style={styles.innerDot} />
                </View>
                <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View style={styles.ctaBlock}>
            <PremiumButton 
              label="Connect Wallet" 
              onPress={handleConnect}
              loading={loading}
              size="large"
            />

            <Text style={[typography.caption, styles.fine]}>
              Deploy AI · Automate · Earn
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  heroImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  fadeSlice: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
  },
  bgGlow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    gap: 28,
  },
  wordmarkRow: {
    flexDirection: 'row',
  },
  wordmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.brand.primary}40`,
    backgroundColor: `${colors.brand.primary}12`,
  },
  wordmarkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand.primary,
  },
  wordmarkText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 4,
    color: colors.brand.primaryLight,
  },
  headlineBlock: {
    gap: 4,
  },
  features: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${colors.brand.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.brand.primary}40`,
  },
  innerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.secondary,
  },
  ctaBlock: {
    gap: 16,
  },
  fine: {
    color: colors.text.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
