"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, TextArea, Select, SubmitButton, ErrorMsg } from "@/components/forms/FormField";
import type { Person, CareJourney } from "@/types";

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

const JOURNEY_STATUSES = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface Props {
  onSuccess: (journey: CareJourney) => void;
  onCancel: () => void;
  journey?: CareJourney | null;
  initialPersonId?: string;
}

export default function AddCareJourneyForm({ onSuccess, onCancel, journey = null, initialPersonId }: Props) {
  const sb = createClient();
  const isEditMode = Boolean(journey?.id);

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    person_id: journey?.person_id || initialPersonId || "",
    title: journey?.title || "",
    description: journey?.description || "",
    status: journey?.status || "active",
    next_step: journey?.next_step || "",
  });

  useEffect(() => {
    sb.from("people").select("id, display_name, color_hex").order("display_name")
      .then(({ data }) => setPeople((data as Person[]) ?? []));
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.person_id) { setError("Please select a family member."); return; }
    if (!form.title.trim()) { setError("Title is required."); return; }
    setLoading(true);
    setError("");

    const payload = {
      person_id: form.person_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      next_step: form.next_step.trim() || null,
    };

    if (isEditMode && journey?.id) {
      const { data, error: err } = await sb.from("care_journeys").update(payload).eq("id", journey.id).select().single();
      setLoading(false);
      if (err) { setError(err.message); return; }
      onSuccess(data as CareJourney);
    } else {
      const { data, error: err } = await sb.from("care_journeys")
        .insert({ workspace_id: WORKSPACE_ID, ...payload }).select().single();
      setLoading(false);
      if (err) { setError(err.message); return; }
      onSuccess(data as CareJourney);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEditMode && (
        <Field id="person_id" label="Family member *">
          <Select id="person_id" value={form.person_id} onChange={(e) => set("person_id", e.target.value)}>
            <option value="">Select person</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </Select>
        </Field>
      )}

      <Field id="title" label="Journey title *">
        <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. ENT follow-up, Allergy testing" required />
      </Field>

      <Field id="description" label="Description">
        <TextArea id="description" value={form.description} onChange={(e) => set("description", e.target.value)}
          placeholder="What is this process about?" />
      </Field>

      <Field id="status" label="Status">
        <Select id="status" value={form.status} onChange={(e) => set("status", e.target.value)}>
          {JOURNEY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </Field>

      <Field id="next_step" label="Next step (optional)">
        <Input id="next_step" value={form.next_step} onChange={(e) => set("next_step", e.target.value)}
          placeholder="e.g. Schedule MRI, Call specialist" />
      </Field>

      <ErrorMsg message={error} />

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">
          Cancel
        </button>
        <div className="flex-1">
          <SubmitButton loading={loading} label={isEditMode ? "Save changes" : "Create journey"} />
        </div>
      </div>
    </form>
  );
}
