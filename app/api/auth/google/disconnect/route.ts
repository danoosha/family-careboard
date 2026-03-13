/**
 * app/api/auth/google/disconnect/route.ts
 * Revokes tokens and removes the connection
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stopWebhook } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { connectionId } = await req.json();

  // Get active webhook channels for this connection
  const { data: channels } = await supabase
    .from("google_calendar_channels")
    .select("channel_id, resource_id")
    .eq("connection_id", connectionId);

  // Stop webhook channels
  for (const ch of channels ?? []) {
    try {
      if (ch.resource_id) {
        await stopWebhook(connectionId, ch.channel_id, ch.resource_id);
      }
    } catch {
      // Non-fatal — channel may already be expired
    }
  }

  // Get connection for token revocation
  const { data: conn } = await supabase
    .from("google_calendar_connections")
    .select("access_token, refresh_token")
    .eq("id", connectionId)
    .single();

  // Revoke Google token
  if (conn?.access_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${conn.access_token}`, {
      method: "POST",
    }).catch(() => null); // Non-fatal
  }

  // Remove from DB
  await supabase.from("google_calendar_channels").delete().eq("connection_id", connectionId);
  await supabase.from("google_calendar_connections").delete().eq("id", connectionId);

  return NextResponse.json({ ok: true });
}
