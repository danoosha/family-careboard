import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

type JourneyRow = {
  id: string;
  person_id: string;
  title: string;
  description?: string | null;
  status: string;
  created_at?: string | null;
};

type PersonRow = {
  id: string;
  display_name: string;
  color_hex?: string | null;
};

type StepRow = {
  id: string;
  care_journey_id: string;
  title?: string | null;
  step_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type JourneyCard = JourneyRow & {
  personName: string;
  personColor: string;
  stepsCount: number;
  nextStep: StepRow | null;
};

function getStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "paused":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "completed":
      return "bg-sky-100 text-sky-800 border border-sky-200";
    case "cancelled":
      return "bg-stone-200 text-stone-700 border border-stone-300";
    default:
      return "bg-stone-100 text-stone-700 border border-stone-200";
  }
}

function formatDate(date?: string | null) {
  if (!date) return null;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNextStep(steps: StepRow[]) {
  const now = new Date();

  return (
    steps
      .filter((step) => step.step_date)
      .sort((a, b) => {
        const aTime = a.step_date ? new Date(a.step_date).getTime() : Infinity;
        const bTime = b.step_date ? new Date(b.step_date).getTime() : Infinity;
        return aTime - bTime;
      })
      .find((step) => {
        if (!step.step_date) return false;
        return new Date(step.step_date).getTime() >= now.getTime();
      }) ?? null
  );
}

function sortJourneys(items: JourneyCard[]) {
  const statusPriority: Record<string, number> = {
    active: 0,
    paused: 1,
    completed: 2,
    cancelled: 3,
  };

  return [...items].sort((a, b) => {
    const aPriority = statusPriority[a.status] ?? 99;
    const bPriority = statusPriority[b.status] ?? 99;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    const aNext = a.nextStep?.step_date
      ? new Date(a.nextStep.step_date).getTime()
      : Infinity;
    const bNext = b.nextStep?.step_date
      ? new Date(b.nextStep.step_date).getTime()
      : Infinity;

    if (aNext !== bNext) {
      return aNext - bNext;
    }

    return a.title.localeCompare(b.title);
  });
}

export default async function CareJourneysIndexPage() {
  const supabase = createClient();

  const [journeysRes, peopleRes, stepsRes] = await Promise.all([
    supabase
      .from("care_journeys")
      .select("id, person_id, title, description, status, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("people")
      .select("id, display_name, color_hex")
      .order("sort_order", { ascending: true }),

    supabase
      .from("care_journey_steps")
      .select("id, care_journey_id, title, step_date, notes, created_at")
      .order("step_date", { ascending: true }),
  ]);

  const errorMessage =
    journeysRes.error?.message ||
    peopleRes.error?.message ||
    stepsRes.error?.message ||
    null;

  const journeys = (journeysRes.data as JourneyRow[] | null) ?? [];
  const people = (peopleRes.data as PersonRow[] | null) ?? [];
  const steps = (stepsRes.data as StepRow[] | null) ?? [];

  const peopleMap = new Map(people.map((person) => [person.id, person]));
  const stepsByJourney = new Map<string, StepRow[]>();

  for (const step of steps) {
    const current = stepsByJourney.get(step.care_journey_id) ?? [];
    current.push(step);
    stepsByJourney.set(step.care_journey_id, current);
  }

  const journeyCards = sortJourneys(
    journeys.map((journey) => {
      const person = peopleMap.get(journey.person_id);
      const journeySteps = stepsByJourney.get(journey.id) ?? [];
      const nextStep = getNextStep(journeySteps);

      return {
        ...journey,
        personName: person?.display_name ?? "Unknown person",
        personColor: person?.color_hex ?? "#D6D3D1",
        stepsCount: journeySteps.length,
        nextStep,
      };
    }),
  );

  const activeCount = journeyCards.filter(
    (item) => item.status === "active",
  ).length;
  const pausedCount = journeyCards.filter(
    (item) => item.status === "paused",
  ).length;
  const completedCount = journeyCards.filter(
    (item) => item.status === "completed",
  ).length;

  return (
    <AppShell>
      <div className="min-h-full bg-stone-50">
        <div className="px-4 pt-6 pb-24 max-w-3xl mx-auto">
          <div className="mb-6">
            <p className="text-sm text-stone-500">Care management</p>
            <h1 className="text-2xl font-semibold text-stone-900 mt-1">
              Care Journeys
            </h1>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              A shared view of ongoing care processes across the family.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl bg-white border border-stone-200 p-4">
              <div className="text-xs text-stone-500">Active</div>
              <div className="text-2xl font-semibold text-stone-900 mt-1">
                {activeCount}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-stone-200 p-4">
              <div className="text-xs text-stone-500">Paused</div>
              <div className="text-2xl font-semibold text-stone-900 mt-1">
                {pausedCount}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-stone-200 p-4">
              <div className="text-xs text-stone-500">Completed</div>
              <div className="text-2xl font-semibold text-stone-900 mt-1">
                {completedCount}
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load care journeys: {errorMessage}
            </div>
          ) : journeyCards.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="text-base font-semibold text-stone-900">
                No care journeys yet
              </h2>
              <p className="text-sm text-stone-600 mt-2">
                Once journeys are created, they will appear here with their next
                step and current status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {journeyCards.map((journey) => {
                const nextStepTitle =
                  journey.nextStep?.title || "Upcoming step";

                return (
                  <Link
                    key={journey.id}
                    href={`/care-journeys/${journey.id}`}
                    className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="inline-flex h-3 w-3 rounded-full"
                            style={{ backgroundColor: journey.personColor }}
                          />
                          <span className="text-sm text-stone-600">
                            {journey.personName}
                          </span>
                        </div>

                        <h2 className="text-lg font-semibold text-stone-900 leading-tight">
                          {journey.title}
                        </h2>

                        {journey.description ? (
                          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                            {journey.description}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                          journey.status,
                        )}`}
                      >
                        {getStatusLabel(journey.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      <div className="rounded-xl bg-stone-50 p-3">
                        <div className="text-xs text-stone-500">Steps</div>
                        <div className="text-sm font-medium text-stone-900 mt-1">
                          {journey.stepsCount}
                        </div>
                      </div>

                      <div className="rounded-xl bg-stone-50 p-3 sm:col-span-2">
                        <div className="text-xs text-stone-500">Next step</div>
                        {journey.nextStep ? (
                          <>
                            <div className="text-sm font-medium text-stone-900 mt-1">
                              {nextStepTitle}
                            </div>
                            <div className="text-xs text-stone-600 mt-1">
                              {formatDate(journey.nextStep.step_date)}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-stone-500 mt-1">
                            No upcoming dated step
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
