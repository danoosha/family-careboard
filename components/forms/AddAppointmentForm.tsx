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
import { DOCTOR_SPECIALTIES } from "@/lib/doctorSpecialties";

interface PersonOption extends Person {
  workspace_id?: string;
}

interface CareJourneyOption {
  id: string;
  person_id: string;
  title: string;
  status: string;
}

interface DoctorOption extends Doctor {
  address?: string;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  initialPersonId?: string;
  initialCareJourneyId?: string;
  duplicateFrom?: {
    person_id: string;
    doctor_id?: string | null;
    care_journey_id?: string | null;
    appointment_type?: string | null;
    title?: string | null;
    location?: string | null;
    notes?: string | null;
  };
  prefilledDoctorId?: string;
  prefilledPersonId?: string;
}

function inferPreventiveCheckType(
  specialty: string | null | undefined,
  title: string
): string | null {
  if (!specialty) return null;
  const t = title.toLowerCase();
  if (specialty === "Gynecology") return "Gynecology";
  if (specialty === "Ophthalmology") return "Eye exam";
  if (specialty === "Dermatology") return "Skin check";
  if (specialty === "Gastroenterology") return "Colonoscopy";
  if (specialty === "Pediatrics") {
    if (t.includes("u9")) return "U9";
    if (t.includes("u10")) return "U10";
    if (t.includes("u11")) return "U11";
    if (t.includes("j1")) return "J1";
    if (t.includes("j2")) return "J2";
  }
  return null;
}

const APPOINTMENT_TYPES = [
  "First consultation", "Follow up", "Blood test", "Imaging",
  "Vaccination", "Procedure", "Therapy", "Emergency", "Routine check", "Other",
];

const RECURRENCE_OPTIONS = [
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
];

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

function addInterval(date: Date, frequency: string): Date {
  const d = new Date(date);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "biweekly") d.setDate(d.getDate() + 14);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  return d;
}

function buildRecurringDates(startIso: string, frequency: string, endIso: string): Date[] {
  const dates: Date[] = [];
  const end = new Date(endIso);
  let current = new Date(startIso);
  let count = 0;
  while (current <= end && count < 52) {
    dates.push(new Date(current));
    current = addInterval(current, frequency);
    count++;
  }
  return dates;
}

