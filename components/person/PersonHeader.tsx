"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Person } from "@/types";

interface PersonHeaderProps {
  person: Person;
}

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function darken(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  const r = Math.max(0, Math.floor(parseInt(clean.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(parseInt(clean.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.floor(parseInt(clean.slice(4, 6), 16) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function PersonHeader({ person }: PersonHeaderProps) {
  const router = useRouter();

  const bg = hexToRgba(person.color_hex, 0.22);
  const border = hexToRgba(person.color_hex, 0.4);
  const accent = darken(person.color_hex, 0.25);

  return (
    <div
      className="rounded-b-3xl px-4 pt-6 pb-6 border-b"
      style={{
        backgroundColor: bg,
        borderColor: border,
      }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-stone-700"
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-extrabold"
          style={{
            backgroundColor: person.color_hex,
            color: accent,
          }}
        >
          {person.display_name?.[0] ?? "?"}
        </div>

        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-stone-900 leading-tight">
            {person.display_name}
          </h1>

          {person.status_summary && (
            <p className="mt-1 text-base text-stone-700">
              {person.status_summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}