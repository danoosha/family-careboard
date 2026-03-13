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
import type { Doctor } from "@/types";

interface CareJourneyOption {
  id: string;
  person_id: string;
  title: string;
  status: string;
}

interface DoctorOption extends Doctor {
  address?: string;
}

interface AppointmentData {
  id: string;
  person_id: string;
  doctor_id?: string | null;
  care_journey_id?: string | null;
  appointment_type?: string | null;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  notes?: string | null;
  status: string;
}

interface Props {
  appointment: AppointmentData;
  onSuccess: () => void;
  onCancel: () => void;
}

const APPOINTMENT_TYPES = [
  "First consultation",
  "Follow up",
  "Blood test",
  "Imaging",
  "Vaccination",
  "Procedure",
  "Therapy",
  "Emergency",
  "Routine check",
  "Other",
];

function toLocalDatetimeValue(isoString: string) {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditAppointmentForm({
  appointment,
  onSuccess,
  onCancel,
}: Props) {
  const supabase = createClient();

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [careJourneys, setCareJourneys] = useState<CareJourneyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    doctor_id: appointment.doctor_id ?? "",
    care_journey_id: appointment.care_journey_id ?? "",
    appointment_type: appointment.appointment_type ?? "",
    title: appointment.title ?? "",
    starts_at: appointment.starts_at
      ? toLocalDatetimeValue(appointment.starts_at)
      : "",
    location: appointment.location ?? "",
    notes: appointment.notes ?? "",
  });

  useEffect(() => {
    supabase
      .from("doctors")
      .select("id, doctor_name, specialty, address")
      .order("specialty", { ascending: true })
      .order("doctor_name", { ascending: true })
      .then(({ data }) => setDoctors((data as DoctorOption[]) ?? []));

    supabase
      .from("care_journeys")
      .select("id, person_id, title, status")
      .eq("person_id", appointment.person_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCareJourneys((data as CareJourneyOption[]) ?? []));
  }, [supabase, appointment.person_id]);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handleDoctorChange(doctorId: string) {
    set("doctor_id", doctorId);
    if (!doctorId) return;
    const selectedDoctor = doctors.find((d) => d.id === doctorId);
    if (selectedDoctor?.address && !form.location) {
      set("location", selectedDoctor.address);
    }
  }

  const displayTitle =
    form.title.trim() ||
    (form.appointment_type !== "Other" ? form.appointment_type : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.starts_at || (!form.title.trim() && !form.appointment_type)) {
      setError("Date and either a title or appointment type are required.");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase
      .from("appointments")
      .update({
        doctor_id: form.doctor_id || null,
        care_journey_id: form.care_journey_id || null,
        appointment_type: form.appointment_type || null,
        title: displayTitle || "Appointment",
        starts_at: new Date(form.starts_at).toISOString(),
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", appointment.id);

    setLoading(false);
    if (error) { setError(error.message); return; }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="appointment_type" label="Appointment type">
        <Select
          id="appointment_type"
          value={form.appointment_type}
          onChange={(e) => set("appointment_type", e.target.value)}
        >
          <option value="">Select type…</option>
          {APPOINTMENT_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Select>
      </Field>

      <Field
        id="title"
        label={form.appointment_type ? "Title (optional)" : "Title *"}
      >
        <Input
          id="title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={
            form.appointment_type
              ? `Leave blank to use "${form.appointment_type === "Other" ? "appointment type" : form.appointment_type}"`
              : "e.g. Follow-up with cardiologist"
          }
          required={!form.appointment_type}
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
          onChange={(e) => handleDoctorChange(e.target.value)}
        >
          <option value="">No doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.specialty ? `${doctor.specialty} — ` : ""}
              {doctor.doctor_name}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="care_journey" label="Care Journey">
        <Select
          id="care_journey"
          value={form.care_journey_id}
          onChange={(e) => set("care_journey_id", e.target.value)}
        >
          <option value="">No care journey</option>
          {careJourneys.map((journey) => (
            <option key={journey.id} value={journey.id}>
              {journey.title}
              {journey.status ? ` (${journey.status})` : ""}
            </option>
          ))}
        </Select>
      </Field>

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
          <SubmitButton loading={loading} label="Save changes" />
        </div>
      </div>
    </form>
  );
}