export default function AddAppointmentForm({
  onSuccess,
  onCancel,
  initialPersonId = "",
  initialCareJourneyId = "",
  duplicateFrom,
  prefilledDoctorId,
  prefilledPersonId,
}: Props) {
  const supabase = createClient();

  const [people, setPeople] = useState<PersonOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [careJourneys, setCareJourneys] = useState<CareJourneyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationAutoFilled, setLocationAutoFilled] = useState(false);

  // ── Inline new journey state ──────────────────────────────────────────────
  const [showNewJourney, setShowNewJourney] = useState(false);
  const [newJourneyLoading, setNewJourneyLoading] = useState(false);
  const [newJourneyError, setNewJourneyError] = useState("");
  const [newJourneyTitle, setNewJourneyTitle] = useState("");

  // ── Inline new doctor state ───────────────────────────────────────────────
  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const [newDoctorLoading, setNewDoctorLoading] = useState(false);
  const [newDoctorError, setNewDoctorError] = useState("");
  const [showNewDoctorOtherSpecialty, setShowNewDoctorOtherSpecialty] = useState(false);
  const [newDoctorForm, setNewDoctorForm] = useState({
    name: "",
    specialty: "",
    specialtyOther: "",
    phone: "",
    email: "",
    address: "",
    booking_url: "",
    online_reception_url: "",
    notes: "",
  });

  const [form, setForm] = useState({
    person_id: duplicateFrom?.person_id || prefilledPersonId || initialPersonId,
    doctor_id: duplicateFrom?.doctor_id || prefilledDoctorId || "",
    care_journey_id: duplicateFrom?.care_journey_id || initialCareJourneyId || "",
    appointment_type: duplicateFrom?.appointment_type || "",
    title: duplicateFrom?.title || "",
    starts_at: "",
    location: duplicateFrom?.location || "",
    notes: duplicateFrom?.notes || "",
    is_recurring: false,
    recurrence_frequency: "weekly",
    recurrence_end: "",
  });

  useEffect(() => {
    supabase.from("people").select("id, display_name, color_hex, workspace_id").order("display_name")
      .then(({ data }) => setPeople((data as PersonOption[]) ?? []));
    supabase.from("doctors").select("id, doctor_name, specialty, address")
      .order("specialty", { ascending: true }).order("doctor_name", { ascending: true })
      .then(({ data }) => setDoctors((data as DoctorOption[]) ?? []));
    supabase.from("care_journeys").select("id, person_id, title, status").order("created_at", { ascending: false })
      .then(({ data }) => setCareJourneys((data as CareJourneyOption[]) ?? []));
  }, [supabase]);

  const relevantJourneys = useMemo(() => {
    if (!form.person_id) return [];
    return careJourneys.filter((j) => j.person_id === form.person_id);
  }, [careJourneys, form.person_id]);

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setND = (key: string, value: string) =>
    setNewDoctorForm((prev) => ({ ...prev, [key]: value }));

  function handleDoctorChange(doctorId: string) {
    set("doctor_id", doctorId);
    if (!doctorId) {
      if (locationAutoFilled) { set("location", ""); setLocationAutoFilled(false); }
      return;
    }
    const doc = doctors.find((d) => d.id === doctorId);
    if (doc?.address) {
      if (!form.location || locationAutoFilled) {
        set("location", doc.address);
        setLocationAutoFilled(true);
      }
    } else if (locationAutoFilled) {
      set("location", "");
      setLocationAutoFilled(false);
    }
    // Hide new doctor form when a doctor is selected
    setShowNewDoctor(false);
  }

  // ── Save new doctor inline ────────────────────────────────────────────────
  async function handleSaveNewDoctor() {
    if (!newDoctorForm.name.trim()) {
      setNewDoctorError("Doctor name is required.");
      return;
    }
    setNewDoctorLoading(true);
    setNewDoctorError("");

    const finalSpecialty = newDoctorForm.specialty === "Other"
      ? newDoctorForm.specialtyOther.trim()
      : newDoctorForm.specialty.trim();

    const { data: newDoc, error: docErr } = await supabase
      .from("doctors")
      .insert({
        workspace_id: WORKSPACE_ID,
        doctor_name: newDoctorForm.name.trim(),
        specialty: finalSpecialty || null,
        phone: newDoctorForm.phone.trim() || null,
        email: newDoctorForm.email.trim() || null,
        address: newDoctorForm.address.trim() || null,
        booking_url: newDoctorForm.booking_url.trim() || null,
        online_reception_url: newDoctorForm.online_reception_url.trim() || null,
        notes: newDoctorForm.notes.trim() || null,
      })
      .select("id, doctor_name, specialty, address")
      .single();

    setNewDoctorLoading(false);

    if (docErr || !newDoc) {
      setNewDoctorError(docErr?.message ?? "Failed to add doctor.");
      return;
    }

    // Add to local doctors list + auto-select
    const saved = newDoc as DoctorOption;
    setDoctors((prev) => [...prev, saved].sort((a, b) =>
      (a.doctor_name || "").localeCompare(b.doctor_name || "")
    ));

    // Auto-select and auto-fill location
    set("doctor_id", saved.id);
    if (saved.address) {
      set("location", saved.address);
      setLocationAutoFilled(true);
    }

    // Link to selected person if one is chosen
    if (form.person_id) {
      await supabase.from("person_doctors").insert({
        workspace_id: WORKSPACE_ID,
        person_id: form.person_id,
        doctor_id: saved.id,
        role_label: "Doctor",
        is_primary: false,
      });
    }

    setShowNewDoctor(false);
    setNewDoctorForm({ name: "", specialty: "", specialtyOther: "", phone: "", email: "", address: "", booking_url: "", online_reception_url: "", notes: "" });
  }

  const recurringPreview = useMemo(() => {
    if (!form.is_recurring || !form.starts_at || !form.recurrence_end) return null;
    try {
      return buildRecurringDates(
        new Date(form.starts_at).toISOString(),
        form.recurrence_frequency,
        new Date(form.recurrence_end + "T23:59:59").toISOString()
      ).length;
    } catch { return null; }
  }, [form.is_recurring, form.starts_at, form.recurrence_end, form.recurrence_frequency]);

  const displayTitle = form.title.trim() || (form.appointment_type !== "Other" ? form.appointment_type : "");

  const isValid = form.person_id && form.starts_at &&
    (form.title.trim() || form.appointment_type) &&
    (!form.is_recurring || form.recurrence_end);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError(form.is_recurring && !form.recurrence_end
        ? "Please set an end date for the recurring series."
        : "Person and date are required. Add a title or select an appointment type.");
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

    const baseRecord = {
      workspace_id: selectedPerson.workspace_id,
      person_id: form.person_id,
      doctor_id: form.doctor_id || null,
      care_journey_id: form.care_journey_id || null,
      appointment_type: form.appointment_type || null,
      title: displayTitle || "Appointment",
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      status: "scheduled",
    };

    const selectedDoctor = doctors.find((d) => d.id === form.doctor_id);

    async function updatePreventiveCheck() {
      const checkType = inferPreventiveCheckType(selectedDoctor?.specialty, baseRecord.title);
      if (checkType && form.person_id) {
        await supabase.from("preventive_checks").update({
          status: "scheduled",
          scheduled_date: new Date(form.starts_at).toISOString().slice(0, 10),
          notes: form.notes.trim() || null,
        }).eq("person_id", form.person_id).eq("check_type", checkType);
      }
    }

    if (!form.is_recurring) {
      const { error } = await supabase.from("appointments").insert({
        ...baseRecord,
        starts_at: new Date(form.starts_at).toISOString(),
        is_recurring: false,
      });
      setLoading(false);
      if (error) { setError(error.message); return; }
      await updatePreventiveCheck();
      onSuccess();
      return;
    }

    const dates = buildRecurringDates(
      new Date(form.starts_at).toISOString(),
      form.recurrence_frequency,
      new Date(form.recurrence_end + "T23:59:59").toISOString()
    );

    if (dates.length === 0) {
      setError("No occurrences found. Check your start date and end date.");
      setLoading(false);
      return;
    }

    const groupId = crypto.randomUUID();
    const rows = dates.map((date) => ({
      ...baseRecord,
      starts_at: date.toISOString(),
      is_recurring: true,
      recurring_group_id: groupId,
    }));

    const { error } = await supabase.from("appointments").insert(rows);
    setLoading(false);
    if (error) { setError(error.message); return; }
    await updatePreventiveCheck();
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {duplicateFrom && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-2.5">
          <p className="text-xs font-semibold text-blue-700">
            Duplicating appointment — pick a new date below. All other details are pre-filled.
          </p>
        </div>
      )}

      {/* Person */}
      <Field id="person" label="Person *">
        <Select id="person" value={form.person_id}
          onChange={(e) => { set("person_id", e.target.value); set("care_journey_id", ""); }} required>
          <option value="">Select person…</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </Select>
      </Field>

      {/* Appointment type */}
      <Field id="appointment_type" label="Appointment type">
        <Select id="appointment_type" value={form.appointment_type}
          onChange={(e) => set("appointment_type", e.target.value)}>
          <option value="">Select type…</option>
          {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>

      {/* Title */}
      <Field id="title" label={form.appointment_type ? "Title (optional)" : "Title *"}>
        <Input id="title" value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={form.appointment_type
            ? `Leave blank to use "${form.appointment_type === "Other" ? "appointment type" : form.appointment_type}"`
            : "e.g. Follow-up with cardiologist"}
          required={!form.appointment_type} />
      </Field>

      {/* Date & Time */}
      <Field id="starts_at" label="Date & Time *">
        <Input id="starts_at" type="datetime-local" value={form.starts_at}
          onChange={(e) => set("starts_at", e.target.value)} required />
      </Field>

      {/* Recurring toggle */}
      <div
        className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 cursor-pointer transition-colors ${
          form.is_recurring ? "border-[#3A3370] bg-[#3A3370]/5" : "border-stone-200 bg-stone-50"
        }`}
        onClick={() => set("is_recurring", !form.is_recurring)}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🔁</span>
          <span className={`text-sm font-semibold ${form.is_recurring ? "text-[#3A3370]" : "text-heading"}`}>
            Recurring appointment
          </span>
        </div>
        <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.is_recurring ? "bg-[#3A3370]" : "bg-stone-400"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-transform duration-200 ${form.is_recurring ? "translate-x-5 bg-white" : "translate-x-0 bg-stone-100"}`} />
        </div>
      </div>

      {form.is_recurring && (
        <div className="space-y-3 pl-3 border-l-2 border-[#3A3370]/20">
          <Field id="recurrence_frequency" label="Repeat every">
            <Select id="recurrence_frequency" value={form.recurrence_frequency}
              onChange={(e) => set("recurrence_frequency", e.target.value)}>
              {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field id="recurrence_end" label="Until *">
            <Input id="recurrence_end" type="date" value={form.recurrence_end}
              onChange={(e) => set("recurrence_end", e.target.value)} required={form.is_recurring} />
          </Field>
          {recurringPreview !== null && (
            <p className="text-xs text-[#3A3370] font-medium">
              {recurringPreview} appointment{recurringPreview !== 1 ? "s" : ""} will be created
            </p>
          )}
        </div>
      )}

      {/* Doctor + inline new doctor */}
      <div>
        <label className="text-sm font-semibold text-stone-700 block mb-1">Doctor</label>

        {!showNewDoctor ? (
          <>
            {/* Prominent "Add new doctor" button */}
            <button
              type="button"
              onClick={() => { setShowNewDoctor(true); set("doctor_id", ""); }}
              className="w-full mb-2 flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-[#3A3370]/40 bg-[#3A3370]/5 text-sm font-bold text-[#3A3370] hover:bg-[#3A3370]/10 transition-colors"
            >
              <span className="text-base">🩺</span>
              + Add new doctor
            </button>

            <Select id="doctor" value={form.doctor_id}
              onChange={(e) => handleDoctorChange(e.target.value)}>
              <option value="">No doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.specialty ? `${d.specialty} — ` : ""}{d.doctor_name}
                </option>
              ))}
            </Select>
          </>
        ) : (
          /* ── Inline new doctor form ── */
          <div className="rounded-2xl border-2 border-[#3A3370]/30 bg-[#3A3370]/3 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#3A3370] uppercase tracking-wide">New doctor</p>
              <button
                type="button"
                onClick={() => { setShowNewDoctor(false); setNewDoctorError(""); }}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                ✕ Cancel
              </button>
            </div>

            <Field id="nd_name" label="Doctor name *">
              <Input id="nd_name" value={newDoctorForm.name}
                onChange={(e) => setND("name", e.target.value)}
                placeholder="Dr. Sarah Cohen" />
            </Field>

            <Field id="nd_specialty" label="Specialty">
              <Select id="nd_specialty" value={newDoctorForm.specialty}
                onChange={(e) => {
                  setND("specialty", e.target.value);
                  setShowNewDoctorOtherSpecialty(e.target.value === "Other");
                }}>
                <option value="">Select specialty</option>
                {DOCTOR_SPECIALTIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                <option value="Other">Other…</option>
              </Select>
            </Field>

            {showNewDoctorOtherSpecialty && (
              <Field id="nd_specialty_other" label="Specify specialty">
                <Input id="nd_specialty_other" value={newDoctorForm.specialtyOther}
                  onChange={(e) => setND("specialtyOther", e.target.value)}
                  placeholder="e.g. Oncology…" />
              </Field>
            )}

            <Field id="nd_phone" label="Phone">
              <Input id="nd_phone" type="tel" value={newDoctorForm.phone}
                onChange={(e) => setND("phone", e.target.value)} placeholder="+49 30 ..." />
            </Field>

            <Field id="nd_address" label="Address">
              <Input id="nd_address" value={newDoctorForm.address}
                onChange={(e) => setND("address", e.target.value)} placeholder="Clinic address" />
            </Field>

            <Field id="nd_online_reception_url" label="Online reception">
              <Input id="nd_online_reception_url" type="url" value={newDoctorForm.online_reception_url}
                onChange={(e) => setND("online_reception_url", e.target.value)} placeholder="https://321med.com/..." />
            </Field>

            <Field id="nd_booking_url" label="Booking link">
              <Input id="nd_booking_url" type="url" value={newDoctorForm.booking_url}
                onChange={(e) => setND("booking_url", e.target.value)} placeholder="https://doctolib.de/..." />
            </Field>

            <Field id="nd_email" label="E-mail">
              <Input id="nd_email" type="email" value={newDoctorForm.email}
                onChange={(e) => setND("email", e.target.value)} placeholder="doctor@example.com" />
            </Field>

            <Field id="nd_notes" label="Notes">
              <TextArea id="nd_notes" value={newDoctorForm.notes}
                onChange={(e) => setND("notes", e.target.value)}
                placeholder="Waiting times, tips…" />
            </Field>

            {newDoctorError && <p className="text-xs text-rose-600">{newDoctorError}</p>}

            <button
              type="button"
              onClick={handleSaveNewDoctor}
              disabled={newDoctorLoading}
              className="w-full py-2.5 rounded-2xl bg-[#3A3370] text-white text-sm font-bold disabled:opacity-60"
            >
              {newDoctorLoading ? "Saving doctor…" : "Save doctor & continue"}
            </button>
          </div>
        )}
      </div>

      {/* Care Journey */}
      <Field id="care_journey" label="Care Journey">
        <Select id="care_journey" value={form.care_journey_id}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setShowNewJourney(true);
              set("care_journey_id", "");
            } else {
              set("care_journey_id", e.target.value);
              setShowNewJourney(false);
            }
          }}
          disabled={!form.person_id}>
          <option value="">No care journey</option>
          {relevantJourneys.map((j) => (
            <option key={j.id} value={j.id}>{j.title}{j.status !== "active" ? ` (${j.status})` : ""}</option>
          ))}
          {form.person_id && (
            <option value="__new__">+ Create new journey…</option>
          )}
        </Select>
      </Field>

      {!form.person_id && (
        <p className="text-xs text-stone-400 -mt-2">Select a person first to choose a care journey.</p>
      )}

      {/* Inline new journey */}
      {showNewJourney && form.person_id && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 space-y-2 -mt-2">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">New care journey</p>
          <input
            type="text"
            value={newJourneyTitle}
            onChange={(e) => setNewJourneyTitle(e.target.value)}
            placeholder="Journey title, e.g. ENT follow-up"
            className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 bg-white outline-none focus:ring-2 focus:ring-emerald-300"
          />
          {newJourneyError && (
            <p className="text-xs text-red-500">{newJourneyError}</p>
          )}
          <div className="flex gap-2">
            <button type="button"
              onClick={() => { setShowNewJourney(false); setNewJourneyTitle(""); setNewJourneyError(""); }}
              className="flex-1 py-2 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-600 bg-white">
              Cancel
            </button>
            <button type="button"
              disabled={newJourneyLoading}
              onClick={async () => {
                if (!newJourneyTitle.trim()) { setNewJourneyError("Title is required."); return; }
                setNewJourneyLoading(true);
                setNewJourneyError("");
                const selectedPerson = people.find((p) => p.id === form.person_id);
                const { data, error: err } = await supabase.from("care_journeys").insert({
                  workspace_id: selectedPerson?.workspace_id,
                  person_id: form.person_id,
                  title: newJourneyTitle.trim(),
                  status: "active",
                }).select().single();
                setNewJourneyLoading(false);
                if (err) { setNewJourneyError(err.message); return; }
                const newJ = data as CareJourneyOption;
                setCareJourneys((prev) => [newJ, ...prev]);
                set("care_journey_id", newJ.id);
                setShowNewJourney(false);
                setNewJourneyTitle("");
              }}
              className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-60">
              {newJourneyLoading ? "Creating…" : "Create & select"}
            </button>
          </div>
        </div>
      )}

      {/* Location */}
      <Field id="location" label="Location">
        <Input id="location" value={form.location}
          onChange={(e) => { set("location", e.target.value); setLocationAutoFilled(false); }}
          placeholder="Clinic name or address" />
      </Field>

      {/* Notes */}
      <Field id="notes" label="Notes">
        <TextArea id="notes" value={form.notes}
          onChange={(e) => set("notes", e.target.value)} placeholder="Any extra info…" />
      </Field>

      <ErrorMsg message={error} />

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted">
          Cancel
        </button>
        <div className="flex-1">
          <SubmitButton loading={loading}
            label={form.is_recurring && recurringPreview
              ? `Create ${recurringPreview} appointments`
              : duplicateFrom ? "Save duplicate" : "Add Appointment"} />
        </div>
      </div>
    </form>
  );
}
