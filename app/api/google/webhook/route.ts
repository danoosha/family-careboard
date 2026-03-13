/**
 * app/api/google/webhook/route.ts
 * Google Calendar push notification receiver
 * Google sends POST here when a calendar changes → we trigger incremental sync
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Google sends these headers to identify the channel
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  // "sync" is just the initial verification ping — no action needed
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  if (!channelId) {
    return NextResponse.json({ error: "Missing channel ID" }, { status: 400 });
  }

  const supabase = createClient();

  // Look up which connection this channel belongs to
  const { data: channel } = await supabase
    .from("google_calendar_channels")
    .select("connection_id")
    .eq("channel_id", channelId)
    .maybeSingle();

  if (!channel?.connection_id) {
    // Unknown channel — might be stale, ignore
    return NextResponse.json({ ok: true });
  }

  // Trigger sync for this connection (fire and forget — Google doesn't need a response body)
  const syncUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/google/sync`;
  fetch(syncUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId: channel.connection_id }),
  }).catch((e) => console.error("Webhook sync trigger failed:", e));

  return NextResponse.json({ ok: true });
}
