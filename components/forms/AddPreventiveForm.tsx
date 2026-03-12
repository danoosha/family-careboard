"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, TextArea, Select, SubmitButton, ErrorMsg } from "./FormField";
import type { Person } from "@/types";

interface Props { onSuccess: () => void; onCancel: () => void; }

export default function AddPreventiveForm({ onSuccess, onCancel }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    person_id: "", title: "", status: "ok", last_done: "", next_due: "", notes: "",
  });

  useEffect(() => {
    createClient().from("people").select("id,display_name,color").order("display_name")
      .then(({ data }) => setPeople((data as Person[]) ?? []));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.person_id || !form.title) { setError("Person and title are required."); return; }
    setLoading(true); setError("");
    const { error } = await createClient().from("preventive_checks").insert({
      person_id: form.person_id,
      title:     form.title,
      status:    form.status,
      last_done: form.last_done || null,
      next_due:  form.next_due  || null,
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
      <Field id="title" label="Check name *">
        <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Annual blood test" required />
      </Field>
      <Field id="status" label="Status">
        <Select id="status" value={form.status} onChange={(e) => set("status", e.target.value)}>
          <option value="ok">OK</option>
          <option value="due_soon">Due soon</option>
          <option value="overdue">Overdue</option>
          <option value="missing">Missing</option>
        </Select>
      </Field>
      <Field id="last_done" label="Last done">
        <Input id="last_done" type="date" value={form.last_done} onChange={(e) => set("last_done", e.target.value)} />
      </Field>
      <Field id="next_due" label="Next due">
        <Input id="next_due" type="date" value={form.next_due} onChange={(e) => set("next_due", e.target.value)} />
      </Field>
      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any extra info…" />
      </Field>
      <ErrorMsg message={error} />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading} label="Add Check" /></div>
      </div>
    </form>
  );
}
