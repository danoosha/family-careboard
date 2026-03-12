"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Person, Doctor, Appointment, Document } from "@/types";

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("people")
      .select("*")
      .order("display_name")
      .then(({ data }) => {
        setPeople(data ?? []);
        setLoading(false);
      });
  }, []);

  return { people, loading };
}

export function usePerson(id: string) {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    supabase
      .from("people")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setPerson(data);
        setLoading(false);
      });
  }, [id]);

  return { person, loading };
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("doctors")
      .select("*")
      .order("full_name")
      .then(({ data }) => {
        setDoctors(data ?? []);
        setLoading(false);
      });
  }, []);

  return { doctors, loading };
}

export function useDocuments(personId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let query = supabase.from("documents").select("*").order("document_date", { ascending: false });
    if (personId) query = query.eq("person_id", personId);
    query.then(({ data }) => {
      setDocuments(data ?? []);
      setLoading(false);
    });
  }, [personId]);

  return { documents, loading };
}

export function useAppointments(personId?: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let query = supabase.from("appointments").select("*").order("starts_at");
    if (personId) query = query.eq("person_id", personId);
    query.then(({ data }) => {
      setAppointments(data ?? []);
      setLoading(false);
    });
  }, [personId]);

  return { appointments, loading };
}

export function usePersonData(personId: string) {
  const [data, setData] = useState<{
    careJourneys: any[];
    appointments: any[];
    preventiveChecks: any[];
    medications: any[];
    prescriptions: any[];
    referrals: any[];
    testResults: any[];
    documents: any[];
    doctors: any[];
    vaccinations: any[];
  }>({
    careJourneys: [],
    appointments: [],
    preventiveChecks: [],
    medications: [],
    prescriptions: [],
    referrals: [],
    testResults: [],
    documents: [],
    doctors: [],
    vaccinations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;
    const supabase = createClient();

    Promise.all([
      supabase.from("care_journeys").select("*, care_journey_steps(*)").eq("person_id", personId),
      supabase.from("appointments").select("*").eq("person_id", personId).order("starts_at"),
      supabase.from("preventive_checks").select("*").eq("person_id", personId),
      supabase.from("medications").select("*").eq("person_id", personId),
      supabase.from("prescriptions").select("*").eq("person_id", personId),
      supabase.from("referrals").select("*").eq("person_id", personId),
      supabase.from("test_results").select("*").eq("person_id", personId),
      supabase.from("documents").select("*").eq("person_id", personId),
      supabase.from("person_doctors").select("*, doctors(*)").eq("person_id", personId),
      supabase.from("vaccinations").select("*").eq("person_id", personId),
    ]).then(
      ([journeys, appts, preventive, meds, prescriptions, referrals, tests, docs, doctors, vaccinations]) => {
        setData({
          careJourneys: journeys.data ?? [],
          appointments: appts.data ?? [],
          preventiveChecks: preventive.data ?? [],
          medications: meds.data ?? [],
          prescriptions: prescriptions.data ?? [],
          referrals: referrals.data ?? [],
          testResults: tests.data ?? [],
          documents: docs.data ?? [],
          doctors: doctors.data ?? [],
          vaccinations: vaccinations.data ?? [],
        });
        setLoading(false);
      }
    );
  }, [personId]);

  return { data, loading };
}

export function useTimeline() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("people").select("id, display_name, color_hex"),
      supabase.from("appointments").select("id, person_id, title, starts_at"),
      supabase.from("care_journey_steps").select("id, journey_id, title, step_date, care_journeys(person_id)"),
      supabase.from("preventive_checks").select("id, person_id, name, next_due"),
      supabase.from("vaccinations").select("id, person_id, vaccine_name, next_due"),
    ]).then(([people, appts, steps, preventive, vaccinations]) => {
      const peopleMap = new Map(
        (people.data ?? []).map((p) => [p.id, p])
      );

      const allEvents: any[] = [];

      (appts.data ?? []).forEach((a) => {
        if (!a.starts_at) return;
        const person = peopleMap.get(a.person_id);
        if (!person) return;
        allEvents.push({
          id: a.id,
          person_id: a.person_id,
          person_name: person.display_name,
          person_color: person.color_hex ?? "#ccc",
          title: a.title,
          date: a.starts_at,
          type: "appointment",
        });
      });

      (steps.data ?? []).forEach((s: any) => {
        if (!s.step_date) return;
        const personId = s.care_journeys?.person_id;
        const person = peopleMap.get(personId);
        if (!person) return;
        allEvents.push({
          id: s.id,
          person_id: personId,
          person_name: person.display_name,
          person_color: person.color_hex ?? "#ccc",
          title: s.title,
          date: s.step_date,
          type: "care_step",
        });
      });

      (preventive.data ?? []).forEach((p) => {
        if (!p.next_due) return;
        const person = peopleMap.get(p.person_id);
        if (!person) return;
        allEvents.push({
          id: p.id,
          person_id: p.person_id,
          person_name: person.display_name,
          person_color: person.color_hex ?? "#ccc",
          title: p.name,
          date: p.next_due,
          type: "preventive",
        });
      });

      (vaccinations.data ?? []).forEach((v) => {
        if (!v.next_due) return;
        const person = peopleMap.get(v.person_id);
        if (!person) return;
        allEvents.push({
          id: v.id,
          person_id: v.person_id,
          person_name: person.display_name,
          person_color: person.color_hex ?? "#ccc",
          title: v.vaccine_name,
          date: v.next_due,
          type: "vaccination",
        });
      });

      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(allEvents);
      setLoading(false);
    });
  }, []);

  return { events, loading };
}
