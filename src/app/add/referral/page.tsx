'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormShell from '@/components/forms/FormShell'
import { Field, Input, Select, Textarea } from '@/components/forms/FormField'
import { createClient } from '@/lib/supabase/client'
import { getPeople } from '@/lib/queries'
import type { Person } from '@/types'

export default function AddReferralPage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ person_id: '', specialist_name: '', specialty: '', reason: '', issue_date: '', expiry_date: '', drive_url: '' })

  useEffect(() => { getPeople().then(setPeople) }, [])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload: any = { person_id: form.person_id, status: 'active' }
    if (form.specialist_name) payload.specialist_name = form.specialist_name
    if (form.specialty) payload.specialty = form.specialty
    if (form.reason) payload.reason = form.reason
    if (form.issue_date) payload.issue_date = form.issue_date
    if (form.expiry_date) payload.expiry_date = form.expiry_date
    if (form.drive_url) payload.drive_url = form.drive_url
    const { error } = await supabase.from('referrals').insert(payload)
    setLoading(false)
    if (!error) router.back()
  }

  return (
    <FormShell title="Add Referral" onSubmit={handleSubmit} loading={loading}>
      <Field label="Person" required>
        <Select value={form.person_id} onChange={set('person_id')} required>
          <option value="">Select person…</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>
      <Field label="Specialist name"><Input value={form.specialist_name} onChange={set('specialist_name')} placeholder="Dr. …" /></Field>
      <Field label="Specialty"><Input value={form.specialty} onChange={set('specialty')} placeholder="e.g. Dermatology" /></Field>
      <Field label="Reason"><Textarea value={form.reason} onChange={set('reason')} placeholder="Reason for referral…" /></Field>
      <Field label="Issue date"><Input type="date" value={form.issue_date} onChange={set('issue_date')} /></Field>
      <Field label="Expiry date"><Input type="date" value={form.expiry_date} onChange={set('expiry_date')} /></Field>
      <Field label="Drive URL"><Input type="url" value={form.drive_url} onChange={set('drive_url')} placeholder="https://…" /></Field>
    </FormShell>
  )
}
