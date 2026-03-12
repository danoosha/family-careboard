import EmptyState from "@/components/ui/EmptyState";
import type { PreventiveCheck } from "@/types";

interface PreventiveSectionProps {
  checks: PreventiveCheck[];
}

function formatStatus(status?: string) {
  switch (status) {
    case "to_schedule":
      return "Needs scheduling";
    case "scheduled":
      return "Appointment scheduled";
    case "done":
      return "Completed";
    case "overdue":
      return "Overdue";
    case "missing":
      return "Missing";
    case "due_soon":
      return "Due soon";
    case "not_due_yet":
      return "Not due yet";
    case "upcoming":
      return "Upcoming";
    default:
      return status ? status.replaceAll("_", " ") : "";
  }
}

function getStatusStyles(status?: string) {
  switch (status) {
    case "to_schedule":
      return "bg-amber-100 text-amber-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "done":
      return "bg-emerald-100 text-emerald-800";
    case "overdue":
      return "bg-rose-100 text-rose-800";
    case "missing":
      return "bg-stone-200 text-stone-700";
    case "due_soon":
      return "bg-amber-100 text-amber-800";
    case "not_due_yet":
      return "bg-slate-100 text-slate-600";
    case "upcoming":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getEffectiveDate(check: any) {
  if (check.scheduled_date) {
    return new Date(check.scheduled_date).getTime();
  }
  if (check.next_due) {
    return new Date(check.next_due).getTime();
  }
  return Number.MAX_SAFE_INTEGER;
}

function formatSmartDate(check: any) {
  const scheduledDate = check.scheduled_date;
  const dueDate = check.next_due;

  if (scheduledDate) {
    const d = new Date(scheduledDate);
    return `Scheduled ${d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }

  if (!dueDate) return null;

  const d = new Date(dueDate);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.round(diffDays / 30);

  if (diffDays < 0) {
    return `Recommended since ${d.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    })}`;
  }

  if (diffDays <= 45) {
    return `Due in ${diffDays} days`;
  }

  if (diffMonths <= 12) {
    return `Due in ${diffMonths} months`;
  }

  return `Due ${d.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  })}`;
}

function formatSubtitle(check: any) {
  if (check.notes) return check.notes;

  if (check.status === "to_schedule") {
    return "Recommended date reached, appointment still needs to be booked";
  }

  if (check.status === "scheduled") {
    return "Appointment already booked";
  }

  if (check.status === "not_due_yet") {
    return "Planned for a later age or stage";
  }

  return null;
}

export default function PreventiveSection({ checks }: PreventiveSectionProps) {
  if (!checks || checks.length === 0) {
    return <EmptyState icon="🔔" title="No preventive checks yet" compact />;
  }

  const sortedChecks = [...checks].sort((a: any, b: any) => {
    return getEffectiveDate(a) - getEffectiveDate(b);
  });

  return (
    <div className="space-y-3">
      {sortedChecks.map((check: any) => {
        const smartDate = formatSmartDate(check);
        const subtitle = formatSubtitle(check);

        return (
          <div
            key={check.id}
            className="bg-white rounded-3xl shadow-card px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-heading leading-tight">
                  {check.check_type}
                </p>

                {smartDate && (
                  <p className="text-sm text-stone-600 mt-1">{smartDate}</p>
                )}

                {subtitle && (
                  <p className="text-xs text-stone-500 mt-1 italic leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${getStatusStyles(
                  check.status
                )}`}
              >
                {formatStatus(check.status)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}