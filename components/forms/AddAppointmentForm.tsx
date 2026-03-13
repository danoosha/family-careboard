"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Field,
  Input,
  TextArea,
  Select,
  SubmitButton,
  ErrorMsg,
} from "./FormField";
import type { Person, Doctor } from "@/types";

interface PersonOption extends Person {
  workspace_id?: string;
}

interface CareJourneyOption {
  id: string;
  person_id: string;
  title: string;
  status: string;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  initialPersonId?: string;
  initialCareJourneyId?: string;
}

export default function AddAppointmentForm({
  onSuccess,
  onCancel,
  initialPersonId = "",
  initialCareJourneyId = "",
}: Props) {
  const supabase = createClient();

  const [people, setPeople] = useState<PersonOption[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [careJourneys, setCareJourneys] = useState<CareJourneyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    person_id: initialPersonId,
    doctor_id: "",
    care_journey_id: initialCareJourneyId,
    title: "",
    starts_at: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    supabase
      .from("people")
      .select("id, display_name, color_hex, workspace_id")
      .order("display_name")
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setPeople((data as PersonOption[]) ?? []);
      });

    supabase
      .from("doctors")
      .select("id, doctor_name, specialty")
      .order("doctor_name")
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setDoctors((data as Doctor[]) ?? []);
      });

    supabase
      .from("care_journeys")
      .select("id, person_id, title, status")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          return;
        }
        setCareJourneys((data as CareJourneyOption[]) ?? []);
      });
  }, [supabase]);

  useEffect(() => {
    if (!initialPersonId) return;

    setForm((prev) => ({
      ...prev,
      person_id: initialPersonId,
      care_journey_id: initialCareJourneyId || prev.care_journey_id,
    }));
  }, [initialPersonId, initialCareJourneyId]);

  const relevantJourneys = useMemo(() => {
    if (!form.person_id) return [];
    return careJourneys.filter(
      (journey) => journey.person_id === form.person_id,
    );
  }, [careJourneys, form.person_id]);

  const set = (key: string, value: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.person_id || !form.title || !form.starts_at) {
      setError("Person, title and date are required.");
      return;
    }

    setLoading(true);
    setError("");

    const selectedPerson = people.find((p) => p.id === form.person_id);

    if (!selectedPerson?.workspace_id) {
      setError("Selected person is missing workspace_id.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("appointments").insert({
      workspace_id: selectedPerson.workspace_id,
      person_id: form.person_id,
      doctor_id: form.doctor_id || null,
      care_journey_id: form.care_journey_id || null,
      title: form.title.trim(),
      starts_at: new Date(form.starts_at).toISOString(),
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="person" label="Person *">
        <Select
          id="person"
          value={form.person_id}
          onChange={(e) => {
            set("person_id", e.target.value);
            set("care_journey_id", "");
          }}
          required
        >
          <option value="">Select person…</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.display_name}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="title" label="Title *">
        <Input
          id="title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Follow-up with cardiologist"
          required
        />
      </Field>

      <Field id="starts_at" label="Date & Time *">
        <Input
          id="starts_at"
          type="datetime-local"
          value={form.starts_at}
          onChange={(e) => set("starts_at", e.target.value)}
          required
        />
      </Field>

      <Field id="doctor" label="Doctor">
        <Select
          id="doctor"
          value={form.doctor_id}
          onChange={(e) => set("doctor_id", e.target.value)}
        >
          <option value="">No doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.doctor_name}
              {doctor.specialty ? ` - ${doctor.specialty}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="care_journey" label="Care Journey">
        <Select
          id="care_journey"
          value={form.care_journey_id}
          onChange={(e) => set("care_journey_id", e.target.value)}
          disabled={!form.person_id}
        >
          <option value="">No care journey</option>
          {relevantJourneys.map((journey) => (
            <option key={journey.id} value={journey.id}>
              {journey.title}
              {journey.status ? ` (${journey.status})` : ""}
            </option>
          ))}
        </Select>
      </Field>

      {!form.person_id && (
        <p className="text-xs text-stone-400 -mt-2">
          Select a person first to choose a care journey.
        </p>
      )}

      <Field id="location" label="Location">
        <Input
          id="location"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Clinic name or address"
        />
      </Field>

      <Field id="notes" label="Notes">
        <TextArea
          id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Any extra info…"
        />
      </Field>

      <ErrorMsg message={error} />

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted"
        >
          Cancel
        </button>
        <div className="flex-1">
          <SubmitButton loading={loading} label="Add Appointment" />
        </div>
      </div>
    </form>
  );
}
