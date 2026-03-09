---
name: arcadium-mobile-app
description: Skill for building, modifying, or understanding the Arcadium React Native mobile app. Use when working on screens, navigation, wallet connection, UI components, Phantom Connect integration, Mobile Wallet Adapter, state management, or any frontend mobile logic. Always load arcadium-general first.
---

firs off no emoji. short comments, clean and prod level code 

# arcadium-mobile — React Native Skill

The Arcadium mobile app is an Android-first React Native + Expo app targeting the Solana Seeker dApp Store. It is the primary user interface for all three actors: clients, agent owners, and the public leaderboard.

---

## Tech Stack

```
Framework:          React Native + Expo (SDK 52+)
Language:           TypeScript
Navigation:         Expo Router (file-based)
State:              Zustand (global) + React Query (server state)
Wallet - Embedded:  @phantom/react-native-wallet-sdk
Wallet - Connect:   @solana-mobile/mobile-wallet-adapter-protocol
Solana:             @solana/web3.js
Styling:            NativeWind (Tailwind for RN)
Notifications:      expo-notifications
File handling:      expo-document-picker + expo-file-system
HTTP:               Axios + React Query
```

---

## Target Platform

- **Primary**: Android (Solana Seeker dApp Store)
- **Minimum API**: Android 14+ (required by Mobile Wallet Adapter)
- **iOS**: Not in MVP scope
- **Distribution**: Solana dApp Store (not Google Play for MVP)

---

## Wallet Connection

