'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getPeople } from '@/lib/queries'
import type { Person } from '@/types'
import { hexToRgba, darken } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getPeople().then(setPeople).finally(() => setLoading(false))
  }, [])

  if (loading) return <AppShell><PageLoader /></AppShell>

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-4">
        <h1 className="font-display text-2xl text-stone-800">People</h1>
        <p className="text-sm text-stone-400 mt-0.5">Your family members</p>
      </div>
      <div className="px-4 space-y-3">
        {people.map(person => (
          <button
            key={person.id}
            onClick={() => router.push(`/people/${person.id}`)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white card-shadow active:scale-[0.98] transition-transform"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: hexToRgba(person.color_hex, 0.3), color: darken(person.color_hex, 0.4) }}
            >
              {person.display_name[0]}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-stone-800">{person.display_name}</div>
              {person.status_summary && (
                <div className="text-sm text-stone-500 mt-0.5 truncate">{person.status_summary}</div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300" />
          </button>
        ))}
      </div>
    </AppShell>
  )
}
