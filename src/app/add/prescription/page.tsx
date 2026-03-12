'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormShell from '@/components/forms/FormShell'
import { Field, Input, Select, Textarea } from '@/components/forms/FormField'
import { createClient } from '@/lib/supabase/client'
import { getPeople, getDoctors } from '@/lib/queries'
import type { Person, Doctor } from '@/types'

export default function AddPrescriptionPage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ person_id: '', medication_name: '', dosage: '', issue_date: '', doctor_id: '', drive_url: '', notes: '' })

  useEffect(() => { Promise.all([getPeople(), getDoctors()]).then(([p, d]) => { setPeople(p); setDoctors(d) }) }, [])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload: any = { person_id: form.person_id, medication_name: form.medication_name }
    if (form.dosage) payload.dosage = form.dosage
    if (form.issue_date) payload.issue_date = form.issue_date
    if (form.doctor_id) payload.doctor_id = form.doctor_id
    if (form.drive_url) payload.drive_url = form.drive_url
    if (form.notes) payload.notes = form.notes
    const { error } = await supabase.from('prescriptions').insert(payload)
    setLoading(false)
    if (!error) router.back()
  }

  return (
    <FormShell title="Add Prescription" onSubmit={handleSubmit} loading={loading}>
      <Field label="Person" required>
        <Select value={form.person_id} onChange={set('person_id')} required>
          <option value="">Select person…</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>
      <Field label="Medication" required>
        <Input value={form.medication_name} onChange={set('medication_name')} placeholder="e.g. Ibuprofen 400mg" required />
      </Field>
      <Field label="Dosage"><Input value={form.dosage} onChange={set('dosage')} placeholder="e.g. 1×/day" /></Field>
      <Field label="Issue date"><Input type="date" value={form.issue_date} onChange={set('issue_date')} /></Field>
      <Field label="Doctor">
        <Select value={form.doctor_id} onChange={set('doctor_id')}>
          <option value="">Select doctor…</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </Select>
      </Field>
      <Field label="Drive URL"><Input type="url" value={form.drive_url} onChange={set('drive_url')} placeholder="https://…" /></Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={set('notes')} /></Field>
    </FormShell>
  )
}
