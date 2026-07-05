# LyricForge 🎵

**Describe the song you want. Get original lyrics. Render a full track.**

LyricForge is an AI-powered song creation platform. You describe a vibe — genre, mood, tempo, themes — and the app uses Claude to write fully original lyrics, which you can edit and revise as much as you like. When the words feel right, one click sends them to Suno and renders a complete audio track, cover art included.

No scraping, no interpolation of existing songs — every lyric is generated from scratch.

---

## How It Works

Generation happens in two phases, so you only spend a credit when you actually render audio:

```
Phase 1 — Lyrics (free, iterate as much as you want)
  Describe the song → Claude writes structured lyrics → edit in the canvas,
  or ask for revisions ("make the chorus sadder") → repeat until happy

Phase 2 — Render (1 credit)
  Final lyrics + style settings → Suno API → full audio track
  Song status is polled until the track is ready, then audio + cover art
  are persisted to S3 and served via CloudFront
```

The workspace at `/dashboard/generate` is a three-panel layout:

| Panel | What it does |
|---|---|
| **History sidebar** (left) | Your previously generated songs |
| **Lyrics canvas** (centre) | Editable lyrics document with a prompt bar for generating/revising |
| **Style panel** (right) | Genre, mood, tempo, song structure controls + the Generate Song button |

The prompt bar acts on the canvas — there's no chat transcript. The lyrics *are* the state, and your draft survives refreshes (persisted to localStorage via Zustand).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) + TypeScript |
| Styling | Tailwind CSS 4, Radix UI, Motion |
| Database | PostgreSQL on [Neon](https://neon.tech), via Prisma |
| Auth | [Better Auth](https://better-auth.com) — OAuth only (Google + GitHub) |
| Lyrics | [Anthropic Claude API](https://docs.anthropic.com) |
| Audio | [Suno API](https://suno.com) |
| Media storage | AWS S3 + CloudFront |
| Client state | Zustand with `persist` middleware |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database (any Postgres works, but the Prisma client is configured with the Neon adapter)
- API keys for Anthropic and Suno
- Google and/or GitHub OAuth apps (for sign-in)
- An S3 bucket + CloudFront distribution (for persisting rendered audio and cover art)

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-music
npm install
```

`npm install` runs `prisma generate` automatically via the `postinstall` script.

### 2. Configure environment

Create a `.env` file at the project root:

```env
# Database (Neon Postgres connection string)
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=        # generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000

# OAuth — Google (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OAuth — GitHub (https://github.com/settings/developers)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Anthropic (lyrics generation)
ANTHROPIC_API_KEY=

# Suno (audio rendering)
SUNO_API_KEY=
SUNO_API_BASE_URL=

# AWS (persist rendered media to S3, serve via CloudFront)
AWS_S3_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_CLOUDFRONT_URL=        # e.g. https://dxxxxxxxxxxxx.cloudfront.net

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

OAuth callback URLs to register with your providers:

- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

### 3. Set up the database

```bash
npx prisma migrate dev
```

This creates the tables: Better Auth's `user` / `session` / `account` / `verification`, plus `songs` and `credits`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google or GitHub, and head to the dashboard.

### 5. Grant yourself credits

Each render costs 1 credit and new accounts start at 0. There's no payment flow wired up yet, so add credits directly — e.g. via Prisma Studio:

```bash
npx prisma studio
```

Then edit your row in the `credits` table (or insert one with your `userId` and a `balance`).

## Project Structure

```
app/
├── page.tsx                    # landing page
├── (auth)/sign-in/             # OAuth sign-in
├── dashboard/
│   ├── page.tsx                # song history + credits balance
│   └── generate/               # three-panel workspace
├── song/[id]/                  # individual song result page
└── api/
    ├── auth/[...all]/          # Better Auth handler
    ├── lyrics/                 # phase 1: Claude lyrics (free)
    ├── generate/               # phase 2: Suno render (1 credit)
    ├── songs/                  # song list + per-song status (polling)
    └── credits/                # balance check

components/                     # workspace panels, audio player, UI primitives
lib/
├── claude.ts                   # Anthropic wrapper + lyrics prompts
├── suno.ts                     # Suno wrapper + style prompt builder
├── credits.ts                  # atomic credit deduct/refund helpers
├── storage.ts                  # S3 persistence for rendered media
├── auth.ts / auth-client.ts    # Better Auth config
├── store.ts                    # Zustand workspace store
└── db/                         # Prisma client (Neon adapter)
prisma/                         # schema + migrations
```

## Notable Behaviours

- **Credits are atomic and safe.** Deduction uses a conditional decrement so the balance can never go negative under concurrent requests.
- **Failed renders auto-refund.** If Suno fails after the credit was deducted, the credit is returned and the song is marked `failed`.
- **Songs are private.** Only the creator can see their songs — no public gallery.
- **Media is persisted.** Suno's temporary URLs expire, so finished audio and cover art are copied to S3 and served through CloudFront.
- **Lyrics revisions are rate-limited** per session to keep Claude spend bounded.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Browse/edit the database in a GUI |
| `npx prisma migrate dev` | Apply schema changes |

## Deployment

Built for [Vercel](https://vercel.com). Push the repo, set the environment variables above in the project settings (with `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` pointing at your production domain), and update your OAuth callback URLs to match.
