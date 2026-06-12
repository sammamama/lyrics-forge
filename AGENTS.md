# AGENT.md — LyricForge

> AI-powered song generator. User defines a sound/feel → LLM writes original lyrics → Suno renders the track. Pay-per-song via credits.

---

## What This Project Is

LyricForge lets users describe the vibe, genre, mood, and themes of a song they want. The app passes that context to Claude (or GPT-4o) to generate original lyrics, then sends those lyrics + a style prompt to the Suno API to produce a full audio track. Users purchase credits to generate songs. No scraping. No copyright exposure. Fully original output.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers (API routes) |
| Database | PostgreSQL via NeonDB |
| ORM | Prisma |
| Auth | Better Auth — OAuth only (Google + GitHub), no email/password |
| Client state | Zustand + `persist` middleware (workspace draft survives refresh via localStorage) |

| LLM | Anthropic Claude API (lyrics generation) |
| Music | Suno Official API |
| Payments | Stripe (credit packs) |
| Deployment | Vercel |

---

## File & Folder Structure

> No `src/` directory — `app/`, `components/`, `lib/`, and `types/` live at the project root.

```
lyricforge/
├── AGENTS.md                       ← you are here
├── DESIGN.md                       ← design system reference
├── .env                            ← secrets (never commit; read by both Next.js and Prisma CLI)
├── next.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/                 ← auto-generated migration files
│
├── app/
│   ├── layout.tsx
│   ├── globals.css                 ← design tokens from DESIGN.md
│   ├── page.tsx                    ← landing page
│   ├── (auth)/
│   │   └── sign-in/page.tsx        ← OAuth buttons (Google, GitHub) — no sign-up page needed
│   ├── dashboard/
│   │   ├── layout.tsx              ← sidebar / bottom-tab shell
│   │   ├── page.tsx                ← song history + credits balance
│   │   ├── generate/page.tsx       ← three-panel workspace: history sidebar | lyrics canvas + prompt bar | style panel
│   │   └── credits/page.tsx        ← buy credit packs
│   ├── song/
│   │   └── [id]/page.tsx           ← individual song result page
│   └── api/
│       ├── auth/[...all]/route.ts  ← Better Auth handler
│       ├── lyrics/route.ts         ← phase 1: Claude lyrics generation/revision (no credit)
│       ├── generate/route.ts       ← phase 2: lyrics + style → Suno (deducts 1 credit)
│       ├── songs/route.ts          ← lightweight song list for history sidebar (id, title, status)
│       ├── songs/[id]/route.ts     ← song status (drives client polling)
│       ├── credits/route.ts        ← check balance
│       ├── checkout/route.ts       ← create Stripe Checkout session
│       └── webhooks/
│           └── stripe/route.ts     ← Stripe payment webhooks
│
├── components/
│   ├── ui/                         ← shared primitives (Button, Input, etc.)
│   ├── HistorySidebar.tsx          ← compact song list (left panel, generate page)
│   ├── LyricsCanvas.tsx            ← editable lyrics document (centre panel)
│   ├── PromptBar.tsx               ← command bar under canvas (generate/revise lyrics)
│   ├── StylePanel.tsx              ← genre/mood/tempo/structure controls + Generate Song CTA (right panel)
│   ├── SongCard.tsx                ← song result with audio player
│   ├── CreditsBadge.tsx            ← displays remaining credits
│   └── AudioPlayer.tsx             ← wraps Suno audio URL
│
├── lib/
│   ├── db/
│   │   └── index.ts                ← Prisma client (NeonDB)
│   ├── auth.ts                     ← Better Auth config
│   ├── auth-client.ts              ← Better Auth client (browser)
│   ├── store.ts                    ← Zustand workspace store (lyrics draft + style inputs, persisted to localStorage)
│   ├── claude.ts                   ← Anthropic SDK wrapper + lyrics prompt
│   ├── suno.ts                     ← Suno API wrapper + style prompt builder
│   ├── stripe.ts                   ← Stripe client + credit pack config
│   └── credits.ts                  ← credit check/deduct/refund helpers
│
├── types/
│   └── index.ts                    ← shared TS types
│
└── public/
    └── og-image.png
```

---

## Database Schema (prisma/schema.prisma)

```ts
// users         — managed by Better Auth
// songs         — each generated song
// credits       — credit balance per user
// transactions  — Stripe purchase history
```

