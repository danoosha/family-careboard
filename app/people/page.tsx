import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import type { Person } from "@/types";

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

export default async function PeoplePage() {
  const supabase = createClient();

  const { data: people } = await supabase
    .from("people")
    .select("*")
    .order("sort_order");

  const typedPeople = (people as Person[]) ?? [];

  return (
    <AppShell>
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-extrabold text-heading mb-6">People</h1>

        <div className="space-y-3">
          {typedPeople.map((person) => {
            const bg = hexToRgba(person.color_hex, 0.18);
            const border = hexToRgba(person.color_hex, 0.35);
            const accent = darken(person.color_hex, 0.25);

            return (
              <Link key={person.id} href={`/people/${person.id}`}>
                <div
                  className="flex items-center gap-4 p-4 rounded-3xl shadow-card"
                  style={{
                    backgroundColor: bg,
                    border: `1px solid ${border}`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-extrabold flex-shrink-0"
                    style={{
                      backgroundColor: person.color_hex,
                      color: accent,
                    }}
                  >
                    {person.display_name[0]}
                  </div>

                  <div>
                    <p className="font-bold text-heading">{person.display_name}</p>

                    {person.status_summary && (
                      <p className="text-sm text-muted mt-0.5 line-clamp-1">
                        {person.status_summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}