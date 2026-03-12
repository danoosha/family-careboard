'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import PersonCard from '@/components/dashboard/PersonCard'
import FamilyTimeline from '@/components/timeline/FamilyTimeline'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { getPeople, getAppointments, getPreventiveChecks } from '@/lib/queries'
import type { Person, Appointment, HealthAlert } from '@/types'
import { parseISO, isPast, differenceInDays } from 'date-fns'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function buildAlerts(person: Person, checks: { person_id: string; check_name: string; next_due: string | null }[]): HealthAlert[] {
  const alerts: HealthAlert[] = []
  const personChecks = checks.filter(c => c.person_id === person.id && c.next_due)
  personChecks.forEach(c => {
    if (!c.next_due) return
    try {
      const d = parseISO(c.next_due)
      const diff = differenceInDays(d, new Date())
      if (isPast(d)) alerts.push({ type: 'warning', message: `${c.check_name} overdue` })
      else if (diff <= 30) alerts.push({ type: 'info', message: `${c.check_name} due in ${diff}d` })
    } catch {}
  })
  return alerts.slice(0, 2)
}

export default function DashboardPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [checks, setChecks] = useState<{ person_id: string; check_name: string; next_due: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    Promise.all([getPeople(), getAppointments(), getPreventiveChecks()])
      .then(([p, a, c]) => { setPeople(p); setAppointments(a); setChecks(c) })
      .finally(() => setLoading(false))
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getNextAppointment = (personId: string): Appointment | null => {
    const now = new Date()
    return appointments.find(a => a.person_id === personId && new Date(a.starts_at) >= now) || null
  }

  if (loading) return <AppShell><PageLoader /></AppShell>

  return (
    <AppShell>
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">Good morning</p>
            <h1 className="font-display text-2xl text-stone-800 mt-0.5">Careboard</h1>
          </div>
          <button onClick={signOut} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Person Cards */}
      <div className="space-y-3 mb-8">
        {people.map(person => (
          <PersonCard
            key={person.id}
            person={person}
            nextAppointment={getNextAppointment(person.id)}
            alerts={buildAlerts(person, checks)}
          />
        ))}
      </div>

      {/* Timeline */}
      <FamilyTimeline people={people} />

      <div className="h-4" />
    </AppShell>
  )
}
