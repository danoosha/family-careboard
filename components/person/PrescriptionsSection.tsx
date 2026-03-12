import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/dates";
import { isOverdue } from "@/lib/dates";
import type { Prescription } from "@/types";

interface PrescriptionsSectionProps {
  prescriptions: Prescription[];
}

export default function PrescriptionsSection({ prescriptions }: PrescriptionsSectionProps) {
  if (prescriptions.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card">
        <EmptyState icon="📄" title="No prescriptions" compact />
      </div>
    );
  }

  const sorted = [...prescriptions].sort((a, b) => {
    const da = a.issued_date ? new Date(a.issued_date).getTime() : 0;
    const db = b.issued_date ? new Date(b.issued_date).getTime() : 0;
    return db - da;
  });

  return (
    <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
      {sorted.map((rx) => {
        const expired = rx.valid_until ? isOverdue(rx.valid_until) : false;
        return (
          <div key={rx.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-heading leading-tight">
                  {rx.medication_name}
                </p>
                {rx.doctor && (
                  <p className="text-xs text-muted mt-0.5">
                    Dr. {rx.doctor.name}
                    {rx.doctor.specialty ? ` · ${rx.doctor.specialty}` : ""}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {rx.issued_date && (
                    <span className="text-xs text-muted">
                      Issued: {formatDate(rx.issued_date)}
                    </span>
                  )}
                  {rx.valid_until && (
                    <span
                      className={`text-xs font-medium ${
                        expired ? "text-red-600" : "text-muted"
                      }`}
                    >
                      Valid until: {formatDate(rx.valid_until)}
                    </span>
                  )}
                </div>
                {rx.notes && (
                  <p className="text-xs text-muted mt-1 italic">{rx.notes}</p>
                )}
              </div>
              {expired && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
                  Expired
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
