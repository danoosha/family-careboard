"use client";

import { useState } from "react";
import Link from "next/link";
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
  CareJourney,
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
  careJourneys?: CareJourney[];
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
  kind: "appointment" | "preventive" | "care_step" | "journey_appointment";
  raw?: AppointmentFull;
  journeyId?: string;
  journeyTitle?: string;
};

type RecurringScope = "this" | "all";
type ModalState =
  | { type: "none" }
  | { type: "edit"; appointment: AppointmentFull }
  | { type: "duplicate"; appointment: AppointmentFull }
  | { type: "confirm_cancel"; appointment: AppointmentFull; scope: RecurringScope }
  | { type: "confirm_delete"; appointment: AppointmentFull; scope: RecurringScope }
  | { type: "add_appointment"; journeyId?: string };

type TimeRange = "week" | "month" | "6months" | "year";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "week",    label: "Week" },
  { value: "month",   label: "Month" },
  { value: "6months", label: "6 months" },
  { value: "year",    label: "Year" },
];

function getTimeRangeCutoff(range: TimeRange): Date {
  const d = new Date();
  if (range === "week")    d.setDate(d.getDate() + 7);
  else if (range === "month")   d.setMonth(d.getMonth() + 1);
  else if (range === "6months") d.setMonth(d.getMonth() + 6);
  else if (range === "year")    d.setFullYear(d.getFullYear() + 1);
  return d;
}

