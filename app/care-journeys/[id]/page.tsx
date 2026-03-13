import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import AddStepForm from "@/components/care-journeys/AddStepForm";

export const revalidate = 0;

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const journeyId = params.id;

  const { data: journey } = await supabase
    .from("care_journeys")
    .select("*")
    .eq("id", journeyId)
    .single();

  if (!journey) notFound();

  const { data: steps } = await supabase
    .from("care_journey_steps")
    .select("*")
    .eq("care_journey_id", journeyId)
    .order("step_date", { ascending: true });

  return (
    <AppShell>
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">
            {journey.title}
          </h1>

          {journey.description && (
            <p className="text-sm text-stone-600 mt-2">{journey.description}</p>
          )}

          <div className="flex gap-2 mt-4">
            <Link
              href={`/people/${journey.person_id}?add=appointment&journey=${journey.id}`}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              Add appointment
            </Link>
          </div>
        </div>

        <AddStepForm journeyId={journey.id} />

        <div className="space-y-4 border-l pl-4">
          {steps?.map((step) => (
            <div
              key={step.id}
              className="relative bg-white rounded-xl border p-4"
            >
              <div className="absolute -left-3 top-4 w-3 h-3 bg-indigo-500 rounded-full" />

              <div className="text-sm font-semibold text-heading">
                {step.title || step.step_title}
              </div>

              {step.step_date && (
                <div className="text-xs text-muted mt-1">
                  {new Date(step.step_date).toLocaleDateString()}
                </div>
              )}

              {step.notes && (
                <div className="text-sm text-stone-600 mt-2">{step.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
