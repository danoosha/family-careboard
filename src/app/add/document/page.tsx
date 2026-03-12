'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormShell from '@/components/forms/FormShell'
import { Field, Input, Select, Textarea } from '@/components/forms/FormField'
import { createClient } from '@/lib/supabase/client'
import { getPeople } from '@/lib/queries'
import type { Person } from '@/types'

const CATEGORIES = ['General', 'Lab', 'Imaging', 'Insurance', 'Prescription', 'Referral', 'Certificate', 'Other']

export default function AddDocumentPage() {
  const router = useRouter()
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ person_id: '', title: '', category: '', document_date: '', drive_url: '', notes: '' })

  useEffect(() => { getPeople().then(setPeople) }, [])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload: any = { person_id: form.person_id, title: form.title }
    if (form.category) payload.category = form.category
    if (form.document_date) payload.document_date = form.document_date
    if (form.drive_url) payload.drive_url = form.drive_url
    if (form.notes) payload.notes = form.notes
    const { error } = await supabase.from('documents').insert(payload)
    setLoading(false)
    if (!error) router.push('/documents')
  }

  return (
    <FormShell title="Add Document" onSubmit={handleSubmit} loading={loading}>
      <Field label="Person" required>
        <Select value={form.person_id} onChange={set('person_id')} required>
          <option value="">Select person…</option>
          {people.map(p => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>
      <Field label="Title" required><Input value={form.title} onChange={set('title')} placeholder="Document title" required /></Field>
      <Field label="Category">
        <Select value={form.category} onChange={set('category')}>
          <option value="">Select category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label="Document date"><Input type="date" value={form.document_date} onChange={set('document_date')} /></Field>
      <Field label="Google Drive URL"><Input type="url" value={form.drive_url} onChange={set('drive_url')} placeholder="https://drive.google.com/…" /></Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={set('notes')} /></Field>
    </FormShell>
  )
}
