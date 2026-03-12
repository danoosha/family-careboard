"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, TextArea, Select, SubmitButton, ErrorMsg } from "./FormField";
import type { Person } from "@/types";

interface Props { onSuccess: () => void; onCancel: () => void; }

const CATEGORIES = ["prescription", "referral", "test_result", "report", "other"];

export default function AddDocumentForm({ onSuccess, onCancel }: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm] = useState({
    person_id: "", title: "", category: "other", document_date: "", drive_url: "", notes: "",
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
    const { error } = await createClient().from("documents").insert({
      person_id:     form.person_id,
      title:         form.title,
      category:      form.category      || null,
      document_date: form.document_date || null,
      drive_url:     form.drive_url     || null,
      notes:         form.notes         || null,
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
      <Field id="title" label="Document title *">
        <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Blood test results Jan 2025" required />
      </Field>
      <Field id="category" label="Category">
        <Select id="category" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
          ))}
        </Select>
      </Field>
      <Field id="document_date" label="Document date">
        <Input id="document_date" type="date" value={form.document_date} onChange={(e) => set("document_date", e.target.value)} />
      </Field>
      <Field id="drive_url" label="Google Drive link">
        <Input id="drive_url" type="url" value={form.drive_url} onChange={(e) => set("drive_url", e.target.value)} placeholder="https://drive.google.com/…" />
      </Field>
      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>
      <ErrorMsg message={error} />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">Cancel</button>
        <div className="flex-1"><SubmitButton loading={loading} label="Add Document" /></div>
      </div>
    </form>
  );
}
