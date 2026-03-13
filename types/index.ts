export type UUID = string;

export interface Person {
  id: UUID;
  display_name: string;
  internal_name?: string;
  relationship?: string;
  color_hex: string;
  sort_order?: number;
  status_summary?: string;
  next_action_summary?: string;
  notes?: string;
  workspace_id?: UUID;
}

export interface Doctor {
  id: UUID;
  doctor_name: string;
  specialty?: string;
  phone?: string;
  address?: string;
  notes?: string;
  workspace_id?: UUID;
}

export interface PersonDoctor {
  id: UUID;
  person_id: UUID;
  doctor_id: UUID;
  notes?: string;
  doctor?: Doctor;
}

export interface Appointment {
  id: UUID;
  person_id: UUID;
  doctor_id?: UUID;
  care_journey_id?: UUID | null;
  title: string;
  starts_at: string;
  location?: string;
  notes?: string;
  status?: string;
  appointment_type?: string | null;
  is_recurring?: boolean;
  recurring_group_id?: UUID | null;
}

export interface PreventiveCheck {
  id: UUID;
  person_id: UUID;
  check_type: string;
  recommended_interval_months?: number;
  last_done_at?: string;
  next_due_at?: string;
  status?: string;
}

export interface Vaccination {
  id: UUID;
  person_id: UUID;
  vaccine_name: string;
  last_given_at?: string;
  next_due_at?: string;
}

export interface Medication {
  id: UUID;
  person_id: UUID;
  medication_name: string;
  dosage?: string;
  schedule?: string;
  notes?: string;
  active?: boolean;
}

export interface Prescription {
  id: UUID;
  person_id: UUID;
  doctor_id?: UUID;
  medication_name: string;
  issued_at?: string;
  expires_at?: string;
  notes?: string;
}

export interface Referral {
  id: UUID;
  person_id: UUID;
  from_doctor_id?: UUID;
  to_doctor_id?: UUID;
  reason?: string;
  issued_at?: string;
  expires_at?: string;
  status?: string;
}

export interface TestResult {
  id: UUID;
  person_id: UUID;
  test_name: string;
  taken_at?: string;
  result_summary?: string;
  drive_url?: string;
}

export interface Document {
  id: UUID;
  person_id: UUID;
  title: string;
  category?: string;
  drive_url?: string;
  uploaded_at?: string;
}

export type AlertType = "warning" | "info";

export interface HealthAlert {
  type: AlertType;
  message: string;
  person_id?: UUID;
}

export interface TimelineEvent {
  id: string;
  person_id: UUID;
  date: string;
  type: string;
  title: string;
  description?: string;
}

export interface CareJourney {
  id: UUID;
  workspace_id?: UUID;
  person_id: UUID;
  title: string;
  description?: string | null;
  status: "active" | "paused" | "completed" | "cancelled" | string;
  next_step?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CareJourneyStep {
  id: UUID;
  care_journey_id: UUID;
  person_id?: UUID;
  title: string;
  step_date?: string | null;
  status?: string;
  notes?: string | null;
  created_at?: string | null;
}

export interface CareJourneyWithSteps extends CareJourney {
  steps: CareJourneyStep[];
}
