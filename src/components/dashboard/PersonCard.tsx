'use client'
import { useRouter } from 'next/navigation'
import { ChevronRight, AlertTriangle, Lightbulb, Calendar } from 'lucide-react'
import type { Person, Appointment, HealthAlert } from '@/types'
import { hexToRgba, darken, getRelativeDate } from '@/lib/utils'

interface PersonCardProps {
  person: Person
  nextAppointment?: Appointment | null
  alerts?: HealthAlert[]
}

export default function PersonCard({ person, nextAppointment, alerts = [] }: PersonCardProps) {
  const router = useRouter()
  const bg = hexToRgba(person.color_hex, 0.25)
  const border = hexToRgba(person.color_hex, 0.5)
  const accent = darken(person.color_hex, 0.3)

  return (
    <div
      onClick={() => router.push(`/people/${person.id}`)}
      className="mx-4 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform animate-slide-up"
      style={{ background: bg, border: `1.5px solid ${border}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: person.color_hex, color: accent }}>
              {person.display_name[0]}
            </div>
            <h3 className="font-semibold text-stone-800 text-base">{person.display_name}</h3>
          </div>

          {person.status_summary && (
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">{person.status_summary}</p>
          )}

          {person.next_action_summary && (
            <p className="text-xs text-stone-500 mt-1 italic">{person.next_action_summary}</p>
          )}

          {nextAppointment && (
            <div className="flex items-center gap-1.5 mt-2">
              <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="text-xs text-stone-600">
                <strong>{getRelativeDate(nextAppointment.starts_at)}</strong> · {nextAppointment.title}
              </span>
            </div>
          )}

          {alerts.length > 0 && (
            <div className="mt-2 space-y-1">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  {alert.type === 'warning'
                    ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    : <Lightbulb className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  }
                  <span className="text-xs text-stone-600">{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-stone-400 mt-1 shrink-0" />
      </div>
    </div>
  )
}
