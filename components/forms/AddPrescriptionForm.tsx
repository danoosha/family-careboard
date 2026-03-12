"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, TextArea, Select, SubmitButton, ErrorMsg } from "./FormField";
import type { Person, Doctor } from "@/types";

interface Props { onSuccess: () => void; onCancel: () => void; }

export default function AddPrescriptionForm({ onSuccess, onCancel }: Props) {
  const [people, setPeople]   = useState<Person[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    person_id: "", doctor_id: "", medication_name: "", issued_date: "", valid_until: "", notes: "",
  });

  useEffect(() => {
    const sb = createClient();
    sb.from("people").select("id,display_name,color").order("display_name").then(({ data }) => setPeople((data as Person[]) ?? []));
    sb.from("doctors").select("id,name,specialty").order("name").then(({ data }) => setDoctors((data as Doctor[]) ?? []));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.person_id || !form.medication_name) { setError("Person and medication name are required."); return; }
    setLoading(true); setError("");
    const { error } = await createClient().from("prescriptions").insert({
      person_id:       form.person_id,
      doctor_id:       form.doctor_id    || null,
      medication_name: form.medication_name,
      issued_date:     form.issued_date  || null,
      valid_until:     form.valid_until  || null,
      notes:           form.notes        || null,
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
      <Field id="medication_name" label="Medication *">
        <Input id="medication_name" value={form.medication_name} onChange={(e) => set("medication_name", e.target.value)} placeholder="e.g. Amoxicillin 500mg" required />
      </Field>
      <Field id="doctor" label="Prescribing doctor">
        <Select id="doctor" value={form.doctor_id} onChange={(e) => set("doctor_id", e.target.value)}>
          <option value="">No doctor</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
        </Select>
      </Field>
      <Field id="issued_date" label="Issued date">
        <Input id="issued_date" type="date" value={form.issued_date} onChange={(e) => set("issued_date", e.target.value)} />
      </Field>
      <Field id="valid_until" label="Valid until">
        <Input id="valid_until" type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
      </Field>
      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Dosage instructions…" />
      </Field>
      <ErrorMsg message={error} />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading} label="Add Prescription" /></div>
      </div>
    </form>
  );
}
