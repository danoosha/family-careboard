import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/dates";
import type { CareJourney, CareJourneyStep } from "@/types";

interface CareJourneysSectionProps {
  journeys: (CareJourney & { steps?: CareJourneyStep[] })[];
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100    text-gray-500",
  paused:    "bg-amber-100   text-amber-700",
};

const STEP_STYLES: Record<string, string> = {
  done:    "text-emerald-600",
  pending: "text-muted",
  skipped: "text-gray-400 line-through",
};

const STEP_ICONS: Record<string, string> = {
  done:    "✓",
  pending: "○",
  skipped: "–",
};

export default function CareJourneysSection({ journeys }: CareJourneysSectionProps) {
  if (journeys.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card">
        <EmptyState icon="📋" title="No care journeys" compact />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {journeys.map((journey) => (
        <div key={journey.id} className="bg-white rounded-3xl shadow-card p-4">
          {/* Journey header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-heading leading-tight">{journey.title}</p>
              {journey.description && (
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  {journey.description}
                </p>
              )}
              {journey.started_at && (
                <p className="text-xs text-muted mt-1">
                  Started {formatDate(journey.started_at)}
                </p>
              )}
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 capitalize ${
                STATUS_STYLES[journey.status] ?? "bg-gray-100 text-gray-500"
              }`}
            >
              {journey.status}
            </span>
          </div>

          {/* Steps */}
          {journey.steps && journey.steps.length > 0 && (
            <div className="space-y-2 border-t border-border pt-3">
              {journey.steps.map((step) => (
                <div key={step.id} className="flex items-start gap-2.5">
                  <span
                    className={`text-sm font-bold mt-0.5 w-4 flex-shrink-0 ${
                      STEP_STYLES[step.status] ?? "text-muted"
                    }`}
                  >
                    {STEP_ICONS[step.status] ?? "○"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        step.status === "skipped"
                          ? "text-gray-400 line-through"
                          : "text-body"
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.step_date && (
                      <p className="text-xs text-muted">{formatDate(step.step_date)}</p>
                    )}
                    {step.notes && (
                      <p className="text-xs text-muted mt-0.5 italic">{step.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
