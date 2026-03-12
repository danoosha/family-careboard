import EmptyState from "@/components/ui/EmptyState";
import { Phone, MapPin } from "lucide-react";
import type { PersonDoctor } from "@/types";

interface DoctorsSectionProps {
  personDoctors: PersonDoctor[];
}

export default function DoctorsSection({ personDoctors }: DoctorsSectionProps) {
  if (personDoctors.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card">
        <EmptyState icon="🩺" title="No doctors added" compact />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {personDoctors.map((pd) => {
        const doc = pd.doctor;
        if (!doc) return null;
        return (
          <div key={pd.id} className="bg-white rounded-3xl shadow-card p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-2xl bg-[#EAE8F7] flex items-center justify-center flex-shrink-0">
                <span className="text-base">🩺</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-heading leading-tight">{doc.name}</p>
                {doc.specialty && (
                  <p className="text-xs text-muted mt-0.5">{doc.specialty}</p>
                )}

                <div className="mt-2 space-y-1">
                  {doc.phone && (
                    <a
                      href={`tel:${doc.phone}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#3A3370]"
                    >
                      <Phone size={12} />
                      <span>{doc.phone}</span>
                    </a>
                  )}
                  {doc.address && (
                    <div className="flex items-start gap-1.5 text-xs text-muted">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{doc.address}</span>
                    </div>
                  )}
                </div>

                {pd.notes && (
                  <p className="text-xs text-muted mt-2 italic">{pd.notes}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
