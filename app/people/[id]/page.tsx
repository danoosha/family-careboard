import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PersonHeader from "@/components/person/PersonHeader";
import ProfileSection from "@/components/person/ProfileSection";
import OverviewSection from "@/components/person/OverviewSection";
import TimelineSection from "@/components/person/TimelineSection";
import CareJourneysSection from "@/components/person/CareJourneysSection";
import DoctorsSection from "@/components/person/DoctorsSection";
import PreventiveSection from "@/components/person/PreventiveSection";
import MedicationsSection from "@/components/person/MedicationsSection";
import PrescriptionsSection from "@/components/person/PrescriptionsSection";
import ReferralsSection from "@/components/person/ReferralsSection";
import TestResultsSection from "@/components/person/TestResultsSection";
import DocumentsSection from "@/components/person/DocumentsSection";
import type {
  Person,
  Appointment,
  PreventiveCheck,
  Vaccination,
  PersonDoctor,
  Medication,
  Prescription,
  Referral,
  TestResult,
  Document,
} from "@/types";

export const revalidate = 0;

type CareJourneyRow = {
  id: string;
  person_id: string;
  title: string;
  description?: string | null;
  status: string;
  created_at?: string | null;
};

type CareJourneyStepRow = {
  id: string;
  care_journey_id: string;
  title?: string | null;
  step_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type CareJourneyWithSteps = CareJourneyRow & {
  steps: CareJourneyStepRow[];
  nextStep: CareJourneyStepRow | null;
};

interface PersonPageProps {
  params: { id: string };
}

function getNextStep(steps: CareJourneyStepRow[]) {
  const now = new Date();

  return (
    [...steps]
      .filter((step) => step.step_date)
      .sort((a, b) => {
        const aTime = a.step_date ? new Date(a.step_date).getTime() : Infinity;
        const bTime = b.step_date ? new Date(b.step_date).getTime() : Infinity;
        return aTime - bTime;
      })
      .find((step) => {
        if (!step.step_date) return false;
        return new Date(step.step_date).getTime() >= now.getTime();
      }) ?? null
  );
}

export default async function PersonPage({ params }: PersonPageProps) {
  const supabase = createClient();
  const id = params.id;

  const [
    { data: person, error: personError },
    { data: appointments },
    { data: preventiveChecks },
    { data: vaccinations },
    { data: journeys },
    { data: personDoctors },
    { data: medications },
    { data: prescriptions },
    { data: referrals },
    { data: testResults },
    { data: documents },
  ] = await Promise.all([
    supabase.from("people").select("*").eq("id", id).single(),

    supabase
      .from("appointments")
      .select("*")
      .eq("person_id", id)
      .order("starts_at", { ascending: true }),

    supabase
      .from("preventive_checks")
      .select("*")
      .eq("person_id", id)
      .order("check_type", { ascending: true }),

    supabase
      .from("vaccinations")
      .select("*")
      .eq("person_id", id)
      .order("vaccine_name", { ascending: true }),

    supabase
      .from("care_journeys")
      .select("id, person_id, title, description, status, created_at")
      .eq("person_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("person_doctors")
      .select("*, doctor:doctors(*)")
      .eq("person_id", id),

    supabase
      .from("medications")
      .select("*")
      .eq("person_id", id)
      .order("medication_name", { ascending: true }),

    supabase
      .from("prescriptions")
      .select("*")
      .eq("person_id", id)
      .order("issued_at", { ascending: false }),

    supabase
      .from("referrals")
      .select("*")
      .eq("person_id", id)
      .order("issued_at", { ascending: false }),

    supabase
      .from("test_results")
      .select("*")
      .eq("person_id", id)
      .order("taken_at", { ascending: false }),

    supabase
      .from("documents")
      .select("*")
      .eq("person_id", id)
      .order("uploaded_at", { ascending: false }),
  ]);

  if (personError || !person) {
    notFound();
  }

  const { data: journeySteps } =
    journeys && journeys.length > 0
      ? await supabase
          .from("care_journey_steps")
          .select("id, care_journey_id, title, step_date, notes, created_at")
          .in(
            "care_journey_id",
            journeys.map((journey) => journey.id),
          )
          .order("step_date", { ascending: true })
      : { data: [] };

  const typedPerson = person as Person;
  const typedAppts = (appointments as Appointment[]) ?? [];
  const typedChecks = (preventiveChecks as PreventiveCheck[]) ?? [];
  const typedVax = (vaccinations as Vaccination[]) ?? [];
  const typedDoctors = (personDoctors as PersonDoctor[]) ?? [];
  const typedMeds = (medications as Medication[]) ?? [];
  const typedRx = (prescriptions as Prescription[]) ?? [];
  const typedReferrals = (referrals as Referral[]) ?? [];
  const typedResults = (testResults as TestResult[]) ?? [];
  const typedDocs = (documents as Document[]) ?? [];
  const typedJourneys = (journeys as CareJourneyRow[]) ?? [];
  const typedSteps = (journeySteps as CareJourneyStepRow[]) ?? [];

  const journeysWithSteps: CareJourneyWithSteps[] = typedJourneys.map(
    (journey) => {
      const stepsForJourney = typedSteps.filter(
        (step) => step.care_journey_id === journey.id,
      );

      return {
        ...journey,
        steps: stepsForJourney,
        nextStep: getNextStep(stepsForJourney),
      };
    },
  );

  const activeJourneys = typedJourneys.filter((j) => j.status === "active");

  const alertChecks = typedChecks.filter((c) =>
    ["overdue", "missing", "due_soon"].includes(c.status ?? ""),
  );

  const upcomingVax = typedVax.filter((v) => {
    if (!v.next_due_at) return false;
    const days = Math.ceil(
      (new Date(v.next_due_at).getTime() - Date.now()) / 86400000,
    );
    return days >= 0 && days <= 90;
  });

  const timelineCount =
    typedAppts.length +
    typedChecks.filter((c) => !!c.next_due_at).length +
    typedVax.filter((v) => !!v.next_due_at).length;

  return (
    <AppShell>
      <div>
        <PersonHeader person={typedPerson} />

        <div className="px-4 pt-5 pb-6 space-y-4">
          <ProfileSection title="Overview" icon="✨" defaultOpen>
            <OverviewSection
              person={typedPerson}
              activeJourneys={activeJourneys}
              alertChecks={alertChecks}
              upcomingVax={upcomingVax}
            />
          </ProfileSection>

          <ProfileSection
            title="Timeline"
            icon="🗓️"
            count={timelineCount}
            defaultOpen
          >
            <TimelineSection
              person={typedPerson}
              appointments={typedAppts}
              preventiveChecks={typedChecks}
              vaccinations={typedVax}
              careSteps={typedSteps}
            />
          </ProfileSection>

          <ProfileSection
            title="Care Journeys"
            icon="📋"
            count={journeysWithSteps.length}
          >
            <CareJourneysSection journeys={journeysWithSteps} />
          </ProfileSection>

          <ProfileSection title="Doctors" icon="🩺" count={typedDoctors.length}>
            <DoctorsSection personDoctors={typedDoctors} />
          </ProfileSection>

          <ProfileSection
            title="Preventive Care"
            icon="🔔"
            count={typedChecks.length}
          >
            <PreventiveSection checks={typedChecks} />
          </ProfileSection>

          <ProfileSection
            title="Medications"
            icon="💊"
            count={typedMeds.length}
          >
            <MedicationsSection medications={typedMeds} />
          </ProfileSection>

          <ProfileSection
            title="Prescriptions"
            icon="📄"
            count={typedRx.length}
          >
            <PrescriptionsSection prescriptions={typedRx} />
          </ProfileSection>

          <ProfileSection
            title="Referrals"
            icon="📨"
            count={typedReferrals.length}
          >
            <ReferralsSection referrals={typedReferrals} />
          </ProfileSection>

          <ProfileSection
            title="Test Results"
            icon="🧪"
            count={typedResults.length}
          >
            <TestResultsSection results={typedResults} />
          </ProfileSection>

          <ProfileSection title="Documents" icon="📁" count={typedDocs.length}>
            <DocumentsSection documents={typedDocs} />
          </ProfileSection>
        </div>
      </div>
    </AppShell>
  );
}
