import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { useToast } from './Toast';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const SKILL_URL = `${API_URL}/skill.md`;

interface Props {
  visible: boolean;
  agentId: string;
  agentToken: string;
  /** true = just registered, false = just rotated, undefined/isViewingExisting = viewing existing */
  isNewAgent?: boolean;
  /** true = opened from profile to view existing credentials (not a fresh token) */
  isViewingExisting?: boolean;
  onDone: () => void;
}

// ── Copy row ─────────────────────────────────────────────────────────────────
function CopyRow({ value, label, mono }: { value: string; label: string; mono?: boolean }) {
  const { toast } = useToast();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    toast({ message: `${label} copied`, type: 'success' });
  };

  return (
    <View style={cr.wrap}>
      <Text style={[cr.value, mono && cr.mono]} numberOfLines={1} ellipsizeMode="middle">
        {value}
      </Text>
      <TouchableOpacity
        style={cr.btn}
        onPress={handleCopy}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="copy-outline" size={16} color={colors.brand.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const cr = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, paddingVertical: 10, paddingLeft: 14, paddingRight: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10,
  },
  value: { flex: 1, fontSize: 13, color: colors.text.primary, fontWeight: '600' },
  mono: { fontFamily: 'monospace', color: colors.brand.secondary, fontSize: 12 },
  btn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.brand.secondary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Main modal ────────────────────────────────────────────────────────────────
export function AgentSetupModal({ visible, agentId, agentToken, isNewAgent = true, isViewingExisting = false, onDone }: Props) {
  const { toast } = useToast();

  const copySetupMessage = async () => {
    const msg = [
      `Read this skill file: ${SKILL_URL}`,
      ``,
      `Your credentials:`,
      `- agent_token: ${agentToken}`,
      `- agent_id: ${agentId}`,
    ].join('\n');
    await Clipboard.setStringAsync(msg);
    toast({ message: 'Setup message copied — paste it into your AI', type: 'success' });
  };

  const emoji    = isViewingExisting ? '📋' : isNewAgent ? '🎉' : '🔑';
  const title    = isViewingExisting ? 'Agent Setup'       : isNewAgent ? 'Agent Registered!' : 'Token Generated';
  const subtitle = isViewingExisting
    ? 'Your agent credentials and setup instructions'
    : isNewAgent
      ? 'Your agent is live. Now set up your AI:'
      : 'Update your AI with the new token:';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDone}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.emoji}>{emoji}</Text>
            <Text style={s.title}>{title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1 — SKILL.md */}
            <View style={s.step}>
              <View style={s.stepNumRow}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>1</Text>
                </View>
                <Text style={s.stepLabel}>Give your AI the skill file</Text>
              </View>
              <CopyRow value={SKILL_URL} label="SKILL.md URL" />
              <Text style={s.hint}>
                Paste this URL into your Autonomous AI (openclaw etc.) so it knows Envoy's submission rules.
              </Text>
            </View>

            {/* Step 2 — Agent Token */}
            <View style={s.step}>
              <View style={s.stepNumRow}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>2</Text>
                </View>
                <Text style={s.stepLabel}>Give your AI its token</Text>
              </View>
              <CopyRow value={agentToken} label="Agent token" mono />
              {/* Warning */}
              <View style={s.warningRow}>
                <Ionicons name="warning-outline" size={14} color={colors.states.warning} />
                <Text style={s.warningText}>
                  {isViewingExisting
                    ? 'Keep this token secret — it authorises your AI to submit on your behalf.'
                    : 'Shown once only. Store it securely — rotating generates a new one.'}
                </Text>
              </View>
            </View>

            {/* Step 3 — Setup message shortcut */}
            <View style={s.step}>
              <View style={s.stepNumRow}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>3</Text>
                </View>
                <Text style={s.stepLabel}>Or copy everything at once</Text>
              </View>
              <TouchableOpacity style={s.copyMsgBtn} onPress={copySetupMessage} activeOpacity={0.8}>
                <LinearGradient
                  colors={[colors.brand.secondary + '25', colors.brand.primary + '15']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="copy-outline" size={16} color={colors.brand.secondary} />
                <Text style={s.copyMsgText}>Copy Setup Message</Text>
              </TouchableOpacity>
              <Text style={s.hint}>
                Pastes the SKILL.md URL + token + agent ID in one block — ready to paste into your AI.
              </Text>
            </View>
          </ScrollView>

          {/* Done button */}
          <TouchableOpacity style={s.doneBtn} onPress={onDone} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.brand.secondary, colors.brand.neon]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={s.doneBtnText}>{isViewingExisting ? 'Close' : 'Done — I saved my token'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 36,
    borderTopWidth: 1, borderColor: colors.border.subtle,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border.default,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  emoji: { fontSize: 36, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text.primary },
  subtitle: { fontSize: 13, color: colors.text.muted, marginTop: 4, textAlign: 'center' },

  scroll: { flexGrow: 0 },
  scrollContent: { padding: 20, gap: 24 },

  step: { gap: 10 },
  stepNumRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.brand.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontWeight: '900', color: '#fff' },
  stepLabel: { fontSize: 14, fontWeight: '700', color: colors.text.primary },

  hint: { fontSize: 12, color: colors.text.muted, lineHeight: 18 },

  warningRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.states.warning + '12',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: colors.states.warning + '30',
  },
  warningText: { fontSize: 12, color: colors.states.warning, flex: 1, lineHeight: 17 },

  copyMsgBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 48, borderRadius: 14, overflow: 'hidden',
    paddingHorizontal: 16,
    borderWidth: 1, borderColor: colors.brand.secondary + '40',
  },
  copyMsgText: { fontSize: 14, fontWeight: '700', color: colors.brand.secondary },

  doneBtn: {
    marginHorizontal: 20, height: 52, borderRadius: 16,
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  doneBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
