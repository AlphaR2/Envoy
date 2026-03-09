# Mobile App Color System – Skill Guide

This document explains three important concepts for building a **stable, scalable mobile color system**:

1. A common mistake with red palettes that causes user fatigue
2. The color token systems used in modern design systems
3. A ready-to-use React Native / Tailwind theme configuration

---

# 1. The Red Palette Mistake (User Fatigue Problem)

Red is a powerful color. It signals:

* urgency
* action
* alerts
* danger
* energy

However, many apps make a critical mistake:

## ❌ Mistake

Using red as a **dominant UI color everywhere**.

Examples of overuse:

* red backgrounds
* red navigation bars
* red cards
* red icons
* red text

This causes several UX problems.

### Cognitive Stress

Red activates alert responses in the brain. Too much red makes users feel like something is **always urgent or wrong**.

### Visual Fatigue

Large red surfaces strain the eyes over long sessions.

### Loss of Meaning

If everything is red, users can no longer tell what action is important.

---

## ✅ Correct Usage Strategy

Red should be used **sparingly and intentionally**.

Recommended distribution:

```
80% neutral colors
15% secondary colors
5% primary accent (red)
```

Use red mainly for:

* primary call-to-action buttons
* important highlights
* notifications
* active states
* urgent interactions

This preserves the **psychological power of the color**.

---

# 2. The Color Token System Used by Modern Products

Modern applications do **not hardcode colors directly into UI components**.

Instead, they use **design tokens**.

A token system separates **meaning** from **actual color values**.

Example:

Instead of writing:

```
background: #0B0B0F
```

You write:

```
background: backgroundPrimary
```

---

## Advantages

### Consistency

Every screen uses the same semantic color definitions.

### Easy Theming

Light and dark mode can swap values without rewriting UI components.

### Scalable Design

Large teams can maintain visual consistency across hundreds of components.

---

## Typical Token Structure

```
colors
 ├── background
 │    ├── primary
 │    ├── secondary
 │
 ├── surface
 │    ├── base
 │    ├── elevated
 │
 ├── text
 │    ├── primary
 │    ├── secondary
 │
 ├── border
 │
 ├── brand
 │    ├── primary
 │    ├── secondary
 │
 ├── states
 │    ├── success
 │    ├── warning
 │    ├── error
```

This system allows the UI to remain **stable and predictable**.

---

# 3. React Native + Tailwind Theme File

Below is a ready-to-use theme configuration.

It works well for:

* mobile apps
* React Native
* Tailwind
* design token systems

---

## Theme Tokens

```js
// Arcadium — Cyberpunk / Neon dark theme
// Vibe: Linear-precision meets electric neon. AI-native, compact, elite.
// Primary accent: Electric Violet (#7C3AED)
// Data accent:    Cyan (#06B6D4) — cyberpunk two-color system
// Backgrounds:    Deep navy-black with cold undertone (not neutral gray)
export const colors = {
  brand: {
    primary:   "#7C3AED",  // Electric Violet — primary CTA, AI authority
    secondary: "#A855F7",  // Mid-violet — secondary elements, active states
    accent:    "#06B6D4",  // Cyan — data display, info, contrast accent
  },

  background: {
    primary:   "#08081A",  // deep navy-black
    secondary: "#0C0C22",  // slight step up for sections
  },

  surface: {
    base:      "#111128",  // card backgrounds
    elevated:  "#181838",  // modals, bottom sheets
    elevated2: "#1E1E42",  // nested elements
  },

  border: {
    subtle:  "#1C1C3A",    // barely-there borders
    default: "#272750",    // normal borders (violet-tinted)
    active:  "#7C3AED",    // active / focused border
  },

  text: {
    primary:   "#E8E8FF",  // slightly violet-tinted white
    secondary: "#8880AA",  // muted violet-tinted secondary
    muted:     "#44445A",  // very muted, tertiary info
  },

  states: {
    success: "#10B981",    // emerald — won, settled, healthy
    warning: "#F59E0B",    // amber  — under review, degraded
    error:   "#EF4444",    // red    — failed, cancelled, destructive ONLY
    info:    "#06B6D4",    // cyan   — matches brand.accent
  },
};
```

---

## Example Usage in React Native

```js
import { colors } from "./theme";

const styles = {
  container: {
    backgroundColor: colors.background.dark,
  },

  card: {
    backgroundColor: colors.surface.dark,
    borderColor: colors.border.dark,
  },

  buttonPrimary: {
    backgroundColor: colors.brand.primary,
  },

  textPrimary: {
    color: colors.text.primaryDark,
  },
};
```

---

# 4. Button Hierarchy

Primary Button

```
background: brand.primary
text: white
```

Secondary Button

```
background: brand.secondary
text: white
```

Ghost Button

```
border: brand.primary
text: brand.primary
```

---

# 5. Color Usage Guidelines

To maintain visual clarity:

```
80% neutral colors
15% secondary colors
5% primary accent
```

Neutral colors handle:

* layout
* backgrounds
* containers

Secondary colors handle:

* navigation
* links
* highlights

Primary colors handle:

* key user actions

---

# 6. Dark Mode Design Rules

Dark mode should avoid pure black.

Recommended background range:

```
#0B0B0F  → main background
#15151B  → surfaces
#1F1F27  → elevated cards
```

This improves readability and reduces eye strain.

---

# 7. Design Philosophy

This palette is designed for interfaces that feel like:

* command centers
* trading platforms
* creator marketplaces
* modern developer tools

The system balances:

* energy
* intelligence
* premium aesthetics
* usability

---
