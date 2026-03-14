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
  Person, Appointment, PreventiveCheck, Vaccination,
  CareJourney, CareJourneyStep, PersonDoctor, Medication,
  Prescription, Referral, TestResult, Document,
} from "@/types";

export const revalidate = 0;

interface PersonPageProps {
  params: { id: string };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const supabase = createClient();
  const { id } = params;

  const [
    { data: person, error: personError },
    { data: appointments },
    { data: preventiveChecks },
    { data: vaccinations },
    { data: journeys },
    { data: journeySteps },
    { data: personDoctors },
    { data: allDoctors },
    { data: medications },
    { data: prescriptions },
    { data: referrals },
    { data: testResults },
    { data: documents },
  ] = await Promise.all([
    supabase.from("people").select("*").eq("id", id).single(),
    supabase.from("appointments").select("*").eq("person_id", id).order("starts_at", { ascending: true }),
    supabase.from("preventive_checks").select("*").eq("person_id", id).order("check_type", { ascending: true }),
    supabase.from("vaccinations").select("*").eq("person_id", id).order("vaccine_name", { ascending: true }),
    supabase.from("care_journeys").select("*").eq("person_id", id).order("created_at", { ascending: false }),
    supabase.from("care_journey_steps").select("*").eq("person_id", id).order("step_date", { ascending: true }),
    supabase.from("person_doctors").select("*, doctor:doctors(*)").eq("person_id", id),
    supabase.from("doctors").select("id, doctor_name, specialty"),
    supabase.from("medications").select("*").eq("person_id", id).order("medication_name", { ascending: true }),
    supabase.from("prescriptions").select("*").eq("person_id", id).order("issued_at", { ascending: false }),
    supabase.from("referrals").select("*").eq("person_id", id).order("referral_date", { ascending: false }),
    supabase.from("test_results").select("*").eq("person_id", id).order("test_date", { ascending: false }),
    supabase.from("documents").select("*").eq("person_id", id).order("document_date", { ascending: false }),
  ]);

  if (personError || !person) notFound();

  const typedPerson = person as Person;
  const typedAppts = (appointments as Appointment[]) ?? [];
  const typedChecks = (preventiveChecks as PreventiveCheck[]) ?? [];
  const typedVax = (vaccinations as Vaccination[]) ?? [];
  const typedJourneys = (journeys as CareJourney[]) ?? [];
  const typedSteps = (journeySteps as CareJourneyStep[]) ?? [];
  const typedPersonDoctors = (personDoctors as PersonDoctor[]) ?? [];
  const typedAllDoctors = (allDoctors as any[]) ?? [];
  const typedMeds = (medications as Medication[]) ?? [];
  const typedRx = (prescriptions as Prescription[]) ?? [];
  const typedReferrals = (referrals as Referral[]) ?? [];
  const typedResults = (testResults as TestResult[]) ?? [];
  const typedDocs = (documents as Document[]) ?? [];

  const activeJourneys = typedJourneys.filter((j) => j.status === "active");
  const alertChecks = typedChecks.filter((c) => ["overdue", "missing", "due_soon"].includes(c.status ?? ""));
  const upcomingVax = typedVax.filter((v) => {
    if (!v.next_due_at) return false;
    const days = Math.ceil((new Date(v.next_due_at).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 90;
  });

  const timelineCount = typedAppts.length + typedSteps.length;

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

          <ProfileSection title="Timeline" icon="🗓️" count={timelineCount} defaultOpen>
            <TimelineSection
              person={typedPerson}
              appointments={typedAppts}
              preventiveChecks={typedChecks}
              vaccinations={typedVax}
              careSteps={typedSteps}
              careJourneys={typedJourneys}
              doctors={typedAllDoctors}
            />
          </ProfileSection>

          <ProfileSection title="Care Journeys" icon="📋" count={typedJourneys.length}>
            <CareJourneysSection
              journeys={typedJourneys}
              steps={typedSteps}
              personColorHex={typedPerson.color_hex ?? "#C7E6A3"}
              personId={typedPerson.id}
            />
          </ProfileSection>

          <ProfileSection title="Doctors" icon="🩺" count={typedPersonDoctors.length}>
            <DoctorsSection personDoctors={typedPersonDoctors} personId={id} />
          </ProfileSection>

          <ProfileSection title="Preventive Care" icon="🔔" count={typedChecks.length}>
            <PreventiveSection checks={typedChecks} />
          </ProfileSection>

          <ProfileSection title="Medications" icon="💊" count={typedMeds.length}>
            <MedicationsSection medications={typedMeds} />
          </ProfileSection>

          <ProfileSection title="Prescriptions" icon="📄" count={typedRx.length}>
            <PrescriptionsSection prescriptions={typedRx} />
          </ProfileSection>

          <ProfileSection title="Referrals" icon="📨" count={typedReferrals.length}>
            <ReferralsSection referrals={typedReferrals} />
          </ProfileSection>

          <ProfileSection title="Test Results" icon="🧪" count={typedResults.length}>
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
