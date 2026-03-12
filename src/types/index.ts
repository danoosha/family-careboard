export interface Person {
  id: string
  display_name: string
  color_hex: string
  status_summary: string | null
  next_action_summary: string | null
  avatar_url: string | null
  created_at: string
}

export interface Doctor {
  id: string
  full_name: string
  specialty: string | null
  clinic_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface PersonDoctor {
  id: string
  person_id: string
  doctor_id: string
  is_primary: boolean
  notes: string | null
}

export interface CareJourney {
  id: string
  person_id: string
  title: string
  description: string | null
  status: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export interface CareJourneyStep {
  id: string
  journey_id: string
  person_id: string
  title: string
  description: string | null
  step_date: string | null
  status: string | null
  created_at: string
}

export interface Appointment {
  id: string
  person_id: string
  doctor_id: string | null
  title: string
  location: string | null
  starts_at: string
  ends_at: string | null
  notes: string | null
  created_at: string
  doctors?: Doctor
}

export interface PreventiveCheck {
  id: string
  person_id: string
  check_name: string
  last_done: string | null
  next_due: string | null
  frequency_months: number | null
  notes: string | null
  created_at: string
}

export interface Medication {
  id: string
  person_id: string
  name: string
  dosage: string | null
  frequency: string | null
  start_date: string | null
  end_date: string | null
  prescribing_doctor_id: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface Prescription {
  id: string
  person_id: string
  doctor_id: string | null
  medication_name: string
  dosage: string | null
  issue_date: string | null
  expiry_date: string | null
  refills_remaining: number | null
  drive_url: string | null
  notes: string | null
  created_at: string
  doctors?: Doctor
}

export interface Referral {
  id: string
  person_id: string
  referring_doctor_id: string | null
  specialist_name: string | null
  specialty: string | null
  reason: string | null
  issue_date: string | null
  expiry_date: string | null
  status: string | null
  drive_url: string | null
  notes: string | null
  created_at: string
}

export interface TestResult {
  id: string
  person_id: string
  test_name: string
  test_date: string | null
  result_summary: string | null
  ordered_by_doctor_id: string | null
  drive_url: string | null
  notes: string | null
  created_at: string
}

export interface Document {
  id: string
  person_id: string
  title: string
  category: string | null
  document_date: string | null
  drive_url: string | null
  notes: string | null
  created_at: string
}

export interface Vaccination {
  id: string
  person_id: string
  vaccine_name: string
  last_given: string | null
  next_due: string | null
  notes: string | null
  created_at: string
}

export interface TimelineEvent {
  id: string
  person_id: string
  title: string
  date: string
  type: 'appointment' | 'care_step' | 'preventive' | 'vaccination'
  color: string
}

export interface HealthAlert {
  type: 'warning' | 'info' | 'success'
  message: string
}
