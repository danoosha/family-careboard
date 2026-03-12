'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormShell from '@/components/forms/FormShell'
import { Field, Input, Select, Textarea } from '@/components/forms/FormField'
import { createClient } from '@/lib/supabase/client'
import { getPeople } from '@/lib/queries'
import type { Person } from '@/types'

export default function AddPreventivePage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ person_id: '', check_name: '', last_done: '', next_due: '', frequency_months: '', notes: '' })

  useEffect(() => { getPeople().then(setPeople) }, [])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload: any = { person_id: form.person_id, check_name: form.check_name }
    if (form.last_done) payload.last_done = form.last_done
    if (form.next_due) payload.next_due = form.next_due
    if (form.frequency_months) payload.frequency_months = parseInt(form.frequency_months)
    if (form.notes) payload.notes = form.notes
    const { error } = await supabase.from('preventive_checks').insert(payload)
    setLoading(false)
    if (!error) router.push('/dashboard')
  }

  return (
    <FormShell title="Add Preventive Check" onSubmit={handleSubmit} loading={loading}>
      <Field label="Person" required>
        <Select value={form.person_id} onChange={set('person_id')} required>
          <option value="">Select person…</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>
      <Field label="Check name" required>
        <Input value={form.check_name} onChange={set('check_name')} placeholder="e.g. Eye exam" required />
      </Field>
      <Field label="Last done">
        <Input type="date" value={form.last_done} onChange={set('last_done')} />
      </Field>
      <Field label="Next due">
        <Input type="date" value={form.next_due} onChange={set('next_due')} />
      </Field>
      <Field label="Frequency (months)">
        <Input type="number" value={form.frequency_months} onChange={set('frequency_months')} placeholder="e.g. 12" />
      </Field>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={set('notes')} placeholder="Optional notes…" />
      </Field>
    </FormShell>
  )
}
