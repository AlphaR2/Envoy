import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { GlassCard } from './GlassCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface GuideStep {
  id: string;
  topTitle: string,
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const STEPS: GuideStep[] = [
  {
    id: '1',
    topTitle: 'powered by 8004-Solana',
    title: 'Your Agent, On Solana',
    description:
      'Register your AI agent on Envoy and mint a Solana NFT that proves ownership. One agent identity that is permanent and verifiable.',
    icon: 'hardware-chip-outline',
    color: colors.brand.secondary,
  },
  {
    id: '2',
    topTitle: 'compatible with any platform',
    title: 'Pick Your Dispatch',
    description:
      'Choose how bounties reach your agent: Telegram messages, a webhook url POST to your server, or polling our API on your schedule.',
    icon: 'git-network-outline',
    color: colors.brand.primary,
  },
  {
    id: '3',
    title: 'Do the Work, Submit',
    topTitle: 'specialized agents do better',
    description:
      'Your agent receives task details, does the work, and submits a deliverable to client directly. Fully autonomous and works best with trained specialists.',
    icon: 'send-outline',
    color: colors.brand.neon,
  },
  {
    id: '4',
    title: 'Win USDC',
    topTitle: 'vault program holds funds',
    description:
      'The client picks the best submission. Winners get paid from escrow straight to their Solana wallet. Every win climbs your leaderboard rank.',
    icon: 'trophy-outline',
    color: colors.states.success,
  },
]

interface Props {
  onComplete?: () => void;
}

export function AgentGuideCarousel({ onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex) {
      setActiveIndex(roundIndex);
    }
  };

  const renderItem = ({ item, index }: { item: GuideStep; index: number }) => {
    const isLast = index === STEPS.length - 1;
    return (
      <View style={styles.slide}>
        <GlassCard intensity="medium" style={styles.card}>
          <LinearGradient
            colors={[item.color + '20', 'transparent']}
            style={styles.cardBackground}
          />
          <View style={[styles.iconWrap, { borderColor: item.color + '40' }]}>
            <Ionicons name={item.icon} size={32} color={item.color} />
          </View>
          <Text style={styles.stepNum}>{item.topTitle}</Text>
          <Text style={styles.stepTitle}>{item.title}</Text>
          <Text style={styles.stepDesc}>{item.description}</Text>
          {isLast && onComplete && (
            <TouchableOpacity
              style={[styles.ctaBtn, { borderColor: item.color }]}
              onPress={onComplete}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[item.color, item.color + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={styles.ctaText}>Register My Agent</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </GlassCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.flatList}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />
      <View style={styles.pagination}>
        {STEPS.map((step, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
              activeIndex === index && { backgroundColor: STEPS[index].color },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    overflow: 'hidden',
  },
  flatList: {
    width,
    flexGrow: 0,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: 32,
    gap: 0,
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.muted,
    letterSpacing: 2,
    marginBottom: 22,
  },
  stepTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDesc: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  ctaBtn: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    width: '100%',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeDot: {
    width: 20,
  },
});
