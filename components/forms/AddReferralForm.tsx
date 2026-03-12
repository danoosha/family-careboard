"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, TextArea, Select, SubmitButton, ErrorMsg } from "./FormField";
import type { Person, Doctor } from "@/types";

interface Props { onSuccess: () => void; onCancel: () => void; }

export default function AddReferralForm({ onSuccess, onCancel }: Props) {
  const [people, setPeople]   = useState<Person[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    person_id: "", from_doctor_id: "", to_specialty: "", reason: "",
    status: "pending", issued_date: "", valid_until: "", notes: "",
  });

  useEffect(() => {
    const sb = createClient();
    sb.from("people").select("id,display_name,color").order("display_name").then(({ data }) => setPeople((data as Person[]) ?? []));
    sb.from("doctors").select("id,name,specialty").order("name").then(({ data }) => setDoctors((data as Doctor[]) ?? []));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.person_id || !form.to_specialty) { setError("Person and specialty are required."); return; }
    setLoading(true); setError("");
    const { error } = await createClient().from("referrals").insert({
      person_id:      form.person_id,
      from_doctor_id: form.from_doctor_id || null,
      to_specialty:   form.to_specialty,
      reason:         form.reason         || null,
      status:         form.status,
      issued_date:    form.issued_date    || null,
      valid_until:    form.valid_until    || null,
      notes:          form.notes          || null,
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
      <Field id="to_specialty" label="Referred to (specialty) *">
        <Input id="to_specialty" value={form.to_specialty} onChange={(e) => set("to_specialty", e.target.value)} placeholder="e.g. Dermatologist" required />
      </Field>
      <Field id="from_doctor" label="Referring doctor">
        <Select id="from_doctor" value={form.from_doctor_id} onChange={(e) => set("from_doctor_id", e.target.value)}>
          <option value="">No doctor</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.specialty ? ` — ${d.specialty}` : ""}</option>)}
        </Select>
      </Field>
      <Field id="reason" label="Reason">
        <TextArea id="reason" value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Why is this referral needed?" />
      </Field>
      <Field id="status" label="Status">
        <Select id="status" value={form.status} onChange={(e) => set("status", e.target.value)}>
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
          <option value="done">Done</option>
          <option value="expired">Expired</option>
        </Select>
      </Field>
      <Field id="issued_date" label="Issued date">
        <Input id="issued_date" type="date" value={form.issued_date} onChange={(e) => set("issued_date", e.target.value)} />
      </Field>
      <Field id="valid_until" label="Valid until">
        <Input id="valid_until" type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} />
      </Field>
      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <ErrorMsg message={error} />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading} label="Add Referral" /></div>
      </div>
    </form>
  );
}
