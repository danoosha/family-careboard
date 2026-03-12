"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, AlertTriangle, Calendar } from "lucide-react";
import type { Person, Appointment, HealthAlert } from "@/types";

interface PersonCardProps {
  person: Person;
  nextAppointment?: Appointment | null;
  alerts?: HealthAlert[];
}

function hexToRgba(hex: string, opacity: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function darken(hex: string, amount: number) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function getRelativeDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function PersonCard({
  person,
  nextAppointment,
  alerts = [],
}: PersonCardProps) {
  const router = useRouter();

  const bg = hexToRgba(person.color_hex, 0.22);
  const border = hexToRgba(person.color_hex, 0.45);
  const accent = darken(person.color_hex, 0.25);

  return (
    <div
      onClick={() => router.push(`/people/${person.id}`)}
      className="rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: person.color_hex,
                color: accent,
              }}
            >
              {person.display_name?.[0] ?? "?"}
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-stone-800 text-base leading-tight">
                {person.display_name}
              </h3>

              {person.status_summary && (
                <p className="text-sm text-stone-600 mt-0.5 leading-relaxed">
                  {person.status_summary}
                </p>
              )}
            </div>
          </div>

          {person.next_action_summary && (
            <p className="text-sm text-stone-700 mt-3">
              {person.next_action_summary}
            </p>
          )}

          {nextAppointment && (
            <div className="flex items-center gap-1.5 mt-3">
              <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="text-xs text-stone-600">
                <strong>{getRelativeDate(nextAppointment.starts_at)}</strong>
                {" · "}
                {nextAppointment.title}
              </span>
            </div>
          )}

          {alerts.length > 0 && (
            <div className="mt-3 space-y-2">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-xl bg-white/55 px-3 py-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-stone-700 leading-relaxed">
                    {alert.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-stone-400 mt-1 shrink-0" />
      </div>
    </div>
  );
}