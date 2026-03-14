import Link from "next/link";
import type { CareJourney, CareJourneyStep } from "@/types";

const STATUS_META: Record<string, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-100 text-emerald-800" },
  paused:    { label: "Paused",    className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", className: "bg-stone-100 text-stone-500" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-400" },
};

function getNextStep(steps: CareJourneyStep[], journeyId: string): CareJourneyStep | null {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return steps
    .filter((s) => s.care_journey_id === journeyId && s.step_date && new Date(s.step_date) >= today)
    .sort((a, b) => new Date(a.step_date!).getTime() - new Date(b.step_date!).getTime())[0] ?? null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface Props {
  journeys: CareJourney[];
  steps: CareJourneyStep[];
  personColorHex: string;
}

export default function CareJourneysSection({ journeys, steps, personColorHex }: Props) {
  if (journeys.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card px-4 py-5 text-center">
        <p className="text-sm text-stone-400">No care journeys yet</p>
      </div>
    );
  }

  const statusOrder: Record<string, number> = { active: 0, paused: 1, completed: 2, cancelled: 3 };
  const sorted = [...journeys].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  return (
    <div className="space-y-2">
      {sorted.map((journey) => {
        const meta = STATUS_META[journey.status] ?? STATUS_META.active;
        const nextStep = getNextStep(steps, journey.id);
        const journeyStepCount = steps.filter((s) => s.care_journey_id === journey.id).length;
        const needsAttention = journey.status === "active" && !nextStep;

        return (
          <Link
            key={journey.id}
            href={`/care-journeys/${journey.id}`}
            className="block bg-white rounded-3xl shadow-card p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: personColorHex }} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-heading leading-tight">{journey.title}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.className}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {journeyStepCount} step{journeyStepCount !== 1 ? "s" : ""}
                    </span>
                    {needsAttention && (
                      <span className="text-[11px] font-semibold text-amber-500">· No next step</span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-stone-300 text-sm flex-shrink-0 mt-0.5">›</span>
            </div>

            {nextStep && (
              <div className="mt-2.5 ml-4 pl-2.5 border-l-2 border-emerald-200">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Next</p>
                <p className="text-xs font-medium text-stone-700">{nextStep.title}</p>
                {nextStep.step_date && (
                  <p className="text-[11px] text-stone-400">{formatDate(nextStep.step_date)}</p>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