Two paths, unified result (user's Solana pubkey + JWT):

### Path 1 — New user (no Phantom installed)
Uses `@phantom/react-native-wallet-sdk`
```typescript
import { PhantomProvider, usePhantom } from '@phantom/react-native-wallet-sdk';

// User signs in with Google → wallet auto-created
// 4-digit PIN for signing
// Wallet syncs with Phantom app if user later installs it
```

### Path 2 — Existing Phantom user
Uses `@solana-mobile/mobile-wallet-adapter-protocol`
```typescript
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

// Deep-links to Phantom app
// User approves connection
// Returns pubkey + authorization token
```

### After connection (both paths)
```typescript
// 1. Sign auth message
const message = `Sign in to Arcadium\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
const { signature } = await wallet.signMessage(encode(message));

// 2. POST to backend
const { token } = await api.post('/auth/verify', { message, signature, pubkey });

// 3. Store JWT in SecureStore
await SecureStore.setItemAsync('arcadium_jwt', token);
```

---

## Navigation Structure (Expo Router)

```
app/
├── (auth)/
│   └── connect.tsx              — Wallet connection screen
├── (tabs)/
│   ├── _layout.tsx              — Tab bar
│   ├── index.tsx                — Home feed (open bounties + gig browse)
│   ├── post.tsx                 — Post gig or bounty
│   ├── my-jobs.tsx              — Client's active jobs
│   ├── my-agents.tsx            — Owner's agent management
│   └── leaderboard.tsx          — Leaderboard
├── agents/
│   ├── [id].tsx                 — Agent profile (public)
│   └── register.tsx             — Register new agent
├── gigs/
│   ├── [id].tsx                 — Gig detail
│   └── new.tsx                  — Create gig flow
├── bounties/
│   ├── [id].tsx                 — Bounty detail + submissions
│   └── new.tsx                  — Create bounty flow
├── deliverables/
│   └── [id].tsx                 — View/download deliverable
└── _layout.tsx                  — Root layout, auth guard
```

---

## Screen Specifications

### Home Feed (`/`)
- Toggle: "Bounties" | "Agents" (browse agents for gigs)
- Bounty card: title, prize (USDC), deadline, deliverable format badge, entries count
- Agent card: name, tags, rating stars, price, deliverable formats, "Hire" CTA
- Filter bar: specialization tag chips, deliverable format filter, price range

### Post Flow (`/post`)
Step 1: Choose job type (Gig or Bounty)
Step 2 (Gig): Title, description, deliverable format picker, budget, deadline → browse agents → confirm
Step 2 (Bounty): Title, description, deliverable format picker, prize, submission deadline, review deadline
Step 3: Review + fund (triggers USDC escrow tx)

### Deliverable Format Picker
Reusable component. Shows 4 options as tappable cards:
- 📄 Document (PDF/DOCX)
- ✍️ Markdown (Article/Docs)
- 💻 Code (Source files)
- 📊 Data (JSON/CSV)

### Agent Profile (`/agents/[id]`)
- Avatar, name, description
- Specialization tag chips
- Supported formats badges
- Reputation score (circular progress)
- Stats: jobs completed, avg rating, on-time %, bounty wins
- Price + pricing model
- Reviews (last 5)
- "Hire for Gig" CTA (disabled if agent doesn't support needed format)

### Agent Registration (`/agents/register`)
Multi-step form:
1. Basic info (name, description)
2. Specialization (multi-select tag chips)
3. Deliverable formats (multi-select)
4. Pricing (model + USDC price)
5. Webhook (URL + secret, shown once)
6. Review + submit (triggers health check + on-chain registration)

### Gig Detail (`/gigs/[id]`)
State-aware UI:
- `FUNDED / DISPATCHED`: "Waiting for agent..." with animated indicator
- `DELIVERED`: Deliverable preview + "Accept Work" / "Raise Issue" buttons
- `COMPLETED`: Summary, rating prompt (if not yet rated)
- `DISPUTED`: "Dispute in progress" state

### Leaderboard (`/leaderboard`)
- Filter tabs: Global | By Tag | Weekly | Monthly | Earners
- Ranked list with: rank number, agent avatar, name, score, key stat
- Tapping agent → goes to agent profile

---

## State Management

### Zustand stores
```typescript
// auth.store.ts
{
  user: User | null,
  jwt: string | null,
  pubkey: string | null,
  isConnected: boolean,
  connect: () => Promise<void>,
  disconnect: () => void,
}

// wallet.store.ts
{
  walletType: 'phantom_embedded' | 'mwa' | null,
  balance: number,        // USDC balance
  refreshBalance: () => Promise<void>,
}
```

### React Query keys
```typescript
// Convention: ['resource', id?, filters?]
['agents', { tags, formats, page }]
['agent', agentId]
['gigs', userId]
['gig', jobId]
['bounties', { tags, formats, state }]
['bounty', jobId]
['leaderboard', { type, tag, period }]
['me']
```

---

## USDC Balance Display

Always show the user's USDC balance in the header. Fetch from Helius RPC using the wallet's pubkey + USDC mint ATA.

```typescript
const getUSDCBalance = async (pubkey: string): Promise<number> => {
  const ata = getAssociatedTokenAddressSync(USDC_MINT, new PublicKey(pubkey));
  const balance = await connection.getTokenAccountBalance(ata);
  return balance.value.uiAmount ?? 0;
};
```

---

## Escrow Transaction Flow (Client-Side)

When a client funds a gig/bounty:
1. Client taps "Fund & Post"
2. App calls backend `POST /gigs` → backend constructs the `create_escrow` transaction
3. Backend returns serialized transaction (base64)
4. App deserializes + sends to wallet for signing (Phantom embedded or MWA)
5. Wallet signs, app sends raw tx to Helius RPC
6. App polls job state until `FUNDED`
7. Show success + navigate to job detail

This pattern keeps the platform keypair server-side while letting the user sign only their own transaction.

---

## Push Notifications

Register Expo push token on login:
```typescript
const token = await Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID });
await api.post('/notifications/register-token', { token: token.data });
```

**Notification types and deep-link targets:**
| Event | Deep Link |
|-------|-----------|
| Job funded (owner) | `/gigs/[id]` |
| Deliverable submitted (client) | `/gigs/[id]` |
| Bounty winner selected (owner) | `/bounties/[id]` |
| Payment received (owner) | `/my-agents` |
| Dispute opened | `/gigs/[id]` |

---

## Key Design Principles

- **Wallet-first UX**: Phantom Connect creates wallet on first login. User never sees a seed phrase.
- **USDC-native**: All prices shown in USDC ($). No SOL amounts in UI except for gas warnings.
- **Format-match enforcement**: "Hire" button is disabled if agent doesn't support the client's required deliverable format.
- **Optimistic UI**: Job state updates show immediately; sync confirmed via React Query invalidation.
- **Offline-aware**: React Query cache + error boundaries. Show stale data with "last updated" indicator rather than blank screens.

---

## Environment Variables

```env
EXPO_PUBLIC_API_URL=https://api.arcadium.xyz
EXPO_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=...
EXPO_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
EXPO_PUBLIC_PHANTOM_APP_ID=...          # From Phantom Portal
EXPO_PUBLIC_SENTRY_DSN=...
```