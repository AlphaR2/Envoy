// Envoy — Cyberpunk / Neon dark theme
// Vibe: Linear-precision meets electric neon. AI-native, compact, elite.
export const colors = {
  brand: {
    primary:   '#7C3AED', // Electric Violet
    primaryLight: '#A855F7',
    secondary: '#06B6D4', // Cyan
    accent:    '#F0ABFC', // Pink/mauve accent
    electric:  '#8B5CF6',
    neon:      '#22D3EE',
  },

  background: {
    primary:   '#02020F', // Deeper navy-black
    secondary: '#05051A', 
    tertiary:  '#080824',
  },

  surface: {
    base:      '#0D0D2B',
    elevated:  '#15153D',
    elevated2: '#1C1C4E',
    glass:     'rgba(255, 255, 255, 0.03)',
    glassStroke: 'rgba(255, 255, 255, 0.08)',
  },

  border: {
    subtle:  '#16163A',
    default: '#232355',
    active:  '#7C3AED',
    neon:    '#06B6D4',
  },

  text: {
    primary:   '#F8F8FF',
    secondary: '#B0A8D1',
    muted:     '#5B5B7E',
    neon:      '#06B6D4',
  },

  states: {
    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#0EA5E9',
  },

  gradients: {
    primary:   ['#7C3AED', '#A855F7'],
    brand:     ['#7C3AED', '#06B6D4'],
    dark:      ['#0D0D2B', '#02020F'],
  }
} as const;

// Bounty state â†’ color
export const bountyStateColor: Record<string, string> = {
  draft:        colors.text.muted,
  open:         colors.states.info,
  under_review: colors.states.warning,
  settled:      colors.states.success,
  cancelled:    colors.states.error,
  refunded:     colors.states.error,
};

// Bounty state â†’ label
export const bountyStateLabel: Record<string, string> = {
  draft:        'Draft',
  open:         'Open',
  under_review: 'In Review',
  settled:      'Settled',
  cancelled:    'Cancelled',
  refunded:     'Refunded',
};

// Agent health â†’ color
export const healthColor: Record<string, string> = {
  pending:   colors.text.muted,
  healthy:   colors.states.success,
  degraded:  colors.states.warning,
  unhealthy: colors.states.error,
};

// Category tag colors (background tint)
export const categoryColor: Record<string, string> = {
  DEVELOPMENT: '#7C3AED22',
  RESEARCH:    '#06B6D422',
  WRITING:     '#10B98122',
  SECURITY:    '#EF444422',
};

export const categoryTextColor: Record<string, string> = {
  DEVELOPMENT: '#A855F7',
  RESEARCH:    '#06B6D4',
  WRITING:     '#10B981',
  SECURITY:    '#F87171',
};
