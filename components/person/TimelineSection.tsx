import EmptyState from "@/components/ui/EmptyState";
import type {
  Person,
  Appointment,
  PreventiveCheck,
  Vaccination,
  CareJourneyStep,
} from "@/types";

interface TimelineSectionProps {
  person: Person;
  appointments: Appointment[];
  preventiveChecks: PreventiveCheck[];
  vaccinations: Vaccination[];
  careSteps: CareJourneyStep[];
}

type PersonTimelineItem = {
  id: string;
  title: string;
  date: string;
  subtitle?: string;
  kind: "appointment" | "preventive" | "care_step";
};

function getTimelineItems({
  appointments,
  preventiveChecks,
  careSteps,
}: Omit<TimelineSectionProps, "person" | "vaccinations">): PersonTimelineItem[] {
  const items: PersonTimelineItem[] = [];

  for (const appt of appointments ?? []) {
    if (!appt.starts_at) continue;

    items.push({
      id: `appt-${appt.id}`,
      title: appt.title || "Appointment",
      date: appt.starts_at,
      subtitle: appt.location || appt.notes || "",
      kind: "appointment",
    });
  }

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

  for (const step of careSteps ?? []) {
    if (!(step as any).step_date) continue;

    items.push({
      id: `step-${step.id}`,
      title: (step as any).title || (step as any).step_title || "Care step",
      date: (step as any).step_date,
      subtitle: (step as any).notes || "",
      kind: "care_step",
    });
  }

  return items.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

function formatDateLabel(rawDate: string) {
  const d = new Date(rawDate);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getKindLabel(kind: PersonTimelineItem["kind"]) {
  switch (kind) {
    case "appointment":
      return "Appointment";
    case "preventive":
      return "Preventive care";
    case "care_step":
      return "Care step";
    default:
      return "";
  }
}

function getDotColor(kind: PersonTimelineItem["kind"], colorHex: string) {
  switch (kind) {
    case "appointment":
      return colorHex;
    case "preventive":
      return "#F0C36A";
    case "care_step":
      return "#8BC48A";
    default:
      return colorHex;
  }
}

export default function TimelineSection({
  person,
  appointments,
  preventiveChecks,
  vaccinations,
  careSteps,
}: TimelineSectionProps) {
  const items = getTimelineItems({
    appointments,
    preventiveChecks,
    careSteps,
  });

  if (items.length === 0) {
    return <EmptyState icon="🗓️" title="No upcoming events" compact />;
  }

  return (
    <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
      {items.map((item) => (
        <div key={item.id} className="px-4 py-3 flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
            style={{
              backgroundColor: getDotColor(item.kind, person.color_hex),
            }}
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-heading leading-tight">
              {item.title}
            </p>

            <p className="text-xs text-stone-500 mt-0.5">
              {getKindLabel(item.kind)}
            </p>

            {item.subtitle && (
              <p className="text-xs text-stone-500 mt-1 italic leading-relaxed">
                {item.subtitle}
              </p>
            )}
          </div>

          <div className="text-xs text-stone-500 whitespace-nowrap">
            {formatDateLabel(item.date)}
          </div>
        </div>
      ))}
    </div>
  );
}