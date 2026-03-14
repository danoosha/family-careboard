"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/layout/AppShell";
import EmptyState from "@/components/ui/EmptyState";
import AddCareJourneyForm from "@/components/care-journeys/AddCareJourneyForm";
import type { CareJourney, CareJourneyStep, Person } from "@/types";

const STATUS_META: Record<string, { label: string; className: string }> = {
  active:    { label: "Active",    className: "bg-emerald-100 text-emerald-800" },
  paused:    { label: "Paused",    className: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", className: "bg-stone-100 text-stone-500" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-400" },
};

function getNextStep(steps: CareJourneyStep[]): CareJourneyStep | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = steps
    .filter((s) => s.step_date && new Date(s.step_date) >= today)
    .sort((a, b) => new Date(a.step_date!).getTime() - new Date(b.step_date!).getTime());
  return future[0] ?? null;
}

function formatStepDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CareJourneysPage() {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();

  const [journeys, setJourneys] = useState<CareJourney[]>([]);
  const [steps, setSteps] = useState<CareJourneyStep[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingJourney, setAddingJourney] = useState(false);
  const [filterPerson, setFilterPerson] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("active");

  async function load() {
    setLoading(true);
    const [journeysRes, stepsRes, peopleRes] = await Promise.all([
      sb.from("care_journeys").select("*").order("created_at", { ascending: false }),
      sb.from("care_journey_steps").select("*").order("step_date", { ascending: true }),
      sb.from("people").select("id, display_name, color_hex").order("sort_order"),
    ]);
    setJourneys((journeysRes.data as CareJourney[]) ?? []);
    setSteps((stepsRes.data as CareJourneyStep[]) ?? []);
    setPeople((peopleRes.data as Person[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = journeys.filter((j) => {
    if (filterPerson && j.person_id !== filterPerson) return false;
    if (filterStatus && j.status !== filterStatus) return false;
    return true;
  });

  // Sort: active first, then paused, then rest
  const statusOrder: Record<string, number> = { active: 0, paused: 1, completed: 2, cancelled: 3 };
  const sorted = [...filtered].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  function personName(personId: string) {
    return people.find((p) => p.id === personId)?.display_name ?? "";
  }
  function personColor(personId: string) {
    return people.find((p) => p.id === personId)?.color_hex ?? "#E5E7EB";
  }

  return (
    <AppShell>
      <div className="px-4 pt-5 pb-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-heading">Care Journeys</h1>
            <p className="text-sm text-stone-500 mt-0.5">Ongoing health processes for your family</p>
          </div>
          <button type="button" onClick={() => setAddingJourney(true)}
            className="flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full bg-[#3A3370] text-white">
            + New
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-600 outline-none"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-stone-200 bg-white text-stone-600 outline-none"
          >
            <option value="">All people</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <p className="text-sm text-stone-400">Loading…</p>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card">
            <EmptyState icon="📋" title="No journeys found" compact />
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((journey) => {
              const journeySteps = steps.filter((s) => s.care_journey_id === journey.id);
              const nextStep = getNextStep(journeySteps);
              const meta = STATUS_META[journey.status] ?? STATUS_META.active;
              const color = personColor(journey.person_id);

              return (
                <button
                  key={journey.id}
                  type="button"
                  onClick={() => router.push(`/care-journeys/${journey.id}`)}
                  className="w-full text-left bg-white rounded-3xl shadow-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-heading leading-tight">{journey.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-stone-400">{personName(journey.person_id)}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.className}`}>
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-stone-400">{journeySteps.length} step{journeySteps.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-stone-300 text-sm flex-shrink-0 mt-0.5">›</span>
                  </div>

                  {nextStep && (
                    <div className="mt-2.5 ml-4 pl-2.5 border-l-2 border-emerald-200">
                      <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Next step</p>
                      <p className="text-xs text-stone-600 font-medium">{nextStep.title}</p>
                      {nextStep.step_date && (
                        <p className="text-[11px] text-stone-400">{formatStepDate(nextStep.step_date)}</p>
                      )}
                    </div>
                  )}

                  {!nextStep && journey.status === "active" && (
                    <div className="mt-2.5 ml-4">
                      <p className="text-[11px] text-amber-500 font-semibold">No upcoming step</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Journey modal */}
      {addingJourney && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-heading">New care journey</h2>
              <p className="text-sm text-stone-500 mt-1">Start tracking a health process</p>
            </div>
            <AddCareJourneyForm
              onCancel={() => setAddingJourney(false)}
              onSuccess={async () => { setAddingJourney(false); await load(); }}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
