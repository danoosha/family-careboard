'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FormShell from '@/components/forms/FormShell'
import { Field, Input, Textarea } from '@/components/forms/FormField'
import { createClient } from '@/lib/supabase/client'

export default function AddDoctorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', specialty: '', clinic_name: '', phone: '', email: '', address: '', notes: '' })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const payload: any = { full_name: form.full_name }
    if (form.specialty) payload.specialty = form.specialty
    if (form.clinic_name) payload.clinic_name = form.clinic_name
    if (form.phone) payload.phone = form.phone
    if (form.email) payload.email = form.email
    if (form.address) payload.address = form.address
    if (form.notes) payload.notes = form.notes
    const { error } = await supabase.from('doctors').insert(payload)
    setLoading(false)
    if (!error) router.push('/doctors')
  }

  return (
    <FormShell title="Add Doctor" onSubmit={handleSubmit} loading={loading}>
      <Field label="Full name" required>
        <Input value={form.full_name} onChange={set('full_name')} placeholder="Dr. Sarah Cohen" required />
      </Field>
      <Field label="Specialty">
        <Input value={form.specialty} onChange={set('specialty')} placeholder="e.g. Paediatrician" />
      </Field>
      <Field label="Clinic / Hospital">
        <Input value={form.clinic_name} onChange={set('clinic_name')} placeholder="Clinic name" />
      </Field>
      <Field label="Phone">
        <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="+49 30 …" />
      </Field>
      <Field label="Email">
        <Input type="email" value={form.email} onChange={set('email')} placeholder="doctor@clinic.de" />
      </Field>
      <Field label="Address">
        <Input value={form.address} onChange={set('address')} placeholder="Street, city" />
      </Field>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={set('notes')} placeholder="Optional notes…" />
      </Field>
    </FormShell>
  )
}
