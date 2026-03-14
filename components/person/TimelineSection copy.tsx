"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/ui/EmptyState";
import EditAppointmentForm from "@/components/forms/EditAppointmentForm";
import AddAppointmentForm from "@/components/forms/AddAppointmentForm";
import type {
  Person,
  Appointment,
  PreventiveCheck,
  Vaccination,
  CareJourneyStep,
} from "@/types";

interface DoctorBasic {
  id: string;
  doctor_name: string;
  specialty?: string | null;
}

interface TimelineSectionProps {
  person: Person;
  appointments: Appointment[];
  preventiveChecks: PreventiveCheck[];
  vaccinations: Vaccination[];
  careSteps: CareJourneyStep[];
  doctors?: DoctorBasic[];
}

interface AppointmentFull extends Appointment {
  appointment_type?: string | null;
  care_journey_id?: string | null;
  ends_at?: string | null;
  status?: string;
  is_recurring?: boolean;
  recurring_group_id?: string | null;
}

type PersonTimelineItem = {
  id: string;
  title: string;
  date: string;
  subtitle?: string;
  kind: "appointment" | "preventive" | "care_step";
  raw?: AppointmentFull;
};

type RecurringScope = "this" | "all";

type ModalState =
  | { type: "none" }
  | { type: "edit"; appointment: AppointmentFull }
  | { type: "duplicate"; appointment: AppointmentFull }
  | { type: "confirm_cancel"; appointment: AppointmentFull; scope: RecurringScope }
  | { type: "confirm_delete"; appointment: AppointmentFull; scope: RecurringScope };

type TimeRange = "week" | "month" | "6months" | "year";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "6months", label: "6 months" },
  { value: "year", label: "Year" },
];

function getTimeRangeCutoff(range: TimeRange): Date {
  const d = new Date();
  if (range === "week") d.setDate(d.getDate() + 7);
  else if (range === "month") d.setMonth(d.getMonth() + 1);
  else if (range === "6months") d.setMonth(d.getMonth() + 6);
  else if (range === "year") d.setFullYear(d.getFullYear() + 1);
  return d;
}

/**
 * Care steps deduplication rule:
 * If a care_step's date is within 1 day of an appointment that belongs to the same
 * care_journey (i.e. appointment.care_journey_id is set), we skip the care_step —
 * the appointment already represents that event in the timeline.
 */
function getAllTimelineItems({
  appointments,
  preventiveChecks,
  careSteps,
  doctors = [],
}: Omit<TimelineSectionProps, "person" | "vaccinations">): PersonTimelineItem[] {
  const items: PersonTimelineItem[] = [];

  // Build a set of (journey_id, date) tuples from linked appointments
  // so we can suppress care_steps that are already represented
  const linkedApptDates = new Set<string>();
  for (const appt of appointments ?? []) {
    const full = appt as AppointmentFull;
    if (full.care_journey_id && appt.starts_at) {
      const dateKey = `${full.care_journey_id}::${appt.starts_at.slice(0, 10)}`;
      linkedApptDates.add(dateKey);
    }
  }

  for (const appt of appointments ?? []) {
    if (!appt.starts_at) continue;
    const full = appt as AppointmentFull;
    if (full.status === "cancelled") continue;

    const doctor = doctors.find((d) => d.id === full.doctor_id);
    const doctorLabel = doctor ? doctor.doctor_name : null;
    const locationLabel = appt.location || null;

    const subtitleParts = [doctorLabel, locationLabel].filter(Boolean);
    const subtitle = subtitleParts.length > 0
      ? subtitleParts.join(" · ")
      : appt.notes || "";

    items.push({
      id: `appt-${appt.id}`,
      title: appt.title || "Appointment",
      date: appt.starts_at,
      subtitle,
      kind: "appointment",
      raw: full,
    });
  }

  for (const check of preventiveChecks ?? []) {
    const status = (check as any).status;
    const scheduledDate = (check as any).scheduled_date;
    const doneDate = (check as any).last_date;

    if (status === "scheduled" && scheduledDate) {
      items.push({
        id: `prev-${check.id}`,
        title: check.check_type || "Preventive check",
        date: scheduledDate,
        subtitle: (check as any).notes || "",
        kind: "preventive",
      });
    }

    if (status === "done" && doneDate) {
      items.push({
        id: `prev-done-${check.id}`,
        title: check.check_type || "Preventive check",
        date: doneDate,
        subtitle: "Completed",
        kind: "preventive",
      });
    }
  }

  // Care steps: only show if NOT already covered by a linked appointment
  // on the same day within the same journey
  for (const step of careSteps ?? []) {
    if (!(step as any).step_date) continue;

    const stepDate = (step as any).step_date as string;
    const journeyId = step.care_journey_id;

    // If there's a linked appointment for this journey on the same date → skip
    const dateKey = `${journeyId}::${stepDate.slice(0, 10)}`;
    if (linkedApptDates.has(dateKey)) continue;

    items.push({
      id: `step-${step.id}`,
      title: (step as any).title || (step as any).step_title || "Care step",
      date: stepDate,
      subtitle: (step as any).notes || "",
      kind: "care_step",
    });
  }

  return items.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function formatDateLabel(rawDate: string) {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );

  const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) return `Today ${timeStr}`;
  if (diffDays === 1) return `Tomorrow ${timeStr}`;
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days · ${timeStr}`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}d ago · ${timeStr}`;

  const dateStr = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
  return `${dateStr} · ${timeStr}`;
}

