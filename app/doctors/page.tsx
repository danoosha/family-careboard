"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import AddDoctorForm from "@/components/forms/AddDoctorForm";
import AddAppointmentForm from "@/components/forms/AddAppointmentForm";
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

function sortDoctorsPinned(doctors: DoctorRow[]) {
  const priority = (d: DoctorRow) => {
    if (d.specialty === "General Medicine") return 0;
    if (d.specialty === "Pediatrics") return 1;
    return 2;
  };
  return [...doctors].sort((a, b) => {
    const p = priority(a) - priority(b);
    if (p !== 0) return p;
    return (a.doctor_name || "").localeCompare(b.doctor_name || "");
  });
}

function buildGoogleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
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
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [appointmentDoctor, setAppointmentDoctor] = useState<DoctorRow | null>(null);
  const [navigationDoctor, setNavigationDoctor] = useState<DoctorRow | null>(null);
  const [expandedHistoryDoctorId, setExpandedHistoryDoctorId] = useState<string | null>(null);
  const [expandedContactDoctorId, setExpandedContactDoctorId] = useState<string | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<DoctorRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function loadDoctorsPage() {
    setLoading(true);
    const [doctorsRes, appointmentsRes, personDoctorsRes, peopleRes] =
      await Promise.all([
        sb.from("doctors").select("*").order("doctor_name"),
        sb.from("appointments").select("*").order("starts_at", { ascending: false }),
        sb.from("person_doctors").select("*"),
        sb.from("people").select("id, display_name, color_hex").order("sort_order"),
      ]);

    setDoctors(sortDoctorsPinned((doctorsRes.data as DoctorRow[]) ?? []));
    setAppointments((appointmentsRes.data as AppointmentRow[]) ?? []);
    setPersonDoctors((personDoctorsRes.data as PersonDoctorRow[]) ?? []);
    setPeople((peopleRes.data as PersonRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadDoctorsPage(); }, []);

  function getLastVisitForDoctor(doctorId: string) {
    return appointments
      .filter((a) => a.doctor_id === doctorId)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0] || null;
  }

  function getNextVisitForDoctor(doctorId: string) {
    const now = Date.now();
    return appointments
      .filter((a) => a.doctor_id === doctorId && new Date(a.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] || null;
  }

  function getVisitHistoryForDoctor(doctorId: string) {
    return appointments
      .filter((a) => a.doctor_id === doctorId)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }

  async function handleDeleteDoctor(doctor: DoctorRow) {
    setDeleteLoading(true);
    await sb.from("person_doctors").delete().eq("doctor_id", doctor.id);
    await sb.from("doctors").delete().eq("id", doctor.id);
    setDeleteLoading(false);
    setDeletingDoctor(null);
    await loadDoctorsPage();
  }

  function getLinkedPeople(doctorId: string) {
    const linkedIds = personDoctors.filter((pd) => pd.doctor_id === doctorId).map((pd) => pd.person_id);
    return people.filter((p) => linkedIds.includes(p.id));
  }

  // Pre-select person_id for AddAppointmentForm based on linked people
  function getPrefilledPersonId(doctor: DoctorRow): string | undefined {
    const linked = personDoctors.filter((pd) => pd.doctor_id === doctor.id);
    return linked[0]?.person_id;
  }

  return (
    <AppShell>
      <div className="px-4 pt-8 pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-heading">Doctors</h1>
            <p className="text-sm text-stone-500 mt-1">
              Manage doctors, communication channels, and recorded visits
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddingDoctor(true)}
            className="flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full bg-[#3A3370] text-white"
          >
            + Add
          </button>
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
              const lastVisitPerson = personNameById(people, lastVisit?.person_id);
              const nextVisit = getNextVisitForDoctor(doctor.id);
              const nextVisitPerson = personNameById(people, nextVisit?.person_id);
              const visitHistory = getVisitHistoryForDoctor(doctor.id);
              const isHistoryOpen = expandedHistoryDoctorId === doctor.id;
              const linkedPeople = getLinkedPeople(doctor.id);

              const isContactOpen = expandedContactDoctorId === doctor.id;

              return (
                <div key={doctor.id} className="bg-white rounded-3xl shadow-card overflow-hidden">

                  {/* ── Header ── */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 ${specialty.bgClass} ${specialty.colorClass}`}>
                      {specialty.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-heading leading-tight truncate">{doctor.doctor_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${specialty.bgClass} ${specialty.colorClass}`}>
                          {specialty.label}
                        </span>
                        {linkedPeople.map((person) => (
                          <span key={person.id}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: person.color_hex || "#F1F5F9", color: "#1f2937" }}>
                            {person.display_name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => setEditingDoctor(doctor)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors">
                        Edit
                      </button>
                      <button type="button" onClick={() => setDeletingDoctor(doctor)}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* ── Last / Next strip ── */}
                  <div className="grid grid-cols-2 border-t border-stone-100">
                    <div className="px-4 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">Last visit</p>
                      {lastVisit ? (
                        <>
                          <p className="text-xs font-semibold text-stone-700 truncate">{lastVisit.title}</p>
                          <p className="text-[11px] text-stone-400">{formatVisitDate(lastVisit.starts_at)}{lastVisitPerson ? ` · ${lastVisitPerson}` : ""}</p>
                        </>
                      ) : <p className="text-xs text-stone-400">None yet</p>}
                    </div>
                    <div className="px-4 py-2.5 bg-emerald-50/50 border-l border-stone-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-0.5">Next</p>
                      {nextVisit ? (
                        <>
                          <p className="text-xs font-semibold text-stone-700 truncate">{nextVisit.title}</p>
                          <p className="text-[11px] text-stone-400">{formatVisitDate(nextVisit.starts_at)}{nextVisitPerson ? ` · ${nextVisitPerson}` : ""}</p>
                        </>
                      ) : <p className="text-xs text-stone-400">Not scheduled</p>}
                    </div>
                  </div>

                  {/* ── Expandable contact details ── */}
                  {(doctor.phone || doctor.email || doctor.address || doctor.notes) && (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedContactDoctorId((c) => c === doctor.id ? null : doctor.id)}
                        className="w-full flex items-center justify-between px-4 py-2 border-t border-stone-100 text-xs font-semibold text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        <span>Contact & details</span>
                        <span>{isContactOpen ? "▲" : "▼"}</span>
                      </button>
                      {isContactOpen && (
                        <div className="px-4 pb-3 space-y-1.5 text-xs text-stone-600 border-t border-stone-50">
                          {doctor.phone && (
                            <a href={`tel:${doctor.phone}`} className="flex items-center gap-2 pt-2 font-medium text-[#3A3370]">
                              <span>📞</span><span>{doctor.phone}</span>
                            </a>
                          )}
                          {doctor.email && (
                            <a href={`mailto:${doctor.email}`} className="flex items-center gap-2 font-medium text-[#3A3370]">
                              <span>✉️</span><span>{doctor.email}</span>
                            </a>
                          )}
                          {doctor.address && (
                            <div className="flex items-start gap-2 text-stone-500">
                              <span>📍</span><span>{doctor.address}</span>
                            </div>
                          )}
                          {doctor.notes && (
                            <div className="flex items-start gap-2 text-stone-400 italic">
                              <span>📝</span><span>{doctor.notes}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Action bar ── */}
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-100 flex-wrap">
                    <button type="button" onClick={() => setAppointmentDoctor(doctor)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors">
                      + Appointment
                    </button>
                    {doctor.booking_url && (
                      <a href={doctor.booking_url} target="_blank" rel="noreferrer"
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 hover:bg-violet-200 transition-colors">
                        Book online
                      </a>
                    )}
                    {doctor.online_reception_url && (
                      <a href={doctor.online_reception_url} target="_blank" rel="noreferrer"
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                        💬 Reception
                      </a>
                    )}
                    {doctor.address && (
                      <button type="button" onClick={() => setNavigationDoctor(doctor)}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                        🧭 Navigate
                      </button>
                    )}
                    <button type="button"
                      onClick={() => setExpandedHistoryDoctorId((c) => c === doctor.id ? null : doctor.id)}
                      className="ml-auto text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors">
                      {isHistoryOpen ? "▲ History" : "▼ History"}
                    </button>
                  </div>

                  {/* ── Visit history (collapsible) ── */}
                  {isHistoryOpen && (
                    <div className="border-t border-stone-100 px-4 py-3">
                      {visitHistory.length > 0 ? (
                        <div className="space-y-0.5">
                          {visitHistory.map((visit) => (
                            <div key={visit.id} className="flex items-start justify-between gap-3 py-2 border-b border-stone-50 last:border-none">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-stone-700 truncate">{visit.title}</p>
                                <p className="text-[11px] text-stone-400">{personNameById(people, visit.person_id)}</p>
                              </div>
                              <p className="text-[11px] text-stone-400 whitespace-nowrap">{formatVisitDate(visit.starts_at)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400">No recorded visits yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Doctor modal */}
      {addingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-heading">Add doctor</h2>
              <p className="text-sm text-stone-500 mt-1">Fill in the details and link to family members</p>
            </div>
            <AddDoctorForm
              onCancel={() => setAddingDoctor(false)}
              onSuccess={async () => { setAddingDoctor(false); await loadDoctorsPage(); }}
            />
          </div>
        </div>
      )}

      {/* Edit Doctor modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-heading">Edit doctor</h2>
              <p className="text-sm text-stone-500 mt-1">Update details and communication links</p>
            </div>
            <AddDoctorForm
              doctor={editingDoctor}
              onCancel={() => setEditingDoctor(null)}
              onSuccess={async () => { setEditingDoctor(null); await loadDoctorsPage(); }}
            />
          </div>
        </div>
      )}

      {/* Add Appointment modal — uses full AddAppointmentForm */}
      {appointmentDoctor && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-heading">Add appointment</h2>
              <p className="text-sm text-stone-500 mt-1">{appointmentDoctor.doctor_name}</p>
            </div>
            <AddAppointmentForm
              prefilledDoctorId={appointmentDoctor.id}
              prefilledPersonId={getPrefilledPersonId(appointmentDoctor)}
              onCancel={() => setAppointmentDoctor(null)}
              onSuccess={async () => { setAppointmentDoctor(null); await loadDoctorsPage(); }}
            />
          </div>
        </div>
      )}

      {/* Navigation modal */}
      {navigationDoctor && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-heading">Navigate</h2>
              <p className="text-sm text-stone-500 mt-1">{navigationDoctor.doctor_name}</p>
              {navigationDoctor.address && (
                <p className="text-xs text-stone-500 mt-1">{navigationDoctor.address}</p>
              )}
            </div>
            <div className="space-y-3">
              {navigationDoctor.address && (
                <>
                  <a href={buildGoogleMapsUrl(navigationDoctor.address)} target="_blank" rel="noreferrer"
                    className="block w-full text-center py-3 rounded-2xl bg-blue-100 text-blue-800 text-sm font-bold">
                    Open in Google Maps
                  </a>
                  <a href={buildWazeUrl(navigationDoctor.address)} target="_blank" rel="noreferrer"
                    className="block w-full text-center py-3 rounded-2xl bg-sky-100 text-sky-800 text-sm font-bold">
                    Open in Waze
                  </a>
                </>
              )}
              <button type="button" onClick={() => setNavigationDoctor(null)}
                className="block w-full text-center py-3 rounded-2xl border border-stone-200 text-stone-600 text-sm font-bold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-heading mb-1">Delete doctor?</h2>
            <p className="text-sm font-medium text-stone-700 mb-1">{deletingDoctor.doctor_name}</p>
            <p className="text-sm text-stone-400 mb-6">Removes the doctor and all family links. Appointments are kept.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDeletingDoctor(null)}
                className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-bold text-stone-600">
                Cancel
              </button>
              <button type="button" onClick={() => handleDeleteDoctor(deletingDoctor)}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 text-sm font-bold disabled:opacity-60">
                {deleteLoading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
