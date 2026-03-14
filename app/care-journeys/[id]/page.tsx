"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/layout/AppShell";
import AddStepForm from "@/components/care-journeys/AddStepForm";
import AddCareJourneyForm from "@/components/care-journeys/AddCareJourneyForm";
import AddAppointmentForm from "@/components/forms/AddAppointmentForm";
import EditAppointmentForm from "@/components/forms/EditAppointmentForm";
import type { CareJourney, CareJourneyStep, Appointment, Person } from "@/types";

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

const STATUS_META: Record<string, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-100 text-emerald-800" },
  paused:    { label: "Paused",    className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", className: "bg-stone-100 text-stone-500" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-400" },
};

interface DocumentRow {
  id: string;
  title: string;
  document_date?: string | null;
  drive_url?: string | null;
  notes?: string | null;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) >= new Date();
}

type ModalState =
  | { type: "none" }
  | { type: "add_step" }
  | { type: "edit_step"; step: CareJourneyStep }
  | { type: "delete_step"; step: CareJourneyStep }
  | { type: "duplicate_step"; step: CareJourneyStep }
  | { type: "edit_journey" }
  | { type: "delete_journey" }
  | { type: "add_appointment" }
  | { type: "edit_appointment"; appt: Appointment }
  | { type: "duplicate_appointment"; appt: Appointment }
  | { type: "confirm_delete_appointment"; appt: Appointment }
  | { type: "add_document" }
  | { type: "delete_document"; doc: DocumentRow };

