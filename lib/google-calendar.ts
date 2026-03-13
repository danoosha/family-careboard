/**
 * lib/google-calendar.ts
 * Core Google Calendar API helpers — token management, event CRUD, webhook registration
 */

import { createClient } from "@/lib/supabase/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  reminders?: {
    useDefault: boolean;
    overrides?: { method: string; minutes: number }[];
  };
  source?: { title: string; url: string };
}

// ── Token refresh ──────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expiry_date: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Returns a valid access token for a connection — refreshes automatically if expired.
 */
export async function getValidToken(connectionId: string): Promise<string> {
  const supabase = createClient();
  const { data: conn, error } = await supabase
    .from("google_calendar_connections")
    .select("access_token, refresh_token, token_expiry")
    .eq("id", connectionId)
    .single();

  if (error || !conn) throw new Error("Connection not found");

  const expiryMs = conn.token_expiry ? new Date(conn.token_expiry).getTime() : 0;
  const isExpired = Date.now() >= expiryMs - 60_000; // refresh 1 min early

  if (!isExpired) return conn.access_token;

  if (!conn.refresh_token) throw new Error("No refresh token available — user must reconnect");

  const fresh = await refreshAccessToken(conn.refresh_token);

  await supabase.from("google_calendar_connections").update({
    access_token: fresh.access_token,
    refresh_token: fresh.refresh_token ?? conn.refresh_token,
    token_expiry: fresh.expiry_date ? new Date(fresh.expiry_date).toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", connectionId);

  return fresh.access_token;
}

// ── Event CRUD ─────────────────────────────────────────────────────────────

export async function createCalendarEvent(
  connectionId: string,
  calendarId: string,
  event: CalendarEvent
): Promise<{ id: string }> {
  const token = await getValidToken(connectionId);

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create event: ${err}`);
  }

  return res.json();
}

export async function updateCalendarEvent(
  connectionId: string,
  calendarId: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<void> {
  const token = await getValidToken(connectionId);

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update event: ${err}`);
  }
}

export async function deleteCalendarEvent(
  connectionId: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const token = await getValidToken(connectionId);

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  // 404 = already deleted on Google side — that's fine
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete event: ${err}`);
  }
}

export async function getCalendarEvent(
  connectionId: string,
  calendarId: string,
  eventId: string
): Promise<CalendarEvent & { id: string } | null> {
  const token = await getValidToken(connectionId);

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to get event: ${await res.text()}`);
  return res.json();
}

// ── List & incremental sync ────────────────────────────────────────────────

export async function listCalendarEvents(
  connectionId: string,
  calendarId: string,
  syncToken?: string,
  timeMin?: string
): Promise<{ events: (CalendarEvent & { id: string; status?: string })[]; nextSyncToken?: string }> {
  const token = await getValidToken(connectionId);

  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  if (syncToken) {
    // Incremental sync — only changes since last token
    params.set("syncToken", syncToken);
  } else if (timeMin) {
    params.set("timeMin", timeMin);
  } else {
    // Default: next 6 months
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    params.set("timeMin", from.toISOString());
  }

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 410) {
    // Sync token expired — do a full sync
    return listCalendarEvents(connectionId, calendarId, undefined, timeMin);
  }

  if (!res.ok) throw new Error(`Failed to list events: ${await res.text()}`);

  const data = await res.json();
  return {
    events: data.items ?? [],
    nextSyncToken: data.nextSyncToken,
  };
}

// ── Webhook (push notifications) ───────────────────────────────────────────

export async function registerWebhook(
  connectionId: string,
  calendarId: string,
  channelId: string,
  webhookUrl: string
): Promise<{ resourceId: string; expiration: string }> {
  const token = await getValidToken(connectionId);

  const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days max

  const res = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        expiration: expiration.toString(),
      }),
    }
  );

  if (!res.ok) throw new Error(`Failed to register webhook: ${await res.text()}`);

  const data = await res.json();
  return { resourceId: data.resourceId, expiration: new Date(parseInt(data.expiration)).toISOString() };
}

export async function stopWebhook(
  connectionId: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  const token = await getValidToken(connectionId);

  await fetch(`${GOOGLE_CALENDAR_BASE}/channels/stop`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: channelId, resourceId }),
  });
}

// ── Appointment ↔ Calendar event mapping ──────────────────────────────────

export function appointmentToCalendarEvent(appointment: {
  title: string;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  notes?: string | null;
  appointment_type?: string | null;
}, appBaseUrl: string): CalendarEvent {
  const start = new Date(appointment.starts_at);
  // Default duration: 1 hour if no ends_at
  const end = appointment.ends_at
    ? new Date(appointment.ends_at)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const description = [
    appointment.appointment_type ? `Type: ${appointment.appointment_type}` : null,
    appointment.notes ?? null,
    `\nManaged via Family Careboard`,
  ].filter(Boolean).join("\n");

  return {
    summary: appointment.title,
    description,
    location: appointment.location ?? undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 }, // 1 day before
        { method: "popup", minutes: 2 * 60 },  // 2 hours before
      ],
    },
    source: {
      title: "Family Careboard",
      url: appBaseUrl,
    },
  };
}

export function calendarEventToAppointment(event: CalendarEvent & { id: string; status?: string }): {
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  google_event_id: string;
  status: string;
} | null {
  // Skip cancelled, all-day, or events without a dateTime
  if (event.status === "cancelled") return null;
  if (!event.start?.dateTime) return null; // all-day events have only event.start.date

  return {
    title: event.summary ?? "Calendar event",
    starts_at: event.start.dateTime,
    ends_at: event.end?.dateTime ?? null,
    location: event.location ?? null,
    notes: event.description ?? null,
    google_event_id: event.id,
    status: "scheduled",
  };
}
