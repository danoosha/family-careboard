"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  journeyId: string;
  onCreated?: () => void;
}

export default function AddStepForm({ journeyId, onCreated }: Props) {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title) return;

    setSaving(true);

    const { error } = await supabase.from("care_journey_steps").insert({
      care_journey_id: journeyId,
      title,
      step_date: date || null,
      notes: notes || null,
    });

    setSaving(false);

    if (!error) {
      setTitle("");
      setDate("");
      setNotes("");
      onCreated?.();
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
      <div className="text-sm font-semibold text-heading">Add step</div>

      <input
        className="w-full border rounded-lg p-2 text-sm"
        placeholder="Step title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="date"
        className="w-full border rounded-lg p-2 text-sm"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <textarea
        className="w-full border rounded-lg p-2 text-sm"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button
        onClick={handleCreate}
        disabled={saving}
        className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm"
      >
        {saving ? "Saving..." : "Create step"}
      </button>
    </div>
  );
}