### Key tables

**songs**
- `id`, `userId`, `prompt` (raw user input), `lyrics` (LLM output), `sunoJobId`, `audioUrl`, `status` (pending | processing | done | failed), `createdAt`

**credits**
- `id`, `userId`, `balance` (integer, starts at 0)

**transactions**
- `id`, `userId`, `stripePaymentIntentId`, `creditsAdded`, `amountPaid`, `createdAt`

---

## Core Generation Pipeline

Two phases. Lyrics are free to iterate; the credit is spent only when Suno renders audio.

```
Phase 1 — lyrics (free, repeatable)
POST /api/lyrics
  1. Auth check (Better Auth session)
  2. Build lyrics prompt from user input (description + genre, mood, themes, tempo feel)
     — or a revision prompt if currentLyrics are passed ("make the chorus sadder")
  3. Call Claude API → get structured lyrics (verse, chorus, bridge)
  4. Return { lyrics } — held in client state, not persisted
     (rate-limit revisions per session to cap Claude spend)

Phase 2 — render (1 credit)
POST /api/generate
  1. Auth check (Better Auth session)
  2. Check credits balance ≥ 1
  3. Receive final lyrics (user may have edited them in the canvas) + style inputs
  4. Build Suno style prompt from style inputs (lib/suno.ts buildStylePrompt)
  5. POST to Suno API with lyrics + style prompt
  6. Deduct 1 credit from user balance
  7. Save song record to DB (status: processing)
  8. Return { songId, sunoJobId }

  (polling via GET /api/songs/[id]) → update song status + audioUrl when ready
```

---

## Environment Variables (.env)

```env
# Database
DATABASE_URL=

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# OAuth (Google)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth (GitHub)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Anthropic
ANTHROPIC_API_KEY=

# Suno
SUNO_API_KEY=
SUNO_API_BASE_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Credit Packs (Stripe)

| Pack | Credits | Price |
|---|---|---|
| Starter | 5 | $3.99 |
| Creator | 20 | $14.99 |
| Studio | 60 | $34.99 |

Each song generation costs **1 credit**.

---

## Resolved Decisions

These were open questions — now decided. Build against them; don't re-ask.

1. **Suno delivery: polling.** The song page polls `GET /api/songs/[id]`; that route checks Suno job status and updates the row. No cron, no webhook (may add later).
2. **Song visibility: private.** Songs are visible only to the user who created them. No public gallery.
3. **Credit expiry: never.** Credits are lifetime.
4. **Lyrics structure: default verse/chorus/verse/chorus/bridge/chorus**, with optional user override via a collapsed "song structure" section in the style panel.
5. **Style prompt: derived.** Built from the user's genre/mood/tempo inputs in `lib/suno.ts` (`buildStylePrompt`). Users never input a raw Suno style string.
6. **Failed generation: auto-refund.** If Suno fails after the credit was deducted, refund the credit automatically and mark the song `failed`. Guard against double-refunds.
7. **Auth: OAuth only.** Sign-in via Google and GitHub (Better Auth `socialProviders`). No email/password, no magic links. Client IDs/secrets live in `.env`. Better Auth's generated tables (`user`, `session`, `account`, `verification`) already support OAuth — `account` stores provider tokens.
8. **Generate UX: three-panel workspace.** `/dashboard/generate` = history sidebar (left) | editable lyrics canvas with prompt bar (centre) | style panel with Generate Song CTA (right). The prompt bar is a command input acting on the canvas, not a chat with a message transcript — lyrics ARE the state. Layout details in DESIGN.md.
9. **Two-phase generation, credit on render only.** `POST /api/lyrics` (Claude, free, repeatable — rate-limited) generates/revises lyrics held in client state. `POST /api/generate` (Suno, 1 credit) renders audio and creates the song row. No song record exists until render.
10. **Draft persistence: Zustand + `persist` (localStorage).** Workspace draft (lyrics + style inputs) lives in `lib/store.ts` and survives refresh. Per-device only — no cross-device drafts, no DB draft rows in v1. Store cleared after successful render.

---

## Conventions

- All API routes return `{ data, error }` shape
- Use Prisma for all DB queries — no raw SQL
- Auth session available via `auth.api.getSession()` in route handlers
- Keep Claude prompts in `lib/claude.ts` — don't inline them in route handlers
- Stripe webhook must be raw body — use `req.text()` not `req.json()`