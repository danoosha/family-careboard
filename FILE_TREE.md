# Family Careboard — Project File Tree

family-careboard/
├── app/
│   ├── layout.tsx                    ← Root layout
│   ├── page.tsx                      ← Redirect to /dashboard
│   ├── globals.css                   ← Global styles
│   ├── login/
│   │   └── page.tsx                  ← Magic link login
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              ← Auth callback handler
│   ├── dashboard/
│   │   └── page.tsx                  ← Main dashboard
│   ├── people/
│   │   └── [id]/
│   │       └── page.tsx              ← Person profile
│   ├── doctors/
│   │   └── page.tsx                  ← All doctors
│   ├── documents/
│   │   └── page.tsx                  ← All documents
│   └── chat/
│       └── page.tsx                  ← Chat placeholder
│
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx             ← Bottom navigation
│   │   └── AppShell.tsx              ← Authenticated shell wrapper
│   ├── ui/
│   │   ├── Card.tsx                  ← Base card
│   │   ├── Badge.tsx                 ← Status badge
│   │   ├── Skeleton.tsx              ← Loading skeleton
│   │   ├── EmptyState.tsx            ← Empty state
│   │   └── SectionHeader.tsx        ← Section header
│   ├── dashboard/
│   │   ├── PersonCard.tsx            ← Person summary card
│   │   ├── FamilyTimeline.tsx        ← Combined timeline
│   │   └── TimelineItem.tsx         ← Single timeline event
│   ├── person/
│   │   ├── PersonHeader.tsx          ← Colored header
│   │   ├── OverviewSection.tsx
│   │   ├── TimelineSection.tsx
│   │   ├── CareJourneysSection.tsx
│   │   ├── DoctorsSection.tsx
│   │   ├── PreventiveSection.tsx
│   │   ├── MedicationsSection.tsx
│   │   ├── PrescriptionsSection.tsx
│   │   ├── ReferralsSection.tsx
│   │   ├── TestResultsSection.tsx
│   │   └── DocumentsSection.tsx
│   └── forms/
│       ├── AddMenu.tsx               ← Floating + button + drawer
│       ├── AddAppointmentForm.tsx
│       ├── AddPreventiveForm.tsx
│       ├── AddPrescriptionForm.tsx
│       ├── AddReferralForm.tsx
│       ├── AddTestResultForm.tsx
│       ├── AddDoctorForm.tsx
│       └── AddDocumentForm.tsx
│
├── lib/
│   └── supabase/
│       ├── client.ts                 ← Browser client
│       ├── server.ts                 ← Server client
│       └── middleware.ts             ← Session refresh
│
├── types/
│   └── index.ts                      ← All TypeScript types
│
├── middleware.ts                     ← Route protection
├── public/
│   ├── manifest.json                 ← PWA manifest
│   ├── sw.js                         ← Service worker
│   └── icons/
│       ├── icon-192.png              ← (placeholder)
│       └── icon-512.png              ← (placeholder)
│
├── .env.local.example
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
