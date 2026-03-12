import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/dates";
import { ExternalLink } from "lucide-react";
import type { TestResult } from "@/types";

interface TestResultsSectionProps {
  results: TestResult[];
}

export default function TestResultsSection({ results }: TestResultsSectionProps) {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card">
        <EmptyState icon="🧪" title="No test results" compact />
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => {
    const da = a.test_date ? new Date(a.test_date).getTime() : 0;
    const db = b.test_date ? new Date(b.test_date).getTime() : 0;
    return db - da;
  });

  return (
    <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
      {sorted.map((result) => (
        <div key={result.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-heading leading-tight">
                {result.title}
              </p>
              {result.test_date && (
                <p className="text-xs text-muted mt-0.5">
                  {formatDate(result.test_date)}
                </p>
              )}
              {result.result_summary && (
                <p className="text-sm text-body mt-1.5 leading-relaxed">
                  {result.result_summary}
                </p>
              )}
              {result.notes && (
                <p className="text-xs text-muted mt-1 italic">{result.notes}</p>
              )}
            </div>

            {result.drive_url && (
              <a
                href={result.drive_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold text-[#3A3370] px-2.5 py-1.5 rounded-xl bg-[#EAE8F7] flex-shrink-0"
              >
                <ExternalLink size={12} />
                <span>Open</span>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
