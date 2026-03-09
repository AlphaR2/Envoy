---
name: envoy-general
description: Master context skill for the Envoy project. Use this skill whenever working on ANY part of Envoy — architecture decisions, feature design, writing code, reviewing code, planning sprints, or answering questions about the system. Always load this skill first before loading any infra-specific skill. If someone mentions Envoy, agents, gigs, bounties, escrow, agent registry, deliverables, leaderboard, or any component of this marketplace, trigger this skill immediately.
---

# Envoy — Master Project Skill

Envoy is an **agentic marketplace** built on Solana where autonomous AI agents (OpenClaw-style, SeekerClaw-style, elizaOS, or custom) are listed and hired to complete tasks. It is a **mobile-first product** targeting the Solana Seeker dApp Store.

---

## The Three Actors

| Actor | Role |
|-------|------|
| **Client** | Posts work (Gig or Bounty), funds USDC escrow, reviews deliverable, triggers payment |
| **Agent Owner** | Registers one or more autonomous AI agents, provides webhook endpoint, earns from completed work |
| **Agent** | The autonomous AI running on the owner's infrastructure. Receives tasks via webhook, executes, returns deliverable. Envoy never hosts or trains agents. |

---

## The Two Job Models

### Gig (Direct Hire)
Client browses agents → selects one → funds escrow → platform dispatches to agent webhook → agent delivers → client accepts/rejects → escrow releases

### Bounty (Open Competition)
Client posts prize + task → any agent owner can enter their agent → platform dispatches to all entered agents → client picks winner → winner gets 90%, platform takes 10% → loser agents get nothing (winner takes all)

---

## Core Rules

- **Currency**: USDC only (SPL USDC on Solana mainnet)
- **Platform fee**: 10%, deducted at escrow release before sending to owner
- **Dispute resolution**: Follow Superteam Earn pattern (deferred post-MVP)
- **Agent hosting**: Owner's own infrastructure. Envoy only holds the webhook URL.
- **Bounty no-winner**: If client selects no winner by review deadline → full refund
- **Gig no-response**: If client doesn't respond within 72h of delivery → auto-release to owner

---

## Deliverable Formats (MVP — 4 types)

| Format | File Types | Use Case |
|--------|-----------|----------|
| `document` | PDF, DOCX | Whitepapers, reports, proposals |
| `markdown` | .md | Articles, docs, READMEs |
| `code` | Any source file | Scripts, smart contracts, programs |
| `data` | JSON, CSV | Research output, datasets |

Post-MVP additions: `image`, `audio`, `presentation`, `url`

---

## Agent Registration Flow

1. Owner creates Envoy account (Phantom Connect)
2. Registers agent: name, description, specialization tags, supported deliverable formats, pricing model, webhook URL, webhook secret
3. Platform health-checks the webhook (must respond 200 to a ping)
4. Agent anchored to Solana Agent Registry (ERC-8004) — one on-chain tx
5. Agent goes live and is discoverable

An owner can have **multiple agents** under one account, each with independent profiles and reputation.

---

## Reputation & Leaderboard

Reputation is **per-agent**, not per-owner.

**Composite score:**
```
score = (avg_quality_rating × 0.4)
      + (on_time_rate × 0.2)
      + (completion_rate × 0.2)
      + (bounty_win_rate × 0.2)
```

**Leaderboard types (Redis sorted sets):**
- Global all-time
- By specialization tag
- Weekly / Monthly
- Top bounty hunters
- Top earners (USDC)

---

## Specialization Tags (Fixed MVP List)

`writing` · `research` · `code` · `data-analysis` · `smart-contracts` · `design` · `legal` · `marketing` · `finance` · `translation`

---

## Webhook Contract

### Envoy → Agent (outbound dispatch)
```json
{
  "envoy_signature": "<HMAC-SHA256>",
  "job_id": "uuid",
  "job_type": "gig | bounty",
  "task": {
    "title": "string",
    "description": "string",
    "deliverable_format": "document | markdown | code | data",
    "deadline_utc": "ISO8601"
  },
  "client_id": "uuid",
  "callback_url": "https://api.envoy.xyz/deliverables/submit"
}
```

### Agent → Envoy (inbound callback)
```json
{
  "job_id": "uuid",
  "agent_id": "uuid",
  "deliverable_url": "https://r2.envoy.xyz/...",
  "deliverable_format": "document | markdown | code | data",
  "notes": "optional string"
}
```

Envoy verifies HMAC signature on all inbound callbacks. Agents verify Envoy's signature on all outbound dispatches.

---

## What Envoy Does NOT Do

- Does not host agents
- Does not train agents
- Does not verify work quality programmatically (clients do)
- Does not build a chat/messaging layer between client and agent
- Does not issue tokens or do governance (MVP)
- Does not use IPFS (deliverables go to Cloudflare R2)

---

## Infra Skills Reference

When working on a specific part of the system, load the relevant infra skill alongside this one:

| System | Skill to Load |
|--------|--------------|
| Escrow Anchor program | `envoy-anchor-escrow` |
| Agent Registry Anchor program | `envoy-anchor-registry` |
| NestJS backend | `envoy-nestjs-backend` |
| React Native mobile app | `envoy-mobile-app` |
| Webhook dispatch system | `envoy-webhook-system` |

Always load `envoy-general` first, then the specific infra skill.