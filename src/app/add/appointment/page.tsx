'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormShell from '@/components/forms/FormShell'
import { Field, Input, Select, Textarea } from '@/components/forms/FormField'
import { createClient } from '@/lib/supabase/client'
import { getPeople, getDoctors } from '@/lib/queries'
import type { Person, Doctor } from '@/types'

export default function AddAppointmentPage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ person_id: '', title: '', starts_at: '', location: '', notes: '', doctor_id: '' })

  useEffect(() => {
    Promise.all([getPeople(), getDoctors()]).then(([p, d]) => { setPeople(p); setDoctors(d) })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload: any = { person_id: form.person_id, title: form.title, starts_at: form.starts_at }
    if (form.location) payload.location = form.location
    if (form.notes) payload.notes = form.notes
    if (form.doctor_id) payload.doctor_id = form.doctor_id
    const { error } = await supabase.from('appointments').insert(payload)
    setLoading(false)
    if (!error) router.push('/dashboard')
  }

  return (
    <FormShell title="Add Appointment" onSubmit={handleSubmit} loading={loading}>
      <Field label="Person" required>
        <Select value={form.person_id} onChange={set('person_id')} required>
          <option value="">Select person…</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>
      <Field label="Title" required>
        <Input value={form.title} onChange={set('title')} placeholder="e.g. GP check-up" required />
      </Field>
      <Field label="Date & Time" required>
        <Input type="datetime-local" value={form.starts_at} onChange={set('starts_at')} required />
      </Field>
      <Field label="Doctor">
        <Select value={form.doctor_id} onChange={set('doctor_id')}>
          <option value="">Select doctor…</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </Select>
      </Field>
      <Field label="Location">
        <Input value={form.location} onChange={set('location')} placeholder="Clinic name or address" />
      </Field>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={set('notes')} placeholder="Optional notes…" />
      </Field>
    </FormShell>
  )
}
