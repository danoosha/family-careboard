"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Field,
  Input,
  TextArea,
  Select,
  SubmitButton,
  ErrorMsg,
} from "./FormField";
import type { Person } from "@/types";
import { DOCTOR_SPECIALTIES } from "@/lib/doctorSpecialties";

interface DoctorRecord {
  id: string;
  doctor_name: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  booking_url?: string | null;
  online_reception_url?: string | null;
  notes?: string | null;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  doctor?: DoctorRecord | null;
}

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

export default function AddDoctorForm({
  onSuccess,
  onCancel,
  doctor = null,
}: Props) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: doctor?.doctor_name || "",
    specialty: doctor?.specialty || "",
    phone: doctor?.phone || "",
    email: doctor?.email || "",
    address: doctor?.address || "",
    booking_url: doctor?.booking_url || "",
    online_reception_url: doctor?.online_reception_url || "",
    notes: doctor?.notes || "",
    person_id: "",
  });

  useEffect(() => {
    const sb = createClient();

    sb.from("people")
      .select("id, display_name, color_hex")
      .order("display_name")
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load people:", error);
          return;
        }
        setPeople((data as Person[]) ?? []);
      });
  }, []);

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Doctor name is required.");
      return;
    }

    setLoading(true);
    setError("");

    const sb = createClient();

    if (doctor?.id) {
      const { error: updateError } = await sb
        .from("doctors")
        .update({
          doctor_name: form.name.trim(),
          specialty: form.specialty.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          booking_url: form.booking_url.trim() || null,
          online_reception_url: form.online_reception_url.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq("id", doctor.id);

      if (updateError) {
        setLoading(false);
        setError(updateError.message || "Failed to update doctor.");
        return;
      }

      setLoading(false);
      onSuccess();
      return;
    }

    const { data: newDoctor, error: doctorError } = await sb
      .from("doctors")
      .insert({
        workspace_id: WORKSPACE_ID,
        doctor_name: form.name.trim(),
        specialty: form.specialty.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        booking_url: form.booking_url.trim() || null,
        online_reception_url: form.online_reception_url.trim() || null,
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();

    if (doctorError || !newDoctor) {
      setLoading(false);
      setError(doctorError?.message ?? "Failed to add doctor.");
      return;
    }

    if (form.person_id) {
      const { error: linkError } = await sb.from("person_doctors").insert({
        workspace_id: WORKSPACE_ID,
        person_id: form.person_id,
        doctor_id: (newDoctor as { id: string }).id,
        role_label: "Doctor",
        is_primary: false,
      });

      if (linkError) {
        setLoading(false);
        setError(linkError.message || "Doctor added, but linking failed.");
        return;
      }
    }

    setLoading(false);
    onSuccess();
  }

  const isEditMode = Boolean(doctor?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id="name" label="Doctor name *">
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Dr. Sarah Cohen"
          required
        />
      </Field>

      <Field id="specialty" label="Specialty">
        <Select
          id="specialty"
          value={form.specialty}
          onChange={(e) => set("specialty", e.target.value)}
        >
          <option value="">Select specialty</option>
          {DOCTOR_SPECIALTIES.map((specialty) => (
            <option key={specialty.value} value={specialty.value}>
              {specialty.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="phone" label="Phone">
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+49 30 ..."
        />
      </Field>

      <Field id="email" label="E-mail">
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="doctor@example.com"
        />
      </Field>

      <Field id="address" label="Address">
        <Input
          id="address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Clinic address"
        />
      </Field>

      <Field id="online_reception_url" label="Online reception">
        <Input
          id="online_reception_url"
          type="url"
          value={form.online_reception_url}
          onChange={(e) => set("online_reception_url", e.target.value)}
          placeholder="https://321med.com/..."
        />
      </Field>

      <Field id="booking_url" label="Booking link">
        <Input
          id="booking_url"
          type="url"
          value={form.booking_url}
          onChange={(e) => set("booking_url", e.target.value)}
          placeholder="https://doctolib.de/..."
        />
      </Field>

      {!isEditMode && (
        <Field id="person" label="Link to family member">
          <Select
            id="person"
            value={form.person_id}
            onChange={(e) => set("person_id", e.target.value)}
          >
            <option value="">No link yet</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field id="notes" label="Notes">
        <TextArea
          id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Waiting times, referral tips, online booking notes..."
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
          <SubmitButton
            loading={loading}
            label={isEditMode ? "Save changes" : "Add Doctor"}
          />
        </div>
      </div>
    </form>
  );
}
