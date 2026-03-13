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

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

const APPOINTMENT_TYPES = [
  "First consultation", "Follow up", "Blood test", "Imaging",
  "Vaccination", "Procedure", "Therapy", "Emergency", "Routine check", "Other",
];

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
  initialPersonId?: string;
}

export default function AddDoctorForm({
  onSuccess,
  onCancel,
  doctor = null,
  initialPersonId,
}: Props) {
  const sb = createClient();
  const isEditMode = Boolean(doctor?.id);

  // ── State ────────────────────────────────────────────────────────────────
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(
    initialPersonId ? [initialPersonId] : []
  );
  const [duplicateSuggestions, setDuplicateSuggestions] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showOtherSpecialtyInit =
    !!doctor?.specialty && !DOCTOR_SPECIALTIES.find((s) => s.value === doctor.specialty);
  const [showOtherSpecialty, setShowOtherSpecialty] = useState(showOtherSpecialtyInit);

  // Inline appointment
  const [showAppointment, setShowAppointment] = useState(false);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptError, setApptError] = useState("");
  const [apptForm, setApptForm] = useState({
    person_id: initialPersonId || "",
    appointment_type: "",
    title: "",
    starts_at: "",
    location: "",
    notes: "",
  });

  const [form, setForm] = useState({
    name: doctor?.doctor_name || "",
    specialty: showOtherSpecialtyInit ? "Other" : (doctor?.specialty || ""),
    specialtyOther: showOtherSpecialtyInit ? (doctor?.specialty || "") : "",
    phone: doctor?.phone || "",
    email: doctor?.email || "",
    address: doctor?.address || "",
    booking_url: doctor?.booking_url || "",
    online_reception_url: doctor?.online_reception_url || "",
    notes: doctor?.notes || "",
  });

  // ── Load people + existing links ─────────────────────────────────────────
  useEffect(() => {
    sb.from("people")
      .select("id, display_name, color_hex")
      .order("display_name")
      .then(({ data }) => setPeople((data as Person[]) ?? []));

    if (isEditMode && doctor?.id) {
      sb.from("person_doctors")
        .select("person_id")
        .eq("doctor_id", doctor.id)
        .then(({ data }) => {
          if (data?.length) setSelectedPersonIds(data.map((r: any) => r.person_id));
        });
    }
  }, []);

  // ── Duplicate detection ──────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode || !form.name.trim() || form.name.trim().length < 3) {
      setDuplicateSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await sb
        .from("doctors")
        .select("id, doctor_name, specialty")
        .ilike("doctor_name", `%${form.name.trim()}%`)
        .limit(3);
      setDuplicateSuggestions((data as DoctorRecord[]) ?? []);
    }, 400);
    return () => clearTimeout(timer);
  }, [form.name]);

  // ── Auto-fill appointment location ───────────────────────────────────────
  useEffect(() => {
    if (form.address && showAppointment && !apptForm.location) {
      setApptForm((p) => ({ ...p, location: form.address }));
    }
  }, [form.address, showAppointment]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setAF = (k: string, v: string) => setApptForm((p) => ({ ...p, [k]: v }));

  function togglePerson(personId: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
    if (!apptForm.person_id) setAF("person_id", personId);
  }

  const finalSpecialty =
    form.specialty === "Other" ? form.specialtyOther.trim() : form.specialty.trim();

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Doctor name is required."); return; }
    setLoading(true);
    setError("");

    const doctorData = {
      doctor_name: form.name.trim(),
      specialty: finalSpecialty || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      booking_url: form.booking_url.trim() || null,
      online_reception_url: form.online_reception_url.trim() || null,
      notes: form.notes.trim() || null,
    };

    // ── Edit mode ────────────────────────────────────────────────────────
    if (isEditMode && doctor?.id) {
      const { error: updateError } = await sb
        .from("doctors")
        .update(doctorData)
        .eq("id", doctor.id);
      if (updateError) { setLoading(false); setError(updateError.message); return; }

      // Sync person links
      await sb.from("person_doctors").delete().eq("doctor_id", doctor.id);
      if (selectedPersonIds.length > 0) {
        await sb.from("person_doctors").insert(
          selectedPersonIds.map((pid) => ({
            workspace_id: WORKSPACE_ID,
            person_id: pid,
            doctor_id: doctor.id,
            role_label: "Doctor",
            is_primary: false,
          }))
        );
      }
      setLoading(false);
      onSuccess();
      return;
    }

    // ── Insert new doctor ────────────────────────────────────────────────
    const { data: newDoctor, error: doctorError } = await sb
      .from("doctors")
      .insert({ workspace_id: WORKSPACE_ID, ...doctorData })
      .select("id")
      .single();

    if (doctorError || !newDoctor) {
      setLoading(false);
      setError(doctorError?.message ?? "Failed to add doctor.");
      return;
    }

    const doctorId = (newDoctor as { id: string }).id;

    if (selectedPersonIds.length > 0) {
      const { error: linkError } = await sb.from("person_doctors").insert(
        selectedPersonIds.map((pid) => ({
          workspace_id: WORKSPACE_ID,
          person_id: pid,
          doctor_id: doctorId,
          role_label: "Doctor",
          is_primary: false,
        }))
      );
      if (linkError) { setLoading(false); setError("Doctor added, but linking to family members failed."); return; }
    }

    // ── Inline appointment ───────────────────────────────────────────────
    if (showAppointment && apptForm.person_id && apptForm.starts_at) {
      setApptLoading(true);
      const apptTitle =
        apptForm.title.trim() ||
        (apptForm.appointment_type && apptForm.appointment_type !== "Other"
          ? apptForm.appointment_type
          : "Appointment");
      await sb.from("appointments").insert({
        workspace_id: WORKSPACE_ID,
        person_id: apptForm.person_id,
        doctor_id: doctorId,
        appointment_type: apptForm.appointment_type || null,
        title: apptTitle,
        starts_at: new Date(apptForm.starts_at).toISOString(),
        location: apptForm.location.trim() || null,
        notes: apptForm.notes.trim() || null,
        status: "scheduled",
      });
      setApptLoading(false);
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Doctor name */}
      <Field id="name" label="Doctor name *">
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Dr. Sarah Cohen"
          required
        />
        {duplicateSuggestions.length > 0 && (
          <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Similar doctors already exist:
            </p>
            {duplicateSuggestions.map((d) => (
              <p key={d.id} className="text-xs text-amber-600">
                {d.doctor_name}{d.specialty ? ` · ${d.specialty}` : ""}
              </p>
            ))}
          </div>
        )}
      </Field>

      {/* Specialty */}
      <Field id="specialty" label="Specialty">
        <Select
          id="specialty"
          value={form.specialty}
          onChange={(e) => {
            set("specialty", e.target.value);
            setShowOtherSpecialty(e.target.value === "Other");
          }}
        >
          <option value="">Select specialty</option>
          {DOCTOR_SPECIALTIES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
          <option value="Other">Other…</option>
        </Select>
        {showOtherSpecialty && (
          <Input
            id="specialtyOther"
            value={form.specialtyOther}
            onChange={(e) => set("specialtyOther", e.target.value)}
            placeholder="e.g. Oncology, Rheumatology…"
            className="mt-2"
          />
        )}
      </Field>

      {/* Contact */}
      <Field id="phone" label="Phone">
        <Input id="phone" type="tel" value={form.phone}
          onChange={(e) => set("phone", e.target.value)} placeholder="+49 30 ..." />
      </Field>

      <Field id="email" label="E-mail">
        <Input id="email" type="email" value={form.email}
          onChange={(e) => set("email", e.target.value)} placeholder="doctor@example.com" />
      </Field>

      <Field id="address" label="Address">
        <Input id="address" value={form.address}
          onChange={(e) => set("address", e.target.value)} placeholder="Clinic address" />
      </Field>

      <Field id="online_reception_url" label="Online reception">
        <Input id="online_reception_url" type="url" value={form.online_reception_url}
          onChange={(e) => set("online_reception_url", e.target.value)} placeholder="https://321med.com/..." />
      </Field>

      <Field id="booking_url" label="Booking link">
        <Input id="booking_url" type="url" value={form.booking_url}
          onChange={(e) => set("booking_url", e.target.value)} placeholder="https://doctolib.de/..." />
      </Field>

      {/* Multi-person pills */}
      <Field id="people" label="Link to family members">
        <div className="flex flex-wrap gap-2 pt-1">
          {people.map((p) => {
            const selected = selectedPersonIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePerson(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                  selected ? "border-[#3A3370] text-[#3A3370]" : "border-stone-200 text-stone-500 bg-white"
                }`}
                style={
                  selected && p.color_hex
                    ? { borderColor: p.color_hex, color: "#1f2937", backgroundColor: p.color_hex + "22" }
                    : {}
                }
              >
                {selected ? "✓ " : ""}{p.display_name}
              </button>
            );
          })}
        </div>
        {selectedPersonIds.length === 0 && (
          <p className="text-xs text-stone-400 mt-1">Tap to select one or more family members</p>
        )}
      </Field>

      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Waiting times, referral tips, online booking notes..." />
      </Field>

      {/* Inline appointment — only in add mode */}
      {!isEditMode && (
        <div>
          <button
            type="button"
            onClick={() => setShowAppointment((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-colors ${
              showAppointment
                ? "border-emerald-400 bg-emerald-50"
                : "border-stone-200 bg-stone-50"
            }`}
          >
            <span className="text-sm font-semibold text-stone-700">
              📅 Schedule first appointment
            </span>
            <span className={`text-xs font-bold ${showAppointment ? "text-emerald-600" : "text-stone-400"}`}>
              {showAppointment ? "▲ Hide" : "▼ Add"}
            </span>
          </button>

          {showAppointment && (
            <div className="mt-3 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <Field id="appt_person" label="Family member *">
                <Select id="appt_person" value={apptForm.person_id}
                  onChange={(e) => setAF("person_id", e.target.value)}>
                  <option value="">Select person</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.display_name}</option>
                  ))}
                </Select>
              </Field>

              <Field id="appt_type" label="Appointment type">
                <Select id="appt_type" value={apptForm.appointment_type}
                  onChange={(e) => setAF("appointment_type", e.target.value)}>
                  <option value="">Select type…</option>
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>

              <Field id="appt_title" label="Title (optional)">
                <Input id="appt_title" value={apptForm.title}
                  onChange={(e) => setAF("title", e.target.value)}
                  placeholder={apptForm.appointment_type || "e.g. First consultation"} />
              </Field>

              <Field id="appt_starts_at" label="Date & Time *">
                <Input id="appt_starts_at" type="datetime-local" value={apptForm.starts_at}
                  onChange={(e) => setAF("starts_at", e.target.value)} />
              </Field>

              <Field id="appt_location" label="Location">
                <Input id="appt_location" value={apptForm.location}
                  onChange={(e) => setAF("location", e.target.value)}
                  placeholder="Clinic name or address" />
              </Field>

              <Field id="appt_notes" label="Notes">
                <TextArea id="appt_notes" value={apptForm.notes}
                  onChange={(e) => setAF("notes", e.target.value)}
                  placeholder="Any extra info…" />
              </Field>

              {apptError && <p className="text-xs text-rose-600">{apptError}</p>}
            </div>
          )}
        </div>
      )}

      <ErrorMsg message={error} />

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">
          Cancel
        </button>
        <div className="flex-1">
          <SubmitButton
            loading={loading || apptLoading}
            label={
              isEditMode ? "Save changes"
              : showAppointment && apptForm.starts_at ? "Add doctor & appointment"
              : "Add Doctor"
            }
          />
        </div>
      </div>
    </form>
  );
}
