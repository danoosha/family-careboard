'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormShell from '@/components/forms/FormShell'
import { Field, Input, Select, Textarea } from '@/components/forms/FormField'
import { createClient } from '@/lib/supabase/client'
import { getPeople } from '@/lib/queries'
import type { Person } from '@/types'

export default function AddTestResultPage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ person_id: '', test_name: '', test_date: '', result_summary: '', drive_url: '', notes: '' })

  useEffect(() => { getPeople().then(setPeople) }, [])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload: any = { person_id: form.person_id, test_name: form.test_name }
    if (form.test_date) payload.test_date = form.test_date
    if (form.result_summary) payload.result_summary = form.result_summary
    if (form.drive_url) payload.drive_url = form.drive_url
    if (form.notes) payload.notes = form.notes
    const { error } = await supabase.from('test_results').insert(payload)
    setLoading(false)
    if (!error) router.back()
  }

  return (
    <FormShell title="Add Test Result" onSubmit={handleSubmit} loading={loading}>
      <Field label="Person" required>
        <Select value={form.person_id} onChange={set('person_id')} required>
          <option value="">Select person…</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>
      <Field label="Test name" required><Input value={form.test_name} onChange={set('test_name')} placeholder="e.g. Blood test CBC" required /></Field>
      <Field label="Test date"><Input type="date" value={form.test_date} onChange={set('test_date')} /></Field>
      <Field label="Result summary"><Textarea value={form.result_summary} onChange={set('result_summary')} placeholder="Brief summary…" /></Field>
      <Field label="Drive URL"><Input type="url" value={form.drive_url} onChange={set('drive_url')} placeholder="https://…" /></Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={set('notes')} /></Field>
    </FormShell>
  )
}
