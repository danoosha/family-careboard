import type {
  Person,
  Appointment,
  PreventiveCheck,
  Vaccination,
  HealthAlert,
} from "@/types";
import { differenceInDays } from "date-fns";

export function buildAlerts(checks: PreventiveCheck[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];

  for (const check of checks) {
    if (check.status === "overdue") {
      alerts.push({
        type: "warning",
        message: `${check.check_type} is overdue`,
        person_id: check.person_id,
      });
    } else if (check.status === "missing") {
      alerts.push({
        type: "info",
        message: `${check.check_type} has no record`,
        person_id: check.person_id,
      });
    } else if (check.status === "due_soon") {
      alerts.push({
        type: "info",
        message: `${check.check_type} coming up`,
        person_id: check.person_id,
      });
    }
  }

  return alerts;
}

export function buildSuggestions(
  checks: PreventiveCheck[],
  vaccinations: Vaccination[]
) {
  const suggestions: { id: string; label: string }[] = [];

  for (const check of checks) {
    const due = (check as any).next_due;
    if (!due) continue;

    const days = differenceInDays(new Date(due), new Date());

    if (days >= 0 && days <= 60) {
      suggestions.push({
        id: `prev-${check.id}`,
        label: `Schedule ${check.check_type} in the next ${days} days`,
      });
    }
  }

  for (const vax of vaccinations) {
    const due = (vax as any).next_due;
    if (!due) continue;

    const days = differenceInDays(new Date(due), new Date());

    if (days >= 0 && days <= 90) {
      suggestions.push({
        id: `vax-${vax.id}`,
        label: `${(vax as any).vaccine_name || (vax as any).name} vaccination due in ${days} days`,
      });
    }
  }

  return suggestions.slice(0, 3);
}

export function buildTimelineEvents(
  people: Person[],
  appointments: Appointment[],
  preventiveChecks: PreventiveCheck[],
  vaccinations: Vaccination[],
  careSteps: any[] = []
): any[] {
  const events: any[] = [];
  const personMap = Object.fromEntries(people.map((p) => [p.id, p]));

  // Real appointments
  for (const appt of appointments) {
    const person = personMap[appt.person_id];
    if (!person || !appt.starts_at) continue;

    events.push({
      id: `appt-${appt.id}`,
      type: "appointment",
      title: appt.title,
      date: appt.starts_at,
      person_id: appt.person_id,
      person_name: person.display_name,
      person_color: person.color_hex,
      description: appt.location ?? appt.notes ?? "",
    });
  }

  // Preventive checks only when they are real timed events
  for (const check of preventiveChecks) {
    const person = personMap[check.person_id];
    if (!person) continue;

    const status = (check as any).status;
    const scheduledDate = (check as any).scheduled_date;
    const doneDate = (check as any).last_date;

    if (status === "scheduled" && scheduledDate) {
      events.push({
        id: `prev-scheduled-${check.id}`,
        type: "preventive",
        title: check.check_type,
        date: scheduledDate,
        person_id: check.person_id,
        person_name: person.display_name,
        person_color: person.color_hex,
        description: check.notes ?? "Preventive care appointment",
      });
    }

    if (status === "done" && doneDate) {
      events.push({
        id: `prev-done-${check.id}`,
        type: "preventive",
        title: `${check.check_type} completed`,
        date: doneDate,
        person_id: check.person_id,
        person_name: person.display_name,
        person_color: person.color_hex,
        description: check.notes ?? "Completed preventive care",
      });
    }
  }

  // Care journey steps
  for (const step of careSteps ?? []) {
    const person = personMap[step.person_id];
    if (!person || !(step as any).step_date) continue;

    events.push({
      id: `step-${step.id}`,
      type: "care_step",
      title: (step as any).title || (step as any).step_title || "Care step",
      date: (step as any).step_date,
      person_id: step.person_id,
      person_name: person.display_name,
      person_color: person.color_hex,
      description: (step as any).notes || "",
    });
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}