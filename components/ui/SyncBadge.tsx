/**
 * components/ui/SyncBadge.tsx
 * Shows Google Calendar sync status on an appointment
 */

interface Props {
  status: "synced" | "not_synced" | "sync_failed" | string | null | undefined;
}

export default function SyncBadge({ status }: Props) {
  if (!status || status === "not_synced") return null;

  if (status === "synced") {
    return (
      <span title="Synced with Google Calendar"
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 12a8 8 0 01-14.93 4M4 12a8 8 0 0114.93-4" />
          <polyline points="20 4 20 8 16 8" />
          <polyline points="4 20 4 16 8 16" />
        </svg>
        GCal
      </span>
    );
  }

  if (status === "sync_failed") {
    return (
      <span title="Google Calendar sync failed"
        className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
        ⚠ Sync failed
      </span>
    );
  }

  return null;
}
