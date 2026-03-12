import EmptyState from "@/components/ui/EmptyState";
import { REFERRAL_STATUS_COLORS } from "@/lib/colors";
import { formatDate, isOverdue } from "@/lib/dates";
import type { Referral } from "@/types";

interface ReferralsSectionProps {
  referrals: Referral[];
}

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending",
  scheduled: "Scheduled",
  done:      "Done",
  expired:   "Expired",
};

export default function ReferralsSection({ referrals }: ReferralsSectionProps) {
  if (referrals.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card">
        <EmptyState icon="📨" title="No referrals" compact />
      </div>
    );
  }

  const sorted = [...referrals].sort((a, b) => {
    const ORDER: Record<string, number> = { pending: 0, scheduled: 1, done: 2, expired: 3 };
    return (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9);
  });

  return (
    <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
      {sorted.map((ref) => {
        const autoExpired =
          ref.status !== "done" &&
          ref.valid_until &&
          isOverdue(ref.valid_until);

        return (
          <div key={ref.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-heading leading-tight">
                  {ref.to_specialty}
                </p>
                {ref.from_doctor && (
                  <p className="text-xs text-muted mt-0.5">
                    From Dr. {ref.from_doctor.name}
                  </p>
                )}
                {ref.reason && (
                  <p className="text-xs text-body mt-1 leading-relaxed">
                    {ref.reason}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {ref.issued_date && (
                    <span className="text-xs text-muted">
                      {formatDate(ref.issued_date)}
                    </span>
                  )}
                  {ref.valid_until && (
                    <span
                      className={`text-xs font-medium ${
                        autoExpired ? "text-red-600" : "text-muted"
                      }`}
                    >
                      Until: {formatDate(ref.valid_until)}
                    </span>
                  )}
                </div>
                {ref.notes && (
                  <p className="text-xs text-muted mt-1 italic">{ref.notes}</p>
                )}
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  autoExpired
                    ? "bg-red-100 text-red-600"
                    : REFERRAL_STATUS_COLORS[ref.status] ?? "bg-gray-100 text-gray-500"
                }`}
              >
                {autoExpired ? "Expired" : STATUS_LABELS[ref.status] ?? ref.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
