import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import PersonCard from "@/components/dashboard/PersonCard";
import FamilyTimeline from "@/components/dashboard/FamilyTimeline";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  buildAlerts,
  buildTimelineEvents,
} from "@/lib/dashboard";
import type {
  Person,
  Appointment,
  PreventiveCheck,
  Vaccination,
} from "@/types";

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createClient();

  const [
    { data: people },
    { data: appointments },
    { data: preventiveChecks },
    { data: vaccinations },
    { data: careSteps },
  ] = await Promise.all([
    supabase.from("people").select("*").order("sort_order"),

    // IMPORTANT: no future-only filter here
    supabase
      .from("appointments")
      .select("*")
      .order("starts_at", { ascending: true }),

    supabase
      .from("preventive_checks")
      .select("*")
      .order("next_due", { ascending: true }),

    supabase
      .from("vaccinations")
      .select("*")
      .order("next_due", { ascending: true }),

    supabase
      .from("care_journey_steps")
      .select("*")
      .order("step_date", { ascending: true }),
  ]);

  const typedPeople = (people as Person[]) ?? [];
  const typedAppointments = (appointments as Appointment[]) ?? [];
  const typedChecks = (preventiveChecks as PreventiveCheck[]) ?? [];
  const typedVaccinations = (vaccinations as Vaccination[]) ?? [];
  const typedCareSteps = (careSteps as any[]) ?? [];

  const timelineEvents = buildTimelineEvents(
    typedPeople,
    typedAppointments,
    typedChecks,
    typedVaccinations,
    typedCareSteps
  );

  return (
    <AppShell>
      <div className="px-4 pt-8 pb-4 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-1">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="text-2xl font-extrabold text-heading">
            Family Overview
          </h1>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            Family Members
          </h2>

          {typedPeople.length === 0 ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            typedPeople.map((person) => {
              const nextAppt =
                typedAppointments
                  .filter((a) => a.person_id === person.id)
                  .filter((a) => new Date(a.starts_at).getTime() >= Date.now())
                  .sort(
                    (a, b) =>
                      new Date(a.starts_at).getTime() -
                      new Date(b.starts_at).getTime()
                  )[0] ?? null;

              const personChecks = typedChecks.filter(
                (c) => c.person_id === person.id
              );

              const alerts = buildAlerts(personChecks);

              return (
                <PersonCard
                  key={person.id}
                  person={person}
                  nextAppointment={nextAppt}
                  alerts={alerts}
                />
              );
            })
          )}
        </section>

        <section>
          <FamilyTimeline events={timelineEvents} />
        </section>
      </div>
    </AppShell>
  );
}