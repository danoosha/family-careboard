import TimelineItem from "@/components/dashboard/TimelineItem";
import type { TimelineEvent } from "@/types";

interface FamilyTimelineProps {
  events: TimelineEvent[];
}

function normalizeDate(raw: any) {
  const value = raw?.date || raw?.event_date || raw?.starts_at || null;
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatDateLabel(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

  const sameYear = date.getFullYear() === now.getFullYear();

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function splitEvents(events: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const past: any[] = [];
  const todayEvents: any[] = [];
  const upcoming: any[] = [];

  for (const event of events) {
    const date = normalizeDate(event);
    if (!date) continue;

    if (date.getTime() < today.getTime()) {
      past.push({ ...event, _normalizedDate: date });
    } else if (date.getTime() === today.getTime()) {
      todayEvents.push({ ...event, _normalizedDate: date });
    } else {
      upcoming.push({ ...event, _normalizedDate: date });
    }
  }

  const sorter = (a: any, b: any) =>
    a._normalizedDate.getTime() - b._normalizedDate.getTime();

  return {
    past: past.sort(sorter),
    today: todayEvents.sort(sorter),
    upcoming: upcoming.sort(sorter),
  };
}

function Section({
  title,
  events,
}: {
  title: string;
  events: any[];
}) {
  if (events.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
        {title}
      </p>

      <div className="bg-white rounded-3xl shadow-card p-4">
        <div className="space-y-1">
          {events.map((event) => (
            <TimelineItem
              key={event.id}
              title={event.title}
              dateLabel={formatDateLabel(event._normalizedDate)}
              personName={event.person_name}
              personColor={event.person_color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FamilyTimeline({ events }: FamilyTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card p-6 text-center text-sm text-stone-500">
        No family events
      </div>
    );
  }

  const { past, today, upcoming } = splitEvents(events as any[]);

  return (
    <div className="space-y-4">
      <Section title="Today" events={today} />
      <Section title="Upcoming" events={upcoming} />
      <Section title="Past" events={[...past].reverse().slice(0, 8)} />
    </div>
  );
}