# Family Careboard

A private, mobile-first family health dashboard built with Next.js 14 and Supabase.

---

## Stack

- **Next.js 14** — App Router, server components
- **TypeScript**
- **TailwindCSS** — mobile-first, custom person color tokens
- **Supabase** — Auth (magic link), Postgres, Row Level Security
- **date-fns** — date utilities
- **lucide-react** — icons

---

## Prerequisites

- Node.js 18+
- An existing Supabase project with the Family Careboard schema already applied

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd family-careboard
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your Supabase project values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in: **Supabase Dashboard → Project Settings → API**

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### 4. First login

Enter your email address and tap **Send Magic Link**.  
Check your inbox and tap the link to sign in.

---

## Project structure

```
app/
  login/           ← Magic link login
  dashboard/       ← Family overview + timeline
  people/[id]/     ← Full person profile (11 sections)
  doctors/         ← All doctors
  documents/       ← Documents grouped by person
  chat/            ← Chat UI (placeholder)
  auth/callback/   ← Supabase auth callback

components/
  layout/          ← AppShell, BottomNav
  ui/              ← Card, Badge, Skeleton, EmptyState, SectionHeader
  dashboard/       ← PersonCard, FamilyTimeline, TimelineItem
  person/          ← PersonHeader, ProfileSection, all 10 section components
  forms/           ← AddMenu, FormField primitives, 7 add forms

lib/
  supabase/        ← Browser, server, and middleware clients
  colors.ts        ← Person color map (Dana/Jenny/Lia/Ahuva)
  dates.ts         ← Date formatting utilities
  dashboard.ts     ← buildAlerts, buildSuggestions, buildTimelineEvents

types/
  index.ts         ← All TypeScript types matching Supabase schema
```

---

## Features

| Feature | Status |
|---|---|
| Magic link auth | ✅ |
| Family dashboard | ✅ |
| Person cards with alerts & suggestions | ✅ |
| Family timeline (1m / 6m / 12m) | ✅ |
| Person profile with 11 collapsible sections | ✅ |
| Add appointment / preventive / prescription / referral / test result / doctor / document | ✅ |
| Documents page grouped by person | ✅ |
| Doctors page with person tags | ✅ |
| Chat UI placeholder | ✅ |
| PWA (installable) | ✅ |
| Mobile-first design | ✅ |

---

## Person colors

| Person | Color |
|---|---|
| Dana   | Pistachio green `#C7E6A3` |
| Jenny  | Mustard `#D4A017` |
| Lia    | Altrosa `#E8A0A6` |
| Ahuva  | Lavender `#C9C3E6` |

---

## PWA installation

On iOS Safari: **Share → Add to Home Screen**  
On Android Chrome: **Menu → Add to Home Screen** or install prompt

---

## Build for production

```bash
npm run build
npm start
```
