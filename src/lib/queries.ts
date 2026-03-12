import { createClient } from '@/lib/supabase/client'
import type { Person, Doctor, Appointment, CareJourney, CareJourneyStep, PreventiveCheck, Medication, Prescription, Referral, TestResult, Document, Vaccination, TimelineEvent } from '@/types'
import { parseISO, isWithinInterval, addMonths } from 'date-fns'

export async function getPeople(): Promise<Person[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('people').select('*').order('display_name')
  if (error) throw error
  return data || []
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from('people').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function getDoctors(): Promise<Doctor[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('doctors').select('*').order('full_name')
  if (error) throw error
  return data || []
}

export async function getPersonDoctors(personId: string): Promise<Doctor[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('person_doctors')
    .select('doctors(*)')
    .eq('person_id', personId)
  if (error) throw error
  return (data || []).map((d: any) => d.doctors).filter(Boolean)
}

export async function getAppointments(personId?: string): Promise<Appointment[]> {
  const supabase = createClient()
  let query = supabase.from('appointments').select('*, doctors(*)').order('starts_at', { ascending: true })
  if (personId) query = query.eq('person_id', personId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getCareJourneys(personId: string): Promise<CareJourney[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('care_journeys').select('*').eq('person_id', personId).order('started_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getCareJourneySteps(personId?: string): Promise<CareJourneyStep[]> {
  const supabase = createClient()
  let query = supabase.from('care_journey_steps').select('*').order('step_date', { ascending: true })
  if (personId) query = query.eq('person_id', personId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getPreventiveChecks(personId?: string): Promise<PreventiveCheck[]> {
  const supabase = createClient()
  let query = supabase.from('preventive_checks').select('*').order('next_due', { ascending: true })
  if (personId) query = query.eq('person_id', personId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getMedications(personId: string): Promise<Medication[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('medications').select('*').eq('person_id', personId).order('name')
  if (error) throw error
  return data || []
}

export async function getPrescriptions(personId: string): Promise<Prescription[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('prescriptions').select('*, doctors(*)').eq('person_id', personId).order('issue_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getReferrals(personId: string): Promise<Referral[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('referrals').select('*').eq('person_id', personId).order('issue_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getTestResults(personId: string): Promise<TestResult[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('test_results').select('*').eq('person_id', personId).order('test_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getDocuments(personId?: string): Promise<Document[]> {
  const supabase = createClient()
  let query = supabase.from('documents').select('*').order('document_date', { ascending: false })
  if (personId) query = query.eq('person_id', personId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getVaccinations(personId?: string): Promise<Vaccination[]> {
  const supabase = createClient()
  let query = supabase.from('vaccinations').select('*').order('next_due', { ascending: true })
  if (personId) query = query.eq('person_id', personId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getFamilyTimeline(months: number, people: Person[]): Promise<TimelineEvent[]> {
  const now = new Date()
  const from = addMonths(now, -Math.floor(months / 2))
  const to = addMonths(now, months)

  const colorMap = people.reduce((acc, p) => ({ ...acc, [p.id]: p.color_hex }), {} as Record<string, string>)

  const [appointments, steps, checks, vaccinations] = await Promise.all([
    getAppointments(),
    getCareJourneySteps(),
    getPreventiveChecks(),
    getVaccinations(),
  ])

  const events: TimelineEvent[] = []

  appointments.forEach(a => {
    if (!a.starts_at) return
    try {
      const d = parseISO(a.starts_at)
      if (isWithinInterval(d, { start: from, end: to })) {
        events.push({ id: a.id, person_id: a.person_id, title: a.title, date: a.starts_at, type: 'appointment', color: colorMap[a.person_id] || '#ccc' })
      }
    } catch {}
  })

  steps.forEach(s => {
    if (!s.step_date) return
    try {
      const d = parseISO(s.step_date)
      if (isWithinInterval(d, { start: from, end: to })) {
        events.push({ id: s.id, person_id: s.person_id, title: s.title, date: s.step_date, type: 'care_step', color: colorMap[s.person_id] || '#ccc' })
      }
    } catch {}
  })

  checks.forEach(c => {
    if (!c.next_due) return
    try {
      const d = parseISO(c.next_due)
      if (isWithinInterval(d, { start: from, end: to })) {
        events.push({ id: c.id, person_id: c.person_id, title: c.check_name, date: c.next_due, type: 'preventive', color: colorMap[c.person_id] || '#ccc' })
      }
    } catch {}
  })

  vaccinations.forEach(v => {
    if (!v.next_due) return
    try {
      const d = parseISO(v.next_due)
      if (isWithinInterval(d, { start: from, end: to })) {
        events.push({ id: v.id, person_id: v.person_id, title: v.vaccine_name, date: v.next_due, type: 'vaccination', color: colorMap[v.person_id] || '#ccc' })
      }
    } catch {}
  })

  return events.sort((a, b) => a.date.localeCompare(b.date))
}