function getKindLabel(kind: PersonTimelineItem["kind"]) {
  switch (kind) {
    case "appointment": return "Appointment";
    case "preventive": return "Preventive care";
    case "care_step": return "Care step";
    default: return "";
  }
}

function getDotColor(kind: PersonTimelineItem["kind"], colorHex: string) {
  switch (kind) {
    case "appointment": return colorHex;
    case "preventive": return "#F0C36A";
    case "care_step": return "#8BC48A";
    default: return colorHex;
  }
}

export default function TimelineSection({
  person,
  appointments,
  preventiveChecks,
  vaccinations,
  careSteps,
  doctors = [],
}: TimelineSectionProps) {
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [localAppointments, setLocalAppointments] =
    useState<Appointment[]>(appointments);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const supabase = createClient();

  const now = new Date();
  const cutoff = getTimeRangeCutoff(timeRange);

  const allItems = getAllTimelineItems({
    appointments: localAppointments,
    preventiveChecks,
    careSteps,
    doctors,
  });

  const futureItems = allItems.filter(
    (item) => {
      const d = new Date(item.date);
      return d >= now && d <= cutoff;
    }
  );

  const pastItems = allItems
    .filter((item) => new Date(item.date) < now)
    .reverse();

  // ─── Cancel ──────────────────────────────────────────────────────────────
  async function handleCancel(appt: AppointmentFull, scope: RecurringScope) {
    setActionLoading(appt.id);

    if (scope === "all" && appt.recurring_group_id) {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("recurring_group_id", appt.recurring_group_id);

      if (!error) {
        setLocalAppointments((prev) =>
          prev.map((a) =>
            (a as AppointmentFull).recurring_group_id === appt.recurring_group_id
              ? { ...a, status: "cancelled" }
              : a
          )
        );
      }
    } else {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appt.id);

      if (!error) {
        setLocalAppointments((prev) =>
          prev.map((a) =>
            a.id === appt.id ? { ...a, status: "cancelled" } : a
          )
        );
      }
    }

    setActionLoading(null);
    setModal({ type: "none" });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(appt: AppointmentFull, scope: RecurringScope) {
    setActionLoading(appt.id);

    if (scope === "all" && appt.recurring_group_id) {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("recurring_group_id", appt.recurring_group_id);

      if (!error) {
        setLocalAppointments((prev) =>
          prev.filter(
            (a) =>
              (a as AppointmentFull).recurring_group_id !== appt.recurring_group_id
          )
        );
      }
    } else {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", appt.id);

      if (!error) {
        setLocalAppointments((prev) => prev.filter((a) => a.id !== appt.id));
      }
    }

    setActionLoading(null);
    setModal({ type: "none" });
  }

  function handleEditSuccess() {
    setModal({ type: "none" });
    window.location.reload();
  }

  function handleDuplicateSuccess() {
    setModal({ type: "none" });
    window.location.reload();
  }

  return (
    <>
      {/* ── Time range filter ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-3">
        {TIME_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTimeRange(opt.value)}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-colors ${
              timeRange === opt.value
                ? "bg-[#3A3370] text-white"
                : "bg-white border border-stone-200 text-stone-500"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Upcoming ──────────────────────────────────────────────────── */}
      {futureItems.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-card">
          <EmptyState icon="🗓️" title={`No upcoming events in the next ${TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.label.toLowerCase()}`} compact />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
          {futureItems.map((item) => (
            <TimelineRow
              key={item.id}
              item={item}
              person={person}
              onEdit={(appt) => setModal({ type: "edit", appointment: appt })}
              onDuplicate={(appt) => setModal({ type: "duplicate", appointment: appt })}
              onCancel={(appt) => setModal({ type: "confirm_cancel", appointment: appt, scope: "this" })}
              onDelete={(appt) => setModal({ type: "confirm_delete", appointment: appt, scope: "this" })}
            />
          ))}
        </div>
      )}

      {/* ── Past toggle ───────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowPast((v) => !v)}
        className="w-full mt-3 py-2 rounded-2xl border border-stone-200 text-xs font-bold text-stone-500 bg-white flex items-center justify-center gap-1.5"
      >
        <span>{showPast ? "▲" : "▼"}</span>
        {showPast ? "Hide past events" : `Show past events${pastItems.length > 0 ? ` (${pastItems.length})` : ""}`}
      </button>

      {/* ── Past items ────────────────────────────────────────────────── */}
      {showPast && (
        <div className="mt-2">
          {pastItems.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-card">
              <EmptyState icon="📋" title="No past events" compact />
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-card divide-y divide-border opacity-75">
              {pastItems.map((item) => (
                <TimelineRow
                  key={item.id}
                  item={item}
                  person={person}
                  isPast
                  onEdit={(appt) => setModal({ type: "edit", appointment: appt })}
                  onDuplicate={(appt) => setModal({ type: "duplicate", appointment: appt })}
                  onCancel={(appt) => setModal({ type: "confirm_cancel", appointment: appt, scope: "this" })}
                  onDelete={(appt) => setModal({ type: "confirm_delete", appointment: appt, scope: "this" })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Edit modal ───────────────────────────────────────────────── */}
      {modal.type === "edit" && (
        <Modal title="Edit appointment" onClose={() => setModal({ type: "none" })}>
          <EditAppointmentForm
            appointment={modal.appointment}
            onSuccess={handleEditSuccess}
            onCancel={() => setModal({ type: "none" })}
          />
        </Modal>
      )}

      {/* ── Duplicate modal ──────────────────────────────────────────── */}
      {modal.type === "duplicate" && (
        <Modal title="Duplicate appointment" onClose={() => setModal({ type: "none" })}>
          <AddAppointmentForm
            onSuccess={handleDuplicateSuccess}
            onCancel={() => setModal({ type: "none" })}
            duplicateFrom={{
              person_id: modal.appointment.person_id,
              doctor_id: modal.appointment.doctor_id,
              care_journey_id: modal.appointment.care_journey_id,
              appointment_type: modal.appointment.appointment_type,
              title: modal.appointment.title,
              location: modal.appointment.location,
              notes: modal.appointment.notes,
            }}
          />
        </Modal>
      )}

      {/* ── Confirm cancel ───────────────────────────────────────────── */}
      {modal.type === "confirm_cancel" && (
        <Modal title="Cancel appointment?" onClose={() => setModal({ type: "none" })}>
          <p className="text-sm text-stone-600 mb-4">
            This appointment will be marked as cancelled but kept in history.
          </p>
          {modal.appointment.is_recurring && modal.appointment.recurring_group_id && (
            <RecurringScopeSelector
              scope={modal.scope}
              onChange={(s) =>
                setModal((prev) =>
                  prev.type === "confirm_cancel" ? { ...prev, scope: s } : prev
                )
              }
              actionLabel="cancel"
            />
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setModal({ type: "none" })}
              className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted"
            >
              Back
            </button>
            <button
              onClick={() => handleCancel(modal.appointment, modal.scope)}
              disabled={!!actionLoading}
              className="flex-1 py-3 rounded-2xl bg-amber-100 text-amber-700 text-sm font-bold disabled:opacity-60"
            >
              {actionLoading ? "Cancelling…" : "Yes, cancel"}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Confirm delete ───────────────────────────────────────────── */}
      {modal.type === "confirm_delete" && (
        <Modal title="Delete appointment?" onClose={() => setModal({ type: "none" })}>
          <p className="text-sm text-stone-600 mb-4">
            This will permanently delete the appointment. This cannot be undone.
          </p>
          {modal.appointment.is_recurring && modal.appointment.recurring_group_id && (
            <RecurringScopeSelector
              scope={modal.scope}
              onChange={(s) =>
                setModal((prev) =>
                  prev.type === "confirm_delete" ? { ...prev, scope: s } : prev
                )
              }
              actionLabel="delete"
            />
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setModal({ type: "none" })}
              className="flex-1 py-3 rounded-2xl border border-border text-sm font-bold text-muted"
            >
              Back
            </button>
            <button
              onClick={() => handleDelete(modal.appointment, modal.scope)}
              disabled={!!actionLoading}
              className="flex-1 py-3 rounded-2xl bg-red-100 text-red-600 text-sm font-bold disabled:opacity-60"
            >
              {actionLoading ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── TimelineRow ─────────────────────────────────────────────────────────────
function TimelineRow({
  item,
  person,
  isPast = false,
  onEdit,
  onDuplicate,
  onCancel,
  onDelete,
}: {
  item: PersonTimelineItem;
  person: Person;
  isPast?: boolean;
  onEdit: (appt: AppointmentFull) => void;
  onDuplicate: (appt: AppointmentFull) => void;
  onCancel: (appt: AppointmentFull) => void;
  onDelete: (appt: AppointmentFull) => void;
}) {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <div
        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
        style={{
          backgroundColor: getDotColor(item.kind, person.color_hex),
          opacity: isPast ? 0.5 : 1,
        }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-heading leading-tight">
            {item.title}
          </p>
          {item.raw?.is_recurring && (
            <span className="text-[10px] text-stone-400" title="Recurring">🔁</span>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          {getKindLabel(item.kind)}
        </p>
        {item.subtitle && (
          <p className="text-xs text-stone-500 mt-1 italic leading-relaxed">
            {item.subtitle}
          </p>
        )}

        {/* Action buttons — only for appointments */}
        {item.kind === "appointment" && item.raw && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onEdit(item.raw!)}
              className="text-xs text-blue-500 font-medium hover:underline"
            >
              Edit
            </button>
            <span className="text-xs text-stone-300">·</span>
            <button
              onClick={() => onDuplicate(item.raw!)}
              className="text-xs text-stone-500 font-medium hover:underline"
            >
              Duplicate
            </button>
            {!isPast && (
              <>
                <span className="text-xs text-stone-300">·</span>
                <button
                  onClick={() => onCancel(item.raw!)}
                  className="text-xs text-amber-500 font-medium hover:underline"
                >
                  Cancel
                </button>
              </>
            )}
            <span className="text-xs text-stone-300">·</span>
            <button
              onClick={() => onDelete(item.raw!)}
              className="text-xs text-red-400 font-medium hover:underline"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={`text-xs whitespace-nowrap ${isPast ? "text-stone-400" : "text-stone-500"}`}>
        {formatDateLabel(item.date)}
      </div>
    </div>
  );
}

// ─── Recurring scope radio ────────────────────────────────────────────────────
function RecurringScopeSelector({
  scope,
  onChange,
  actionLabel,
}: {
  scope: RecurringScope;
  onChange: (s: RecurringScope) => void;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
      {(["this", "all"] as RecurringScope[]).map((s) => (
        <label
          key={s}
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
            scope === s ? "bg-stone-50" : "bg-white"
          }`}
        >
          <input
            type="radio"
            name="recurring_scope"
            value={s}
            checked={scope === s}
            onChange={() => onChange(s)}
            className="accent-[#3A3370]"
          />
          <span className="text-sm text-heading font-medium">
            {s === "this"
              ? `${actionLabel === "cancel" ? "Cancel" : "Delete"} this appointment only`
              : `${actionLabel === "cancel" ? "Cancel" : "Delete"} all recurring appointments`}
          </span>
        </label>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-heading">{title}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
