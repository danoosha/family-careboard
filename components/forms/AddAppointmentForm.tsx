"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, TextArea, Select, SubmitButton, ErrorMsg } from "./FormField";
import type { Person, Doctor } from "@/types";

interface Props { onSuccess: () => void; onCancel: () => void; }

export default function AddAppointmentForm({ onSuccess, onCancel }: Props) {
  const [people, setPeople]   = useState<Person[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    person_id: "", doctor_id: "", title: "", starts_at: "", location: "", notes: "",
  });

  useEffect(() => {
    const sb = createClient();
    sb.from("people").select("id,display_name,color").order("display_name")
      .then(({ data }) => setPeople((data as Person[]) ?? []));
    sb.from("doctors").select("id,name,specialty").order("name")
      .then(({ data }) => setDoctors((data as Doctor[]) ?? []));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.person_id || !form.title || !form.starts_at) {
      setError("Person, title and date are required.");
      return;
    }
    setLoading(true); setError("");
    const sb = createClient();
    const { error } = await sb.from("appointments").insert({
      person_id: form.person_id,
      doctor_id: form.doctor_id || null,
      title: form.title,
      starts_at: new Date(form.starts_at).toISOString(),
      location:  form.location  || null,
      notes:     form.notes     || null,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="person" label="Person *">
        <Select id="person" value={form.person_id} onChange={(e) => set("person_id", e.target.value)} required>
          <option value="">Select person…</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>
      <Field id="title" label="Title *">
        <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Follow-up with cardiologist" required />
      </Field>
      <Field id="starts_at" label="Date & Time *">
        <Input id="starts_at" type="datetime-local" value={form.starts_at} onChange={(e) => set("starts_at", e.target.value)} required />
      </Field>
      <Field id="doctor" label="Doctor">
        <Select id="doctor" value={form.doctor_id} onChange={(e) => set("doctor_id", e.target.value)}>
          <option value="">No doctor</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
        </Select>
      </Field>
      <Field id="location" label="Location">
        <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Clinic name or address" />
      </Field>
      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any extra info…" />
      </Field>
      <ErrorMsg message={error} />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading} label="Add Appointment" /></div>
      </div>
    </form>
  );
}
