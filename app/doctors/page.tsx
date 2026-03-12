"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import AddDoctorForm from "@/components/forms/AddDoctorForm";
import { getSpecialtyMeta } from "@/lib/doctorSpecialties";

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

interface DoctorRow {
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

interface AppointmentRow {
  id: string;
  doctor_id?: string | null;
  person_id: string;
  title: string;
  starts_at: string;
  location?: string | null;
  notes?: string | null;
}

interface PersonDoctorRow {
  id: string;
  person_id: string;
  doctor_id: string;
}

interface PersonRow {
  id: string;
  display_name: string;
  color_hex?: string | null;
}

interface AppointmentFormState {
  doctor_id: string;
  person_id: string;
  title: string;
  starts_at: string;
  location: string;
  notes: string;
}

function formatVisitDate(dateString?: string | null) {
  if (!dateString) return "No recorded date";

  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "No recorded date";

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function personNameById(people: PersonRow[], personId?: string | null) {
  if (!personId) return "";
  return people.find((p) => p.id === personId)?.display_name || "";
}

function getSuggestedTitle(doctor: DoctorRow) {
  if (doctor.specialty === "Gynecology") return "Gynecology appointment";
  if (doctor.specialty === "ENT") return "ENT appointment";
  if (doctor.specialty === "Ophthalmology") return "Eye exam";
  if (doctor.specialty === "Dermatology") return "Skin check";
  if (doctor.specialty === "Pediatrics") return "Pediatric appointment";
  if (doctor.specialty === "Gastroenterology") {
    return "Gastroenterology consultation";
  }
  if (doctor.specialty === "Speech Therapy") return "Speech therapy";
  if (doctor.specialty === "General Medicine") {
    return "General medicine appointment";
  }

  return doctor.doctor_name
    ? `Appointment – ${doctor.doctor_name}`
    : "Appointment";
}

function inferPreventiveCheckType(
  doctor: DoctorRow,
  appointmentTitle: string,
): string | null {
  const title = appointmentTitle.toLowerCase();

  if (doctor.specialty === "Gynecology") return "Gynecology";
  if (doctor.specialty === "Ophthalmology") return "Eye exam";
  if (doctor.specialty === "Dermatology") return "Skin check";
  if (doctor.specialty === "Gastroenterology") return "Colonoscopy";

  if (doctor.specialty === "Pediatrics") {
    if (title.includes("u9")) return "U9";
    if (title.includes("u10")) return "U10";
    if (title.includes("u11")) return "U11";
    if (title.includes("j1")) return "J1";
    if (title.includes("j2")) return "J2";
  }

  return null;
}

function sortDoctorsPinned(doctors: DoctorRow[]) {
  const priority = (doctor: DoctorRow) => {
    if (doctor.specialty === "General Medicine") return 0;
    if (doctor.specialty === "Pediatrics") return 1;
    return 2;
  };

  return [...doctors].sort((a, b) => {
    const p = priority(a) - priority(b);
    if (p !== 0) return p;
    return (a.doctor_name || "").localeCompare(b.doctor_name || "");
  });
}

function buildGoogleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`;
}

function buildWazeUrl(address: string) {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}`;
}

export default function DoctorsPage() {
  const sb = useMemo(() => createClient(), []);

  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [personDoctors, setPersonDoctors] = useState<PersonDoctorRow[]>([]);
  const [people, setPeople] = useState<PersonRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRow | null>(null);
  const [appointmentDoctor, setAppointmentDoctor] = useState<DoctorRow | null>(
    null,
  );
  const [navigationDoctor, setNavigationDoctor] = useState<DoctorRow | null>(
    null,
  );
  const [expandedHistoryDoctorId, setExpandedHistoryDoctorId] = useState<
    string | null
  >(null);

  const [appointmentError, setAppointmentError] = useState("");
  const [savingAppointment, setSavingAppointment] = useState(false);

  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>({
    doctor_id: "",
    person_id: "",
    title: "",
    starts_at: "",
    location: "",
    notes: "",
  });

  async function loadDoctorsPage() {
    setLoading(true);

    const [doctorsRes, appointmentsRes, personDoctorsRes, peopleRes] =
      await Promise.all([
        sb.from("doctors").select("*").order("doctor_name"),
        sb.from("appointments").select("*").order("starts_at", {
          ascending: false,
        }),
        sb.from("person_doctors").select("*"),
        sb
          .from("people")
          .select("id, display_name, color_hex")
          .order("sort_order"),
      ]);

    if (doctorsRes.error) console.error(doctorsRes.error);
    if (appointmentsRes.error) console.error(appointmentsRes.error);
    if (personDoctorsRes.error) console.error(personDoctorsRes.error);
    if (peopleRes.error) console.error(peopleRes.error);

    const doctorsData = (doctorsRes.data as DoctorRow[]) ?? [];

    setDoctors(sortDoctorsPinned(doctorsData));
    setAppointments((appointmentsRes.data as AppointmentRow[]) ?? []);
    setPersonDoctors((personDoctorsRes.data as PersonDoctorRow[]) ?? []);
    setPeople((peopleRes.data as PersonRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadDoctorsPage();
  }, []);

  function openAppointmentModal(doctor: DoctorRow) {
    setAppointmentDoctor(doctor);
    setAppointmentError("");

    const linkedPersonIds = personDoctors
      .filter((pd) => pd.doctor_id === doctor.id)
      .map((pd) => pd.person_id);

    setAppointmentForm({
      doctor_id: doctor.id,
      person_id: linkedPersonIds[0] || "",
      title: getSuggestedTitle(doctor),
      starts_at: "",
      location: doctor.address || "",
      notes: "",
    });
  }

  function getLastVisitForDoctor(doctorId: string) {
    const doctorAppointments = appointments
      .filter((a) => a.doctor_id === doctorId)
      .sort(
        (a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
      );

    return doctorAppointments[0] || null;
  }

  function getNextVisitForDoctor(doctorId: string) {
    const now = Date.now();

    const doctorAppointments = appointments
      .filter((a) => a.doctor_id === doctorId)
      .filter((a) => new Date(a.starts_at).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );

    return doctorAppointments[0] || null;
  }

  function getVisitHistoryForDoctor(doctorId: string) {
    return appointments
      .filter((a) => a.doctor_id === doctorId)
      .sort(
        (a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
      );
  }

  function getLinkedPeople(doctorId: string) {
    const linkedIds = personDoctors
      .filter((pd) => pd.doctor_id === doctorId)
      .map((pd) => pd.person_id);

    return people.filter((p) => linkedIds.includes(p.id));
  }

  async function handleAddAppointment(e: React.FormEvent) {
    e.preventDefault();

    if (!appointmentDoctor) return;

    if (!appointmentForm.person_id) {
      setAppointmentError("Please choose a family member.");
      return;
    }

    if (!appointmentForm.starts_at) {
      setAppointmentError("Please choose date and time.");
      return;
    }

    setSavingAppointment(true);
    setAppointmentError("");

    const finalTitle =
      appointmentForm.title.trim() || getSuggestedTitle(appointmentDoctor);

    const { error } = await sb.from("appointments").insert({
      workspace_id: WORKSPACE_ID,
      doctor_id: appointmentDoctor.id,
      person_id: appointmentForm.person_id,
      title: finalTitle,
      starts_at: appointmentForm.starts_at,
      location: appointmentForm.location.trim() || null,
      notes: appointmentForm.notes.trim() || null,
    });

    if (error) {
      setSavingAppointment(false);
      setAppointmentError(error.message || "Failed to add appointment.");
      return;
    }

    const preventiveCheckType = inferPreventiveCheckType(
      appointmentDoctor,
      finalTitle,
    );

    if (preventiveCheckType) {
      const scheduledDate = appointmentForm.starts_at.slice(0, 10);

      const { error: preventiveError } = await sb
        .from("preventive_checks")
        .update({
          status: "scheduled",
          scheduled_date: scheduledDate,
          notes: appointmentForm.notes.trim() || null,
        })
        .eq("person_id", appointmentForm.person_id)
        .eq("check_type", preventiveCheckType);

      if (preventiveError) {
        console.error("Preventive check update failed:", preventiveError);
      }
    }

    setSavingAppointment(false);
    setAppointmentDoctor(null);
    await loadDoctorsPage();
  }

  return (
    <AppShell>
      <div className="px-4 pt-8 pb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-heading">Doctors</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage doctors, communication channels, and recorded visits
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-stone-500">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-6">
            <EmptyState icon="🩺" title="No doctors yet" compact />
          </div>
        ) : (
          <div className="space-y-3">
            {doctors.map((doctor) => {
              const specialty = getSpecialtyMeta(doctor.specialty);
              const lastVisit = getLastVisitForDoctor(doctor.id);
              const lastVisitPerson = personNameById(
                people,
                lastVisit?.person_id,
              );

              const nextVisit = getNextVisitForDoctor(doctor.id);
              const nextVisitPerson = personNameById(
                people,
                nextVisit?.person_id,
              );

              const visitHistory = getVisitHistoryForDoctor(doctor.id);
              const isHistoryOpen = expandedHistoryDoctorId === doctor.id;

              const linkedPeople = getLinkedPeople(doctor.id);

              return (
                <div
                  key={doctor.id}
                  className="bg-white rounded-3xl shadow-card p-4 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${specialty.bgClass} ${specialty.colorClass}`}
                      >
                        {specialty.icon}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-heading leading-tight">
                          {doctor.doctor_name}
                        </p>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${specialty.bgClass} ${specialty.colorClass}`}
                          >
                            {specialty.label}
                          </span>

                          {linkedPeople.map((person) => (
                            <span
                              key={person.id}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                backgroundColor: person.color_hex || "#F1F5F9",
                                color: "#1f2937",
                              }}
                            >
                              {person.display_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingDoctor(doctor)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-stone-100 text-stone-700"
                    >
                      Edit
                    </button>
                  </div>

                  {(doctor.phone ||
                    doctor.email ||
                    doctor.address ||
                    doctor.notes) && (
                    <div className="space-y-1 text-xs text-stone-600">
                      {doctor.phone && (
                        <div className="flex items-center gap-2">
                          <span>📞</span>
                          <span>{doctor.phone}</span>
                        </div>
                      )}

                      {doctor.email && (
                        <div className="flex items-center gap-2">
                          <span>✉️</span>
                          <span>{doctor.email}</span>
                        </div>
                      )}

                      {doctor.address && (
                        <div className="flex items-start gap-2">
                          <span>📍</span>
                          <span>{doctor.address}</span>
                        </div>
                      )}

                      {doctor.notes && (
                        <div className="flex items-start gap-2 text-stone-500 italic">
                          <span>📝</span>
                          <span>{doctor.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-stone-50 px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                        Last visit
                      </p>

                      {lastVisit ? (
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-stone-800">
                            {lastVisit.title}
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatVisitDate(lastVisit.starts_at)}
                            {lastVisitPerson ? ` · ${lastVisitPerson}` : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-500">
                          No recorded visits yet
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-emerald-50 px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 mb-1">
                        Next appointment
                      </p>

                      {nextVisit ? (
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-stone-800">
                            {nextVisit.title}
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatVisitDate(nextVisit.starts_at)}
                            {nextVisitPerson ? ` · ${nextVisitPerson}` : ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-500">
                          No upcoming appointment
                        </p>
                      )}
                    </div>
                  </div>

                  {isHistoryOpen && (
                    <div className="rounded-2xl bg-stone-50 px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
                        Visit history
                      </p>

                      {visitHistory.length > 0 ? (
                        <div className="space-y-2">
                          {visitHistory.map((visit) => (
                            <div
                              key={visit.id}
                              className="flex items-start justify-between gap-3 py-2 border-b border-stone-200 last:border-none"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-stone-800">
                                  {visit.title}
                                </p>
                                <p className="text-xs text-stone-500">
                                  {personNameById(people, visit.person_id)}
                                </p>
                              </div>

                              <p className="text-xs text-stone-500 whitespace-nowrap">
                                {formatVisitDate(visit.starts_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-stone-500">
                          No recorded visits yet
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {doctor.online_reception_url && (
                      <a
                        href={doctor.online_reception_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold px-3 py-2 rounded-full bg-violet-200 text-violet-900"
                      >
                        💬 Online reception
                      </a>
                    )}

                    {doctor.booking_url && (
                      <a
                        href={doctor.booking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold px-3 py-2 rounded-full bg-violet-100 text-violet-800"
                      >
                        Book appointment
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => openAppointmentModal(doctor)}
                      className="text-xs font-bold px-3 py-2 rounded-full bg-emerald-100 text-emerald-800"
                    >
                      Add appointment
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistoryDoctorId((current) =>
                          current === doctor.id ? null : doctor.id,
                        )
                      }
                      className="text-xs font-bold px-3 py-2 rounded-full bg-stone-100 text-stone-700"
                    >
                      {isHistoryOpen ? "Hide history" : "Show history"}
                    </button>

                    {doctor.phone && (
                      <a
                        href={`tel:${doctor.phone}`}
                        className="text-xs font-bold px-3 py-2 rounded-full bg-stone-100 text-stone-700"
                      >
                        📞 Call
                      </a>
                    )}

                    {doctor.email && (
                      <a
                        href={`mailto:${doctor.email}`}
                        className="text-xs font-bold px-3 py-2 rounded-full bg-sky-100 text-sky-800"
                      >
                        ✉️ Send E-Mail
                      </a>
                    )}

                    {doctor.address && (
                      <button
                        type="button"
                        onClick={() => setNavigationDoctor(doctor)}
                        className="text-xs font-bold px-3 py-2 rounded-full bg-amber-100 text-amber-800"
                      >
                        🧭 Navigate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editingDoctor && (
          <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-heading">Edit doctor</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Update details and communication links
                </p>
              </div>

              <AddDoctorForm
                doctor={editingDoctor}
                onCancel={() => setEditingDoctor(null)}
                onSuccess={async () => {
                  setEditingDoctor(null);
                  await loadDoctorsPage();
                }}
              />
            </div>
          </div>
        )}

        {appointmentDoctor && (
          <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-heading">
                  Add appointment
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {appointmentDoctor.doctor_name}
                </p>
              </div>

              <form onSubmit={handleAddAppointment} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    Family member
                  </label>
                  <select
                    className="mt-1 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm outline-none"
                    value={appointmentForm.person_id}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        person_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select person</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    Title
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm outline-none"
                    value={appointmentForm.title}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    Date and time
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm outline-none"
                    value={appointmentForm.starts_at}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        starts_at: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    Location
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm outline-none"
                    value={appointmentForm.location}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    Notes
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-2xl border border-stone-200 px-3 py-3 text-sm outline-none min-h-[96px]"
                    value={appointmentForm.notes}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>

                {appointmentError && (
                  <p className="text-sm text-rose-600">{appointmentError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAppointmentDoctor(null)}
                    className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-bold text-stone-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingAppointment}
                    className="flex-1 py-3 rounded-2xl bg-emerald-100 text-emerald-800 text-sm font-bold disabled:opacity-60"
                  >
                    {savingAppointment ? "Saving..." : "Save appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {navigationDoctor && (
          <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-heading">Navigate</h2>
                <p className="text-sm text-stone-500 mt-1">
                  {navigationDoctor.doctor_name}
                </p>
                {navigationDoctor.address && (
                  <p className="text-xs text-stone-500 mt-1">
                    {navigationDoctor.address}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {navigationDoctor.address && (
                  <>
                    <a
                      href={buildGoogleMapsUrl(navigationDoctor.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center py-3 rounded-2xl bg-blue-100 text-blue-800 text-sm font-bold"
                    >
                      Open in Google Maps
                    </a>

                    <a
                      href={buildWazeUrl(navigationDoctor.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center py-3 rounded-2xl bg-sky-100 text-sky-800 text-sm font-bold"
                    >
                      Open in Waze
                    </a>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setNavigationDoctor(null)}
                  className="block w-full text-center py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
