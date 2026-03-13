import Link from "next/link";
import type { CareJourney } from "@/types";

interface Props {
  journeys: CareJourney[];
}

export default function CareJourneysSection({ journeys }: Props) {
  if (!journeys.length) {
    return <div className="text-sm text-muted">No care journeys yet.</div>;
  }

  return (
    <div className="space-y-3">
      {journeys.map((journey) => (
        <Link
          key={journey.id}
          href={`/care-journeys/${journey.id}`}
          className="block border rounded-xl p-3 hover:bg-surface transition"
        >
          <div className="font-semibold text-sm text-heading">
            {journey.title}
          </div>

          {journey.description && (
            <div className="text-xs text-muted mt-1">{journey.description}</div>
          )}
        </Link>
      ))}
    </div>
  );
}
