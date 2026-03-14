/**
 * app/dashboard/page.tsx  (or app/page.tsx — wherever your home route is)
 * 
 * Family home page — unified timeline across all people.
 * Uses the same TimelineSection as person pages, extended for multi-person view.
 */

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import type {
  Person, Appointment, PreventiveCheck, Vaccination,
  CareJourney, CareJourneyStep,
} from "@/types";

export const revalidate = 0;

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  subtitle?: string;
  kind: "appointment" | "journey_appointment" | "preventive" | "care_step";
  personId: string;
  personName: string;
  personColor: string;
  journeyId?: string;
  journeyTitle?: string;
  appointmentId?: string;
  careJourneyId?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const day = new Date(d); day.setHours(0,0,0,0);
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === tomorrow.getTime()) return "Tomorrow";
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff > 1 && diff <= 7) return `In ${diff} days`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function HomePage() {
  const supabase = createClient();

  const [
    { data: people },
    { data: appointments },
    { data: careJourneys },
    { data: careSteps },
    { data: doctors },
  ] = await Promise.all([
    supabase.from("people").select("*").eq("workspace_id", WORKSPACE_ID).order("sort_order"),
    supabase.from("appointments").select("*")
      .eq("workspace_id", WORKSPACE_ID)
      .neq("status", "cancelled")
      .gte("starts_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lte("starts_at", new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true }),
    supabase.from("care_journeys").select("*").eq("workspace_id", WORKSPACE_ID).eq("status", "active"),
    supabase.from("care_journey_steps").select("*").eq("workspace_id", WORKSPACE_ID).order("step_date", { ascending: true }),
    supabase.from("doctors").select("id, doctor_name, specialty"),
  ]);

  const typedPeople = (people as Person[]) ?? [];
  const typedAppts = (appointments as Appointment[]) ?? [];
  const typedJourneys = (careJourneys as CareJourney[]) ?? [];
  const typedSteps = (careSteps as CareJourneyStep[]) ?? [];
  const typedDoctors = (doctors as any[]) ?? [];

  const peopleMap = new Map(typedPeople.map((p) => [p.id, p]));
  const journeyMap = new Map(typedJourneys.map((j) => [j.id, j]));
  const doctorMap = new Map(typedDoctors.map((d) => [d.id, d]));

  // Build unified timeline
  const events: TimelineEvent[] = [];
  const today = new Date(); today.setHours(0,0,0,0);
  const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() + 6);

  // Track (journey_id, date) to suppress duplicate steps
  const linkedApptDates = new Set<string>();
  for (const appt of typedAppts) {
    const cjId = (appt as any).care_journey_id;
    if (cjId && appt.starts_at) {
      linkedApptDates.add(`${cjId}::${appt.starts_at.slice(0, 10)}`);
    }
  }

  // Appointments
  for (const appt of typedAppts) {
    const person = peopleMap.get(appt.person_id);
    if (!person) continue;
    const doctor = doctorMap.get((appt as any).doctor_id);
    const journey = (appt as any).care_journey_id ? journeyMap.get((appt as any).care_journey_id) : null;

    const subtitleParts = [
      doctor?.doctor_name ?? null,
      appt.location ?? null,
    ].filter(Boolean);

    events.push({
      id: `appt-${appt.id}`,
      title: appt.title || "Appointment",
      date: appt.starts_at,
      subtitle: subtitleParts.join(" · ") || (appt as any).notes || "",
      kind: journey ? "journey_appointment" : "appointment",
      personId: person.id,
      personName: person.display_name,
      personColor: person.color_hex ?? "#C7E6A3",
      journeyId: journey?.id,
      journeyTitle: journey?.title,
      appointmentId: appt.id,
      careJourneyId: (appt as any).care_journey_id,
    });
  }

  // Care steps (not already represented by appointment)
  for (const step of typedSteps) {
    const stepDate = (step as any).step_date;
    if (!stepDate) continue;
    const dateKey = `${step.care_journey_id}::${stepDate}`;
    if (linkedApptDates.has(dateKey)) continue;

    const journey = journeyMap.get(step.care_journey_id ?? "");
    if (!journey) continue;
    const person = peopleMap.get(journey.person_id ?? "");
    if (!person) continue;

    const d = new Date(stepDate);
    if (d < today || d > sixMonths) continue;

    events.push({
      id: `step-${step.id}`,
      title: (step as any).title || "Care step",
      date: stepDate,
      subtitle: (step as any).notes || "",
      kind: "care_step",
      personId: person.id,
      personName: person.display_name,
      personColor: person.color_hex ?? "#C7E6A3",
      journeyId: journey.id,
      journeyTitle: journey.title,
    });
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todayEvents = events.filter((e) => formatDate(e.date) === "Today");
  const upcomingEvents = events.filter((e) => formatDate(e.date) !== "Today");

  const KIND_COLORS = {
    appointment:         { dot: "bg-[#3A3370]", border: "border-stone-100" },
    journey_appointment: { dot: "bg-emerald-500", border: "border-emerald-100" },
    preventive:          { dot: "bg-amber-400", border: "border-amber-100" },
    care_step:           { dot: "bg-purple-400", border: "border-purple-100" },
  };

  function renderEvent(event: TimelineEvent) {
    const cfg = KIND_COLORS[event.kind];
    const isToday = formatDate(event.date) === "Today";

    return (
      <div key={event.id} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${cfg.dot}`} />
          <div className="w-px flex-1 bg-stone-100 mt-1" />
        </div>
        <div className="flex-1 pb-3 min-w-0">
          <div className={`rounded-2xl border ${cfg.border} bg-white px-3 py-2.5`}>
            {/* Journey tag */}
            {event.journeyTitle && (
              <Link href={`/care-journeys/${event.journeyId}`} className="block mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  📋 {event.journeyTitle}
                </span>
              </Link>
            )}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex items-start gap-2">
                {/* Person color dot */}
                <Link href={`/people/${event.personId}`}>
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow-sm"
                    style={{ backgroundColor: event.personColor }}
                    title={event.personName}
                  />
                </Link>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-heading leading-tight truncate">{event.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {event.personName}{event.subtitle ? ` · ${event.subtitle}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-bold ${isToday ? "text-[#3A3370]" : "text-stone-500"}`}>
                  {formatDate(event.date)}
                </p>
                <p className="text-[10px] text-stone-400">{formatTime(event.date)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-5 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-heading">Family</h1>
          <div className="flex gap-1.5">
            {typedPeople.map((p) => (
              <Link key={p.id} href={`/people/${p.id}`}>
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: p.color_hex ?? "#C7E6A3" }}
                  title={p.display_name}
                >
                  {p.display_name[0]}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap">
          {[
            { dot: "bg-[#3A3370]", label: "Appointment" },
            { dot: "bg-emerald-500", label: "In Journey" },
            { dot: "bg-purple-400", label: "Step" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${l.dot}`} />
              <span className="text-[10px] text-stone-400 font-medium">{l.label}</span>
            </div>
          ))}
        </div>

        {/* Today */}
        {todayEvents.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#3A3370]">Today</p>
            <div className="space-y-0">
              {todayEvents.map(renderEvent)}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Upcoming</p>
            <div className="space-y-0">
              {upcomingEvents.map(renderEvent)}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🗓️</p>
            <p className="text-sm font-bold text-heading">No upcoming events</p>
            <p className="text-xs text-stone-400 mt-1">Nothing scheduled in the next 6 months</p>
          </div>
        )}

      </div>
    </AppShell>
  );
}
