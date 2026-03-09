import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalActionStyle = 'default' | 'destructive' | 'cancel';

export interface ModalAction {
  label: string;
  onPress?: () => void;
  style?: ModalActionStyle;
}

export interface ModalOptions {
  title: string;
  message?: string;
  actions?: ModalAction[];
}

interface ModalContextValue {
  showModal: (opts: ModalOptions) => void;
  hideModal: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalContext = createContext<ModalContextValue>({
  showModal: () => {},
  hideModal: () => {},
});

export function useModal() {
  return useContext(ModalContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const DEFAULT_ACTIONS: ModalAction[] = [{ label: 'OK', style: 'default' }];

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts]       = useState<ModalOptions>({ title: '' });

  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const showModal = useCallback((options: ModalOptions) => {
    setOpts(options);
    setVisible(true);
    scale.setValue(0.88);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        bounciness: 6,
        speed: 14,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  const hideModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [scale, opacity]);

  const actions = opts.actions ?? DEFAULT_ACTIONS;

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={hideModal}
      >
        <Pressable style={styles.backdrop} onPress={hideModal}>
          <Animated.View
            style={[styles.sheet, { transform: [{ scale }], opacity }]}
          >
            {/* Dismiss on inner tap doesn't close — stop propagation */}
            <Pressable>
              <Text style={styles.title}>{opts.title}</Text>

              {opts.message ? (
                <Text style={styles.message}>{opts.message}</Text>
              ) : null}

              <View style={styles.actions}>
                {actions.map((action, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.82}
                    style={[styles.actionBtn, actionBtnStyle(action.style)]}
                    onPress={() => {
                      hideModal();
                      action.onPress?.();
                    }}
                  >
                    <Text
                      style={[styles.actionLabel, actionLabelStyle(action.style)]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </ModalContext.Provider>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function actionBtnStyle(style?: ModalActionStyle) {
  switch (style) {
    case 'destructive': return styles.btnDestructive;
    case 'cancel':      return styles.btnCancel;
    default:            return styles.btnDefault;
  }
}

function actionLabelStyle(style?: ModalActionStyle) {
  switch (style) {
    case 'destructive': return styles.labelDestructive;
    case 'cancel':      return styles.labelCancel;
    default:            return styles.labelDefault;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface.elevated,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  actions: {
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDefault: {
    backgroundColor: colors.brand.primary,
  },
  btnDestructive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.states.error + '55',
  },
  btnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  labelDefault: {
    color: '#fff',
  },
  labelDestructive: {
    color: colors.states.error,
  },
  labelCancel: {
    color: colors.text.secondary,
  },
});
