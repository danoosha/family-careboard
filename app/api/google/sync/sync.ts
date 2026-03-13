/**
 * app/api/google/sync/route.ts
 * Bidirectional sync endpoint — called manually or by cron
 * POST { connectionId } → syncs that connection
 * POST { all: true }    → syncs all active connections for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listCalendarEvents,
  appointmentToCalendarEvent,
  calendarEventToAppointment,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // Determine which connections to sync
  let connectionIds: string[] = [];

  if (body.connectionId) {
    connectionIds = [body.connectionId];
  } else {
    // All active connections for this user
    const { data } = await supabase
      .from("google_calendar_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .eq("sync_enabled", true);
    connectionIds = (data ?? []).map((c: any) => c.id);
  }

  const results: Record<string, { pushed: number; pulled: number; errors: string[] }> = {};

  for (const connId of connectionIds) {
    results[connId] = await syncConnection(supabase, connId, user.id);
  }

  return NextResponse.json({ ok: true, results });
}

async function syncConnection(supabase: any, connectionId: string, userId: string) {
  const pushed: number[] = [];
  const pulled: number[] = [];
  const errors: string[] = [];

  // Load connection
  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (!conn) return { pushed: 0, pulled: 0, errors: ["Connection not found"] };

  const calendarId = conn.calendar_id ?? "primary";
  const personId = conn.person_id;

  // ── Push: unsyced local appointments → Google ─────────────────────────

  const { data: unsynced } = await supabase
    .from("appointments")
    .select("*")
    .eq("person_id", personId)
    .in("google_sync_status", ["not_synced", "sync_failed"])
    .neq("status", "cancelled");

  for (const appt of unsynced ?? []) {
    try {
      const event = appointmentToCalendarEvent(appt, process.env.NEXT_PUBLIC_APP_URL!);

      if (appt.google_event_id && appt.google_calendar_id === calendarId) {
        // Update existing
        await updateCalendarEvent(connectionId, calendarId, appt.google_event_id, event);
      } else {
        // Create new
        const created = await createCalendarEvent(connectionId, calendarId, event);
        await supabase.from("appointments").update({
          google_event_id: created.id,
          google_calendar_id: calendarId,
          google_sync_status: "synced",
          google_synced_at: new Date().toISOString(),
        }).eq("id", appt.id);
      }

      await supabase.from("appointments").update({
        google_sync_status: "synced",
        google_synced_at: new Date().toISOString(),
      }).eq("id", appt.id);

      pushed.push(1);
    } catch (e: any) {
      errors.push(`Push ${appt.id}: ${e.message}`);
      await supabase.from("appointments").update({
        google_sync_status: "sync_failed",
      }).eq("id", appt.id);
    }
  }

  // Push cancellations to Google
  const { data: cancelled } = await supabase
    .from("appointments")
    .select("google_event_id, google_calendar_id")
    .eq("person_id", personId)
    .eq("status", "cancelled")
    .not("google_event_id", "is", null)
    .neq("google_sync_status", "synced");

  for (const appt of cancelled ?? []) {
    try {
      await deleteCalendarEvent(connectionId, appt.google_calendar_id ?? calendarId, appt.google_event_id);
      await supabase.from("appointments").update({
        google_sync_status: "synced",
        google_synced_at: new Date().toISOString(),
      }).eq("google_event_id", appt.google_event_id);
    } catch (e: any) {
      errors.push(`Delete ${appt.google_event_id}: ${e.message}`);
    }
  }

  // ── Pull: Google events → local appointments ───────────────────────────

  try {
    const { events, nextSyncToken } = await listCalendarEvents(
      connectionId,
      calendarId,
      conn.sync_token ?? undefined
    );

    for (const event of events) {
      try {
        // Skip events that originated from this app (avoid loops)
        if (event.source?.title === "Family Careboard") continue;

        if (event.status === "cancelled") {
          // Mark matching appointment as cancelled
          await supabase.from("appointments")
            .update({ status: "cancelled", google_sync_status: "synced" })
            .eq("google_event_id", event.id)
            .eq("person_id", personId);
          continue;
        }

        const mapped = calendarEventToAppointment(event);
        if (!mapped) continue;

        // Check if appointment already exists
        const { data: existing } = await supabase
          .from("appointments")
          .select("id")
          .eq("google_event_id", event.id)
          .eq("person_id", personId)
          .maybeSingle();

        if (existing) {
          // Update existing appointment from Google data
          await supabase.from("appointments").update({
            title: mapped.title,
            starts_at: mapped.starts_at,
            ends_at: mapped.ends_at,
            location: mapped.location,
            google_sync_status: "synced",
            google_synced_at: new Date().toISOString(),
          }).eq("id", existing.id);
        } else {
          // Create new appointment from Google event
          await supabase.from("appointments").insert({
            workspace_id: WORKSPACE_ID,
            person_id: personId,
            title: mapped.title,
            starts_at: mapped.starts_at,
            ends_at: mapped.ends_at,
            location: mapped.location,
            notes: mapped.notes,
            status: "scheduled",
            google_event_id: mapped.google_event_id,
            google_calendar_id: calendarId,
            google_sync_status: "synced",
            google_synced_at: new Date().toISOString(),
          });
        }

        pulled.push(1);
      } catch (e: any) {
        errors.push(`Pull ${event.id}: ${e.message}`);
      }
    }

    // Save sync token for incremental sync next time
    if (nextSyncToken) {
      await supabase.from("google_calendar_connections").update({
        sync_token: nextSyncToken,
        last_synced_at: new Date().toISOString(),
      }).eq("id", connectionId);
    }
  } catch (e: any) {
    errors.push(`List events: ${e.message}`);
  }

  return { pushed: pushed.length, pulled: pulled.length, errors };
}