export default function CareJourneyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();

  const [journey, setJourney] = useState<CareJourney | null>(null);
  const [steps, setSteps] = useState<CareJourneyStep[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Document form state
  const [docForm, setDocForm] = useState({ title: "", document_date: "", drive_url: "", notes: "" });
  const [docSaving, setDocSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [journeyRes, stepsRes, apptsRes, docsRes] = await Promise.all([
      sb.from("care_journeys").select("*").eq("id", id).single(),
      sb.from("care_journey_steps").select("*").eq("care_journey_id", id).order("step_date", { ascending: true, nullsFirst: false }),
      sb.from("appointments").select("*").eq("care_journey_id", id).order("starts_at", { ascending: true }),
      sb.from("documents").select("*").eq("care_journey_id", id).order("document_date", { ascending: false }),
    ]);

    const j = journeyRes.data as CareJourney;
    setJourney(j);
    setSteps((stepsRes.data as CareJourneyStep[]) ?? []);
    setAppointments((apptsRes.data as Appointment[]) ?? []);
    setDocuments((docsRes.data as DocumentRow[]) ?? []);

    if (j?.person_id) {
      const { data: personData } = await sb.from("people").select("*").eq("id", j.person_id).single();
      setPerson(personData as Person);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const futureSteps = steps.filter((s) => s.step_date && new Date(s.step_date) >= today)
    .sort((a, b) => new Date(a.step_date!).getTime() - new Date(b.step_date!).getTime());
  const pastSteps = steps.filter((s) => !s.step_date || new Date(s.step_date) < today)
    .sort((a, b) => new Date(b.step_date ?? "").getTime() - new Date(a.step_date ?? "").getTime());
  const nextStep = futureSteps[0] ?? null;
  const upcomingAppts = appointments.filter((a) => (a as any).status !== "cancelled" && a.starts_at && isUpcoming(a.starts_at));
  const pastAppts = appointments.filter((a) => !a.starts_at || !isUpcoming(a.starts_at));

  async function handleDeleteJourney() {
    setDeleteLoading(true);
    await sb.from("care_journey_steps").delete().eq("care_journey_id", id);
    await sb.from("appointments").update({ care_journey_id: null }).eq("care_journey_id", id);
    await sb.from("care_journeys").delete().eq("id", id);
    setDeleteLoading(false);
    router.push("/care-journeys");
  }

  async function handleDeleteStep(step: CareJourneyStep) {
    await sb.from("care_journey_steps").delete().eq("id", step.id);
    setSteps((prev) => prev.filter((s) => s.id !== step.id));
    setModal({ type: "none" });
  }

  async function handleDuplicateStep(step: CareJourneyStep) {
    const { data } = await sb.from("care_journey_steps").insert({
      care_journey_id: id,
      person_id: step.person_id,
      title: `${step.title} (copy)`,
      step_date: null,
      notes: step.notes,
      status: "pending",
    }).select().single();
    if (data) setSteps((prev) => [...prev, data as CareJourneyStep]);
    setModal({ type: "none" });
  }

  async function handleDeleteAppointment(appt: Appointment) {
    await sb.from("appointments").delete().eq("id", appt.id);
    setAppointments((prev) => prev.filter((a) => a.id !== appt.id));
    setModal({ type: "none" });
  }

  async function handleSaveDocument() {
    if (!docForm.title.trim()) return;
    setDocSaving(true);
    await sb.from("documents").insert({
      workspace_id: WORKSPACE_ID,
      person_id: journey?.person_id,
      care_journey_id: id,
      title: docForm.title.trim(),
      document_date: docForm.document_date || null,
      drive_url: docForm.drive_url.trim() || null,
      notes: docForm.notes.trim() || null,
    });
    setDocSaving(false);
    setDocForm({ title: "", document_date: "", drive_url: "", notes: "" });
    setModal({ type: "none" });
    await load();
  }

  async function handleDeleteDocument(doc: DocumentRow) {
    await sb.from("documents").delete().eq("id", doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setModal({ type: "none" });
  }

  if (loading) {
    return <AppShell><div className="px-4 pt-8 text-sm text-stone-400">Loading…</div></AppShell>;
  }

  if (!journey) {
    return <AppShell><div className="px-4 pt-8 text-sm text-stone-500">Journey not found.</div></AppShell>;
  }

  const meta = STATUS_META[journey.status] ?? STATUS_META.active;

  return (
    <AppShell>
      <div className="px-4 pt-4 pb-10 space-y-5">

        {/* Back */}
        <Link href="/care-journeys" className="inline-flex items-center gap-1 text-xs text-stone-400 font-medium hover:text-stone-600">
          ‹ Care Journeys
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              {person && (
                <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: person.color_hex }} />
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-heading leading-tight">{journey.title}</h1>
                {person && <p className="text-sm text-stone-500 mt-0.5">{person.display_name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.className}`}>{meta.label}</span>
              <button onClick={() => setModal({ type: "edit_journey" })}
                className="text-xs font-semibold text-stone-400 hover:text-stone-600 px-2 py-1">Edit</button>
              <button onClick={() => setModal({ type: "delete_journey" })}
                className="text-xs font-semibold text-rose-300 hover:text-rose-500 px-2 py-1">✕</button>
            </div>
          </div>

          {journey.description && (
            <p className="text-sm text-stone-600 leading-relaxed">{journey.description}</p>
          )}

          <div className="flex gap-3 text-xs text-stone-400 font-medium flex-wrap">
            <span>{steps.length} step{steps.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{appointments.length} appointment{appointments.length !== 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{documents.length} document{documents.length !== 1 ? "s" : ""}</span>
            {journey.created_at && <><span>·</span><span>Started {formatDate(journey.created_at)}</span></>}
          </div>
        </div>

        {/* Next step callout */}
        {nextStep && (
          <div className="bg-emerald-50 rounded-3xl p-4 border border-emerald-100">
            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Next step</p>
            <p className="text-sm font-bold text-emerald-900">{nextStep.title}</p>
            {nextStep.step_date && <p className="text-xs text-emerald-600 mt-0.5">{formatDate(nextStep.step_date)}</p>}
            {nextStep.notes && <p className="text-xs text-emerald-700 mt-1 italic">{nextStep.notes}</p>}
          </div>
        )}
        {journey.status === "active" && !nextStep && (
          <div className="bg-amber-50 rounded-3xl p-4 border border-amber-100">
            <p className="text-sm font-semibold text-amber-700">No upcoming step — add one to keep the journey moving</p>
          </div>
        )}

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Steps</h2>
            <button onClick={() => setModal({ type: "add_step" })}
              className="text-xs font-bold text-[#3A3370] hover:opacity-70">+ Add step</button>
          </div>
          {steps.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-card px-4 py-5 text-center">
              <p className="text-sm text-stone-400">No steps yet</p>
              <button onClick={() => setModal({ type: "add_step" })}
                className="mt-2 text-xs font-bold text-[#3A3370]">Add the first step →</button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              {futureSteps.map((step) => (
                <StepRow key={step.id} step={step} upcoming
                  onEdit={() => setModal({ type: "edit_step", step })}
                  onDuplicate={() => handleDuplicateStep(step)}
                  onDelete={() => setModal({ type: "delete_step", step })}
                />
              ))}
              {pastSteps.length > 0 && (
                <div className="opacity-50">
                  {pastSteps.map((step) => (
                    <StepRow key={step.id} step={step} upcoming={false}
                      onEdit={() => setModal({ type: "edit_step", step })}
                      onDuplicate={() => handleDuplicateStep(step)}
                      onDelete={() => setModal({ type: "delete_step", step })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Linked appointments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Appointments</h2>
            <button onClick={() => setModal({ type: "add_appointment" })}
              className="text-xs font-bold text-[#3A3370] hover:opacity-70">+ Add</button>
          </div>
          {appointments.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-card px-4 py-5 text-center">
              <p className="text-sm text-stone-400">No appointments linked</p>
              <button onClick={() => setModal({ type: "add_appointment" })}
                className="mt-2 text-xs font-bold text-[#3A3370]">Link an appointment →</button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-card overflow-hidden">
              {upcomingAppts.map((appt) => (
                <ApptRow key={appt.id} appt={appt}
                  onEdit={() => setModal({ type: "edit_appointment", appt })}
                  onDuplicate={() => setModal({ type: "duplicate_appointment", appt })}
                  onDelete={() => setModal({ type: "confirm_delete_appointment", appt })}
                />
              ))}
              {pastAppts.length > 0 && (
                <div className="opacity-50">
                  {pastAppts.map((appt) => (
                    <ApptRow key={appt.id} appt={appt} past
                      onEdit={() => setModal({ type: "edit_appointment", appt })}
                      onDuplicate={() => setModal({ type: "duplicate_appointment", appt })}
                      onDelete={() => setModal({ type: "confirm_delete_appointment", appt })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">Documents</h2>
            <button onClick={() => setModal({ type: "add_document" })}
              className="text-xs font-bold text-[#3A3370] hover:opacity-70">+ Add</button>
          </div>
          {documents.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-card px-4 py-5 text-center">
              <p className="text-sm text-stone-400">No documents yet</p>
              <button onClick={() => setModal({ type: "add_document" })}
                className="mt-2 text-xs font-bold text-[#3A3370]">Add a document →</button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-card divide-y divide-stone-100">
              {documents.map((doc) => (
                <div key={doc.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-base mt-0.5">📁</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-heading truncate">{doc.title}</p>
                    {doc.document_date && (
                      <p className="text-xs text-stone-400 mt-0.5">{formatDate(doc.document_date)}</p>
                    )}
                    {doc.notes && <p className="text-xs text-stone-500 mt-0.5 italic">{doc.notes}</p>}
                    <div className="flex gap-3 mt-1.5">
                      {doc.drive_url && (
                        <a href={doc.drive_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 font-medium hover:underline">Open →</a>
                      )}
                      <button onClick={() => setModal({ type: "delete_document", doc })}
                        className="text-xs text-rose-300 font-medium hover:text-rose-500">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      {modal.type === "add_step" && (
        <Modal title="Add step" onClose={() => setModal({ type: "none" })}>
          <AddStepForm careJourneyId={id} personId={journey.person_id}
            onCancel={() => setModal({ type: "none" })}
            onSuccess={(step) => { setSteps((prev) => [...prev, step]); setModal({ type: "none" }); }} />
        </Modal>
      )}

      {modal.type === "edit_step" && (
        <Modal title="Edit step" onClose={() => setModal({ type: "none" })}>
          <AddStepForm careJourneyId={id} personId={journey.person_id} step={modal.step}
            onCancel={() => setModal({ type: "none" })}
            onSuccess={(updated) => { setSteps((prev) => prev.map((s) => s.id === updated.id ? updated : s)); setModal({ type: "none" }); }} />
        </Modal>
      )}

      {modal.type === "delete_step" && (
        <Modal title="Delete step?" onClose={() => setModal({ type: "none" })}>
          <p className="text-sm text-stone-600 mb-4">Delete <strong>"{modal.step.title}"</strong>? This cannot be undone.</p>
          <div className="flex gap-2">
            <button onClick={() => setModal({ type: "none" })}
              className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-bold text-stone-500">Cancel</button>
            <button onClick={() => handleDeleteStep(modal.step)}
              className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 text-sm font-bold">Delete</button>
          </div>
        </Modal>
      )}

      {modal.type === "edit_journey" && journey && (
        <Modal title="Edit journey" onClose={() => setModal({ type: "none" })}>
          <AddCareJourneyForm journey={journey}
            onCancel={() => setModal({ type: "none" })}
            onSuccess={(updated) => { setJourney(updated); setModal({ type: "none" }); }} />
        </Modal>
      )}

      {modal.type === "delete_journey" && (
        <Modal title="Delete journey?" onClose={() => setModal({ type: "none" })}>
          <p className="text-sm text-stone-600 mb-2">This will permanently delete <strong>"{journey.title}"</strong> and all its steps.</p>
          <p className="text-xs text-stone-400 mb-4">Linked appointments will be kept but unlinked.</p>
          <div className="flex gap-2">
            <button onClick={() => setModal({ type: "none" })}
              className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-bold text-stone-500">Cancel</button>
            <button onClick={handleDeleteJourney} disabled={deleteLoading}
              className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 text-sm font-bold disabled:opacity-60">
              {deleteLoading ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </Modal>
      )}

      {modal.type === "add_appointment" && (
        <Modal title="Add appointment" onClose={() => setModal({ type: "none" })}>
          <AddAppointmentForm prefilledPersonId={journey.person_id} initialCareJourneyId={id}
            onCancel={() => setModal({ type: "none" })}
            onSuccess={async () => { setModal({ type: "none" }); await load(); }} />
        </Modal>
      )}

      {modal.type === "edit_appointment" && (
        <Modal title="Edit appointment" onClose={() => setModal({ type: "none" })}>
          <EditAppointmentForm appointment={modal.appt}
            onCancel={() => setModal({ type: "none" })}
            onSuccess={async () => { setModal({ type: "none" }); await load(); }} />
        </Modal>
      )}

      {modal.type === "duplicate_appointment" && (
        <Modal title="Duplicate appointment" onClose={() => setModal({ type: "none" })}>
          <AddAppointmentForm duplicateFrom={modal.appt} initialCareJourneyId={id}
            onCancel={() => setModal({ type: "none" })}
            onSuccess={async () => { setModal({ type: "none" }); await load(); }} />
        </Modal>
      )}

      {modal.type === "confirm_delete_appointment" && (
        <Modal title="Delete appointment?" onClose={() => setModal({ type: "none" })}>
          <p className="text-sm text-stone-600 mb-4">Delete <strong>"{modal.appt.title}"</strong>?</p>
          <div className="flex gap-2">
            <button onClick={() => setModal({ type: "none" })}
              className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-bold text-stone-500">Cancel</button>
            <button onClick={() => handleDeleteAppointment(modal.appt)}
              className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 text-sm font-bold">Delete</button>
          </div>
        </Modal>
      )}

      {modal.type === "add_document" && (
        <Modal title="Add document" onClose={() => setModal({ type: "none" })}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">Title *</label>
              <input value={docForm.title} onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A3370]/30"
                placeholder="e.g. MRI Report" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">Date</label>
              <input type="date" value={docForm.document_date} onChange={(e) => setDocForm((f) => ({ ...f, document_date: e.target.value }))}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A3370]/30" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">Google Drive link</label>
              <input value={docForm.drive_url} onChange={(e) => setDocForm((f) => ({ ...f, drive_url: e.target.value }))}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A3370]/30"
                placeholder="https://drive.google.com/..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1">Notes</label>
              <textarea value={docForm.notes} onChange={(e) => setDocForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2} className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A3370]/30 resize-none" />
            </div>
            <button onClick={handleSaveDocument} disabled={docSaving || !docForm.title.trim()}
              className="w-full py-3 rounded-2xl bg-[#3A3370] text-white text-sm font-bold disabled:opacity-60">
              {docSaving ? "Saving…" : "Save document"}
            </button>
          </div>
        </Modal>
      )}

      {modal.type === "delete_document" && (
        <Modal title="Delete document?" onClose={() => setModal({ type: "none" })}>
          <p className="text-sm text-stone-600 mb-4">Delete <strong>"{modal.doc.title}"</strong>?</p>
          <div className="flex gap-2">
            <button onClick={() => setModal({ type: "none" })}
              className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-bold text-stone-500">Cancel</button>
            <button onClick={() => handleDeleteDocument(modal.doc)}
              className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 text-sm font-bold">Delete</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

// ── StepRow ────────────────────────────────────────────────────────────────────
function StepRow({ step, upcoming, onEdit, onDuplicate, onDelete }: {
  step: CareJourneyStep; upcoming: boolean;
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  return (
    <div className="px-4 py-3 flex items-start gap-3 border-b border-stone-100 last:border-0">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 border-2 ${
        upcoming ? "bg-emerald-400 border-emerald-400" : "bg-white border-stone-300"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-heading">{step.title}</p>
        {step.step_date && (
          <p className="text-xs text-stone-400 mt-0.5">
            {new Date(step.step_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
        {step.notes && <p className="text-xs text-stone-500 mt-1 italic">{step.notes}</p>}
        <div className="flex gap-3 mt-1.5">
          <button onClick={onEdit} className="text-xs text-[#3A3370] font-semibold hover:underline">Edit</button>
          <button onClick={onDuplicate} className="text-xs text-stone-400 font-semibold hover:underline">Duplicate</button>
          <button onClick={onDelete} className="text-xs text-rose-400 font-semibold hover:underline">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── ApptRow ────────────────────────────────────────────────────────────────────
function ApptRow({ appt, past = false, onEdit, onDuplicate, onDelete }: {
  appt: Appointment; past?: boolean;
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  return (
    <div className="px-4 py-3 flex items-start gap-3 border-b border-stone-100 last:border-0">
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#3A3370] opacity-60" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-heading">{appt.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {appt.location && <p className="text-xs text-stone-400">{appt.location}</p>}
          {appt.starts_at && (
            <p className={`text-xs ${past ? "text-stone-300" : "text-stone-500"}`}>
              {new Date(appt.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              {" · "}
              {new Date(appt.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-1.5">
          <button onClick={onEdit} className="text-xs text-[#3A3370] font-semibold hover:underline">Edit</button>
          <button onClick={onDuplicate} className="text-xs text-stone-400 font-semibold hover:underline">Duplicate</button>
          <button onClick={onDelete} className="text-xs text-rose-400 font-semibold hover:underline">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
          <h2 className="font-extrabold text-heading">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-stone-100 text-stone-500">✕</button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