function getAllTimelineItems({
  appointments,
  preventiveChecks,
  careSteps,
  careJourneys = [],
  doctors = [],
}: Omit<TimelineSectionProps, "person" | "vaccinations">): PersonTimelineItem[] {
  const items: PersonTimelineItem[] = [];

  // Build journey lookup
  const journeyMap = new Map(careJourneys.map((j) => [j.id, j]));

  // Track which (journey_id, date) pairs have a linked appointment
  const linkedApptDates = new Set<string>();
  for (const appt of appointments ?? []) {
    const full = appt as AppointmentFull;
    if (full.care_journey_id && appt.starts_at) {
      linkedApptDates.add(`${full.care_journey_id}::${appt.starts_at.slice(0, 10)}`);
    }
  }

  for (const appt of appointments ?? []) {
    if (!appt.starts_at) continue;
    const full = appt as AppointmentFull;
    if (full.status === "cancelled") continue;

    const doctor = doctors.find((d) => d.id === full.doctor_id);
    const subtitleParts = [
      doctor?.doctor_name ?? null,
      appt.location ?? null,
    ].filter(Boolean);
    const subtitle = subtitleParts.join(" · ") || appt.notes || "";

    // If appointment is part of a journey → render as journey_appointment kind
    const journey = full.care_journey_id ? journeyMap.get(full.care_journey_id) : null;

    items.push({
      id: `appt-${appt.id}`,
      title: appt.title || "Appointment",
      date: appt.starts_at,
      subtitle,
      kind: journey ? "journey_appointment" : "appointment",
      raw: full,
      journeyId: journey?.id,
      journeyTitle: journey?.title,
    });
  }

  // Preventive checks
  for (const check of preventiveChecks ?? []) {
    const status = (check as any).status;
    const scheduledDate = (check as any).scheduled_date;
    const doneDate = (check as any).last_date;
    if (status === "scheduled" && scheduledDate) {
      items.push({
        id: `prev-${check.id}`,
        title: check.check_type || "Preventive check",
        date: scheduledDate,
        subtitle: check.notes || "",
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

  // Care steps — suppressed if journey has a linked appointment on same date
  for (const step of careSteps ?? []) {
    if (!(step as any).step_date) continue;
    const dateKey = `${step.care_journey_id}::${(step as any).step_date}`;
    if (linkedApptDates.has(dateKey)) continue; // deduplicate
    items.push({
      id: `step-${step.id}`,
      title: (step as any).title || "Care step",
      date: (step as any).step_date,
      subtitle: (step as any).notes || "",
      kind: "care_step",
      journeyId: step.care_journey_id,
    });
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const itemDay = new Date(d); itemDay.setHours(0,0,0,0);
  if (itemDay.getTime() === today.getTime()) return "Today";
  if (itemDay.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const KIND_CONFIG = {
  appointment: {
    dot: "bg-[#3A3370]",
    badge: null,
    line: "border-[#3A3370]/20",
  },
  journey_appointment: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    line: "border-emerald-200",
  },
  preventive: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700",
    line: "border-amber-100",
  },
  care_step: {
    dot: "bg-purple-400",
    badge: "bg-purple-50 text-purple-700",
    line: "border-purple-100",
  },
};

export default function TimelineSection({
  person,
  appointments,
  preventiveChecks,
  vaccinations,
  careSteps,
  careJourneys = [],
  doctors = [],
}: TimelineSectionProps) {
  const sb = createClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [timeRange, setTimeRange] = useState<TimeRange>("6months");
  const [showPast, setShowPast] = useState(false);

  const allItems = getAllTimelineItems({ appointments, preventiveChecks, careSteps, careJourneys, doctors });
  const now = new Date();
  const cutoff = getTimeRangeCutoff(timeRange);

  const upcomingItems = allItems.filter((i) => {
    const d = new Date(i.date);
    return d >= now && d <= cutoff;
  });
  const pastItems = allItems.filter((i) => new Date(i.date) < now);

  async function handleCancel(appt: AppointmentFull, scope: RecurringScope) {
    if (scope === "all" && appt.recurring_group_id) {
      await sb.from("appointments").update({ status: "cancelled" })
        .eq("recurring_group_id", appt.recurring_group_id);
    } else {
      await sb.from("appointments").update({ status: "cancelled" }).eq("id", appt.id);
    }
    setModal({ type: "none" });
    window.location.reload();
  }

  async function handleDelete(appt: AppointmentFull, scope: RecurringScope) {
    if (scope === "all" && appt.recurring_group_id) {
      await sb.from("appointments").delete().eq("recurring_group_id", appt.recurring_group_id);
    } else {
      await sb.from("appointments").delete().eq("id", appt.id);
    }
    setModal({ type: "none" });
    window.location.reload();
  }

  function renderItem(item: PersonTimelineItem) {
    const cfg = KIND_CONFIG[item.kind];
    const isAppt = item.kind === "appointment" || item.kind === "journey_appointment";
    const d = new Date(item.date);
    const isToday = formatDate(item.date) === "Today";

    return (
      <div key={item.id} className="flex gap-3">
        {/* Timeline spine */}
        <div className="flex flex-col items-center">
          <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${cfg.dot} ${isToday ? "ring-2 ring-offset-1 ring-current" : ""}`} />
          <div className="w-px flex-1 bg-stone-100 mt-1" />
        </div>

        {/* Content */}
        <div className={`flex-1 pb-4 min-w-0`}>
          <div className={`rounded-2xl border px-3 py-2.5 ${cfg.line} bg-white`}>
            {/* Journey badge */}
            {item.journeyTitle && (
              <Link href={`/care-journeys/${item.journeyId}`} className="block mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge} inline-flex items-center gap-1`}>
                  📋 {item.journeyTitle}
                </span>
              </Link>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-heading leading-tight truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-stone-400 mt-0.5 truncate">{item.subtitle}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-bold ${isToday ? "text-[#3A3370]" : "text-stone-500"}`}>
                  {formatDate(item.date)}
                </p>
                <p className="text-[10px] text-stone-400">{formatTime(item.date)}</p>
              </div>
            </div>

            {/* Actions for appointments */}
            {isAppt && item.raw && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-stone-100">
                <button
                  onClick={() => setModal({ type: "edit", appointment: item.raw! })}
                  className="text-[11px] font-semibold text-[#3A3370]"
                >Edit</button>
                <button
                  onClick={() => setModal({ type: "duplicate", appointment: item.raw! })}
                  className="text-[11px] font-semibold text-stone-400"
                >Duplicate</button>
                <button
                  onClick={() => setModal({ type: "confirm_cancel", appointment: item.raw!, scope: "this" })}
                  className="text-[11px] font-semibold text-amber-500"
                >Cancel</button>
                <button
                  onClick={() => setModal({ type: "confirm_delete", appointment: item.raw!, scope: "this" })}
                  className="text-[11px] font-semibold text-red-400"
                >Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-2">
        {/* Time range filter */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-0.5">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                timeRange === opt.value
                  ? "bg-white text-[#3A3370] shadow-sm"
                  : "text-stone-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {/* Add appointment */}
        <button
          onClick={() => setModal({ type: "add_appointment" })}
          className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#3A3370] text-white"
        >
          + Add
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { dot: "bg-[#3A3370]", label: "Appointment" },
          { dot: "bg-emerald-500", label: "In Journey" },
          { dot: "bg-purple-400", label: "Step" },
          { dot: "bg-amber-400", label: "Preventive" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${l.dot}`} />
            <span className="text-[10px] text-stone-400 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming items */}
      {upcomingItems.length === 0 ? (
        <EmptyState icon="🗓️" title="No upcoming events" subtitle={`Nothing in the next ${timeRange === "6months" ? "6 months" : timeRange}`} compact />
      ) : (
        <div className="space-y-0">
          {upcomingItems.map(renderItem)}
        </div>
      )}

      {/* Past toggle */}
      {pastItems.length > 0 && (
        <button
          onClick={() => setShowPast((v) => !v)}
          className="w-full text-xs font-semibold text-stone-400 py-2 flex items-center justify-center gap-1"
        >
          {showPast ? "▲ Hide" : "▼ Show"} past events ({pastItems.length})
        </button>
      )}

      {showPast && (
        <div className="space-y-0 opacity-60">
          {[...pastItems].reverse().map(renderItem)}
        </div>
      )}

      {/* Modals */}
      {modal.type === "add_appointment" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h2 className="font-extrabold text-heading">Add Appointment</h2>
              <button onClick={() => setModal({ type: "none" })} className="p-1.5 rounded-full bg-stone-100 text-stone-500">✕</button>
            </div>
            <div className="px-5 py-5">
              <AddAppointmentForm
                onSuccess={() => { setModal({ type: "none" }); window.location.reload(); }}
                onCancel={() => setModal({ type: "none" })}
                initialPersonId={person.id}
                initialCareJourneyId={(modal as any).journeyId ?? ""}
              />
            </div>
          </div>
        </div>
      )}

      {modal.type === "edit" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h2 className="font-extrabold text-heading">Edit Appointment</h2>
              <button onClick={() => setModal({ type: "none" })} className="p-1.5 rounded-full bg-stone-100 text-stone-500">✕</button>
            </div>
            <div className="px-5 py-5">
              <EditAppointmentForm
                appointment={modal.appointment}
                onSuccess={() => { setModal({ type: "none" }); window.location.reload(); }}
                onCancel={() => setModal({ type: "none" })}
              />
            </div>
          </div>
        </div>
      )}

      {modal.type === "duplicate" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-200" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <h2 className="font-extrabold text-heading">Duplicate Appointment</h2>
              <button onClick={() => setModal({ type: "none" })} className="p-1.5 rounded-full bg-stone-100 text-stone-500">✕</button>
            </div>
            <div className="px-5 py-5">
              <AddAppointmentForm
                onSuccess={() => { setModal({ type: "none" }); window.location.reload(); }}
                onCancel={() => setModal({ type: "none" })}
                duplicateFrom={modal.appointment}
              />
            </div>
          </div>
        </div>
      )}

      {(modal.type === "confirm_cancel" || modal.type === "confirm_delete") && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl w-full max-w-lg px-5 py-6">
            <p className="font-extrabold text-heading text-center mb-1">
              {modal.type === "confirm_cancel" ? "Cancel appointment?" : "Delete appointment?"}
            </p>
            <p className="text-sm text-stone-500 text-center mb-5">
              {modal.appointment.title}
            </p>
            {modal.appointment.is_recurring && (
              <div className="flex gap-2 mb-4">
                {(["this", "all"] as RecurringScope[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setModal({ ...modal, scope: s } as any)}
                    className={`flex-1 py-2 rounded-2xl text-sm font-bold border ${
                      modal.scope === s ? "bg-[#3A3370] text-white border-[#3A3370]" : "border-stone-200 text-stone-500"
                    }`}
                  >
                    {s === "this" ? "This only" : "All recurring"}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setModal({ type: "none" })}
                className="flex-1 py-3 rounded-2xl border border-stone-200 text-sm font-bold text-stone-500">
                Keep
              </button>
              <button
                onClick={() => modal.type === "confirm_cancel"
                  ? handleCancel(modal.appointment, modal.scope)
                  : handleDelete(modal.appointment, modal.scope)
                }
                className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white ${
                  modal.type === "confirm_cancel" ? "bg-amber-500" : "bg-red-500"
                }`}
              >
                {modal.type === "confirm_cancel" ? "Cancel it" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
