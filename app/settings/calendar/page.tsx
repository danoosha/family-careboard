"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/layout/AppShell";
import type { Person } from "@/types";

interface Connection {
  id: string;
  person_id: string | null;
  google_email: string | null;
  calendar_name: string | null;
  calendar_id: string | null;
  is_active: boolean;
  sync_enabled: boolean;
  last_synced_at: string | null;
}

const SYNC_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  synced:      { label: "Synced",    className: "text-emerald-600 bg-emerald-50" },
  not_synced:  { label: "Pending",   className: "text-amber-600 bg-amber-50" },
  sync_failed: { label: "Failed",    className: "text-red-500 bg-red-50" },
};

export default function CalendarSettingsPage() {
  const sb = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();

  const [people, setPeople] = useState<Person[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (searchParams.get("connected") === "1") {
      setBanner({ type: "success", msg: "Google Calendar connected successfully!" });
    } else if (searchParams.get("error")) {
      const errMap: Record<string, string> = {
        oauth_cancelled: "Google sign-in was cancelled.",
        token_exchange_failed: "Could not exchange code for tokens. Please try again.",
        db_error: "Failed to save connection. Please try again.",
        invalid_state: "Invalid OAuth state. Please try again.",
      };
      setBanner({ type: "error", msg: errMap[searchParams.get("error")!] ?? "Something went wrong." });
    }
  }, [searchParams]);

  async function load() {
    setLoading(true);
    const [peopleRes, connRes] = await Promise.all([
      sb.from("people").select("id, display_name, color_hex").order("sort_order"),
      sb.from("google_calendar_connections").select("*").order("created_at"),
    ]);
    setPeople((peopleRes.data as Person[]) ?? []);
    setConnections((connRes.data as Connection[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function connectUrl(personId: string) {
    return `/api/auth/google/connect?person_id=${personId}`;
  }

  function personName(personId: string | null) {
    if (!personId) return "All (shared)";
    return people.find((p) => p.id === personId)?.display_name ?? "Unknown";
  }

  function personColor(personId: string | null) {
    if (!personId) return "#94A3B8";
    return people.find((p) => p.id === personId)?.color_hex ?? "#94A3B8";
  }

  async function handleSync(connectionId: string) {
    setSyncing(connectionId);
    try {
      const res = await fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      const data = await res.json();
      const result = data.results?.[connectionId];
      setBanner({
        type: "success",
        msg: `Sync complete: ${result?.pushed ?? 0} pushed, ${result?.pulled ?? 0} pulled${result?.errors?.length ? ` (${result.errors.length} errors)` : ""}`,
      });
      await load();
    } catch {
      setBanner({ type: "error", msg: "Sync failed. Please try again." });
    } finally {
      setSyncing(null);
    }
  }

  async function handleDisconnect(connectionId: string) {
    if (!confirm("Disconnect this Google Calendar? Existing appointments will be kept.")) return;
    setDisconnecting(connectionId);
    try {
      await fetch("/api/auth/google/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      await load();
    } catch {
      setBanner({ type: "error", msg: "Failed to disconnect. Please try again." });
    } finally {
      setDisconnecting(null);
    }
  }

  async function toggleSync(conn: Connection) {
    await sb.from("google_calendar_connections")
      .update({ sync_enabled: !conn.sync_enabled })
      .eq("id", conn.id);
    setConnections((prev) => prev.map((c) => c.id === conn.id ? { ...c, sync_enabled: !c.sync_enabled } : c));
  }

  const connectedPersonIds = new Set(connections.map((c) => c.person_id));

  return (
    <AppShell>
      <div className="px-4 pt-5 pb-10 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-heading">Google Calendar</h1>
          <p className="text-sm text-stone-500 mt-1">Connect family members' calendars to sync appointments</p>
        </div>

        {/* Banner */}
        {banner && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-start justify-between gap-3 ${
            banner.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}>
            <span>{banner.msg}</span>
            <button onClick={() => setBanner(null)} className="text-lg leading-none opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* How it works */}
        <div className="bg-white rounded-3xl shadow-card p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">How it works</p>
          <div className="space-y-1.5 text-sm text-stone-600">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">→</span>
              <span>Appointments you add here are pushed to Google Calendar automatically</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 font-bold mt-0.5">←</span>
              <span>Events added in Google Calendar are pulled back into Family Careboard</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-bold mt-0.5">🔔</span>
              <span>Reminders are set automatically: 1 day before and 2 hours before each appointment</span>
            </div>
          </div>
        </div>

        {/* Connected accounts */}
        {loading ? (
          <p className="text-sm text-stone-400">Loading…</p>
        ) : (
          <>
            {connections.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Connected accounts</p>
                {connections.map((conn) => (
                  <div key={conn.id} className="bg-white rounded-3xl shadow-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: personColor(conn.person_id) }} />
                        <div>
                          <p className="text-sm font-bold text-heading">{personName(conn.person_id)}</p>
                          {conn.google_email && (
                            <p className="text-xs text-stone-400">{conn.google_email}</p>
                          )}
                          {conn.calendar_name && (
                            <p className="text-xs text-stone-400">{conn.calendar_name}</p>
                          )}
                          {conn.last_synced_at && (
                            <p className="text-[11px] text-stone-300 mt-0.5">
                              Last synced: {new Date(conn.last_synced_at).toLocaleString("en-GB", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        conn.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-400"
                      }`}>
                        {conn.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                      {/* Sync toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => toggleSync(conn)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            conn.sync_enabled ? "bg-[#3A3370]" : "bg-stone-200"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            conn.sync_enabled ? "translate-x-4" : "translate-x-0.5"
                          }`} />
                        </div>
                        <span className="text-xs font-medium text-stone-500">Sync enabled</span>
                      </label>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSync(conn.id)}
                          disabled={!!syncing}
                          className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#3A3370] text-white disabled:opacity-60"
                        >
                          {syncing === conn.id ? "Syncing…" : "Sync now"}
                        </button>
                        <button
                          onClick={() => handleDisconnect(conn.id)}
                          disabled={!!disconnecting}
                          className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-500 disabled:opacity-60"
                        >
                          {disconnecting === conn.id ? "Removing…" : "Disconnect"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Connect new accounts */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                {connections.length > 0 ? "Connect another account" : "Connect a calendar"}
              </p>
              <div className="space-y-2">
                {people.map((person) => {
                  const isConnected = connectedPersonIds.has(person.id);
                  return (
                    <div key={person.id}
                      className="bg-white rounded-3xl shadow-card px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: person.color_hex }} />
                        <span className="text-sm font-semibold text-heading">{person.display_name}</span>
                        {isConnected && (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Connected
                          </span>
                        )}
                      </div>
                      <a
                        href={connectUrl(person.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                          isConnected
                            ? "bg-stone-100 text-stone-500"
                            : "bg-[#3A3370] text-white"
                        }`}
                      >
                        {isConnected ? "Reconnect" : "Connect"}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* .env reminder */}
        <div className="rounded-2xl border border-dashed border-stone-200 p-4">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">Required env vars</p>
          <pre className="text-[11px] text-stone-500 leading-relaxed">
{`GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-domain.com`}
          </pre>
        </div>
      </div>
    </AppShell>
  );
}
