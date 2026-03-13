"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, TextArea, SubmitButton, ErrorMsg } from "@/components/forms/FormField";
import type { CareJourneyStep } from "@/types";

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

interface Props {
  careJourneyId: string;
  personId: string;
  onSuccess: (step: CareJourneyStep) => void;
  onCancel: () => void;
  step?: CareJourneyStep | null;
}

export default function AddStepForm({ careJourneyId, personId, onSuccess, onCancel, step = null }: Props) {
  const sb = createClient();
  const isEditMode = Boolean(step?.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: step?.title || "",
    step_date: step?.step_date ? step.step_date.slice(0, 10) : "",
    notes: step?.notes || "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Step title is required."); return; }
    setLoading(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      step_date: form.step_date || null,
      notes: form.notes.trim() || null,
    };

    if (isEditMode && step?.id) {
      const { data, error: err } = await sb.from("care_journey_steps").update(payload).eq("id", step.id).select().single();
      setLoading(false);
      if (err) { setError(err.message); return; }
      onSuccess(data as CareJourneyStep);
    } else {
      const { data, error: err } = await sb.from("care_journey_steps")
        .insert({
          workspace_id: WORKSPACE_ID,
          care_journey_id: careJourneyId,
          person_id: personId,
          status: "pending",
          ...payload,
        }).select().single();
      setLoading(false);
      if (err) { setError(err.message); return; }
      onSuccess(data as CareJourneyStep);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="title" label="Step title *">
        <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Initial consultation, Blood test, MRI" required />
      </Field>

      <Field id="step_date" label="Date (optional)">
        <Input id="step_date" type="date" value={form.step_date}
          onChange={(e) => set("step_date", e.target.value)} />
      </Field>

      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)}
          placeholder="Any extra info about this step…" />
      </Field>

      <ErrorMsg message={error} />

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">
          Cancel
        </button>
        <div className="flex-1">
          <SubmitButton loading={loading} label={isEditMode ? "Save changes" : "Add step"} />
        </div>
      </div>
    </form>
  );
}
