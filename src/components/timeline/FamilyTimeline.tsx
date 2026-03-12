'use client'
import { useState, useEffect } from 'react'
import { isToday, isTomorrow, parseISO, format } from 'date-fns'
import { getFamilyTimeline } from '@/lib/queries'
import type { Person, TimelineEvent } from '@/types'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { hexToRgba, darken } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  appointment: 'Appt',
  care_step: 'Care',
  preventive: 'Check',
  vaccination: 'Vacc',
}

interface Props {
  people: Person[]
}

export default function FamilyTimeline({ people }: Props) {
  const [months, setMonths] = useState(6)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getFamilyTimeline(months, people)
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [months, people])

  const grouped = events.reduce((acc, event) => {
    const key = event.date.substring(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, TimelineEvent[]>)

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Family Timeline</h2>
        <div className="flex gap-1">
          {[1, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${months === m ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'}`}
            >
              {m}mo
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : sortedDates.length === 0 ? (
        <EmptyState icon="📅" title="No events in this period" />
      ) : (
        <div className="px-4 space-y-1">
          {sortedDates.map(dateKey => {
            const d = parseISO(dateKey)
            const highlight = isToday(d) || isTomorrow(d)
            return (
              <div key={dateKey} className={`rounded-xl p-3 ${highlight ? 'bg-amber-50 border border-amber-100' : 'bg-white'} card-shadow`}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-xs font-semibold ${highlight ? 'text-amber-700' : 'text-stone-500'}`}>
                    {isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE dd MMM')}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {grouped[dateKey].map(event => {
                    const person = people.find(p => p.id === event.person_id)
                    return (
                      <div key={event.id} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: event.color }}
                        />
                        <span className="text-xs text-stone-600 flex-1 truncate">{event.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: hexToRgba(event.color, 0.2), color: darken(event.color, 0.4) }}>
                          {person?.display_name?.split(' ')[0] || '?'}
                        </span>
                        <span className="text-[10px] text-stone-400">{TYPE_LABELS[event.type]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
