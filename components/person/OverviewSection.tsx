import type { Person, PreventiveCheck, Vaccination, CareJourney } from "@/types";

interface OverviewSectionProps {
  person: Person;
  activeJourneys: CareJourney[];
  alertChecks: PreventiveCheck[];
  upcomingVax: Vaccination[];
}

function getPriorityScore(check: any) {
  if (check.status === "overdue") return 1;
  if (check.status === "missing") return 2;
  if (check.status === "to_schedule") return 3;
  if (check.status === "scheduled") return 4;
  if (check.status === "due_soon") return 5;
  if (check.status === "upcoming") return 6;
  if (check.status === "not_due_yet") return 7;
  return 99;
}

function getDateValue(check: any) {
  if (check.scheduled_date) return new Date(check.scheduled_date).getTime();
  if (check.next_due) return new Date(check.next_due).getTime();
  return Number.MAX_SAFE_INTEGER;
}

function getNextAction(
  person: Person,
  alertChecks: PreventiveCheck[],
  upcomingVax: Vaccination[],
  activeJourneys: CareJourney[]
) {
  const sortedChecks = [...alertChecks].sort((a: any, b: any) => {
    const scoreDiff = getPriorityScore(a) - getPriorityScore(b);
    if (scoreDiff !== 0) return scoreDiff;
    return getDateValue(a) - getDateValue(b);
  });

  const firstCheck = sortedChecks[0];
  if (firstCheck) {
    if (firstCheck.status === "missing") {
      return `${firstCheck.check_type} missing`;
    }
    if (firstCheck.status === "to_schedule") {
      return `Schedule ${firstCheck.check_type}`;
    }
    if (firstCheck.status === "scheduled") {
      return `${firstCheck.check_type} scheduled`;
    }
    if (firstCheck.status === "overdue") {
      return `${firstCheck.check_type} overdue`;
    }
    return firstCheck.check_type;
  }

  if (upcomingVax.length > 0) {
    return `${upcomingVax[0].vaccine_name} coming up`;
  }

  if (activeJourneys.length > 0) {
    return activeJourneys[0].title;
  }

  return person.next_action_summary || "No urgent action";
}

function formatCheckStatus(status?: string) {
  switch (status) {
    case "missing":
      return "Missing";
    case "overdue":
      return "Overdue";
    case "to_schedule":
      return "Needs scheduling";
    case "scheduled":
      return "Appointment scheduled";
    case "due_soon":
      return "Due soon";
    case "not_due_yet":
      return "Not due yet";
    case "upcoming":
      return "Upcoming";
    default:
      return status || "";
  }
}

function getCheckStyles(status?: string) {
  switch (status) {
    case "missing":
      return "bg-stone-100 text-stone-700";
    case "overdue":
      return "bg-rose-100 text-rose-800";
    case "to_schedule":
      return "bg-amber-100 text-amber-800";
    case "scheduled":
      return "bg-blue-100 text-blue-800";
    case "due_soon":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function OverviewSection({
  person,
  activeJourneys,
  alertChecks,
  upcomingVax,
}: OverviewSectionProps) {
  const sortedChecks = [...alertChecks].sort((a: any, b: any) => {
    const scoreDiff = getPriorityScore(a) - getPriorityScore(b);
    if (scoreDiff !== 0) return scoreDiff;
    return getDateValue(a) - getDateValue(b);
  });

  const nextAction = getNextAction(
    person,
    sortedChecks,
    upcomingVax,
    activeJourneys
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
          Next action
        </p>
        <p className="text-base text-stone-700">{nextAction}</p>
      </div>

      {sortedChecks.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
            Needs attention
          </p>
          <div className="space-y-2">
            {sortedChecks.map((check: any) => (
              <div
                key={check.id}
                className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 ${getCheckStyles(
                  check.status
                )}`}
              >
                <span className="text-sm font-medium">{check.check_type}</span>
                <span className="text-xs font-semibold whitespace-nowrap">
                  {formatCheckStatus(check.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingVax.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
            Upcoming vaccinations
          </p>
          <div className="space-y-2">
            {upcomingVax.map((vax) => (
              <div
                key={vax.id}
                className="px-3 py-2 rounded-xl bg-blue-100 text-blue-900"
              >
                <span className="text-sm font-medium">{vax.vaccine_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeJourneys.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
            Active care
          </p>
          <div className="space-y-2">
            {activeJourneys.map((journey) => (
              <div
                key={journey.id}
                className="px-3 py-2 rounded-xl bg-green-100 text-green-900"
              >
                <span className="text-sm font-medium">{journey.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}