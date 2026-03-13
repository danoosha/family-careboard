/**
 * app/api/auth/google/callback/route.ts
 * Handles OAuth callback — exchanges code for tokens, saves connection
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(`${appUrl}/settings/calendar?error=oauth_cancelled`);
  }

  // Decode state
  let userId: string;
  let personId: string;
  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
    userId = parsed.userId;
    personId = parsed.personId ?? "";
  } catch {
    return NextResponse.redirect(`${appUrl}/settings/calendar?error=invalid_state`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/settings/calendar?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json();

  // Get user's primary calendar info
  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  const calData = calRes.ok ? await calRes.json() : null;

  // Get Google email
  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );
  const profile = profileRes.ok ? await profileRes.json() : null;

  const supabase = createClient();

  // Upsert connection (one per user per person)
  const { data: conn, error: dbError } = await supabase
    .from("google_calendar_connections")
    .upsert({
      user_id: userId,
      person_id: personId || null,
      google_email: profile?.email ?? null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expiry: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      calendar_id: calData?.id ?? "primary",
      calendar_name: calData?.summary ?? "Primary Calendar",
      is_active: true,
      sync_enabled: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,person_id",
      ignoreDuplicates: false,
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("Failed to save connection:", dbError);
    return NextResponse.redirect(`${appUrl}/settings/calendar?error=db_error`);
  }

  // Register webhook for push notifications
  try {
    const channelId = crypto.randomUUID();
    const { registerWebhook } = await import("@/lib/google-calendar");
    const webhook = await registerWebhook(
      conn.id,
      calData?.id ?? "primary",
      channelId,
      `${appUrl}/api/google/webhook`
    );

    await supabase.from("google_calendar_channels").upsert({
      connection_id: conn.id,
      workspace_id: (await supabase.from("google_calendar_connections")
        .select("people(workspace_id)")
        .eq("id", conn.id)
        .single()).data?.people?.workspace_id ?? "00000000-0000-4000-8000-000000000001",
      channel_id: channelId,
      resource_id: webhook.resourceId,
      expiration: webhook.expiration,
    });
  } catch (e) {
    // Webhook registration failed — sync still works, just won't be real-time
    console.warn("Webhook registration failed (non-fatal):", e);
  }

  return NextResponse.redirect(`${appUrl}/settings/calendar?connected=1`);
}
