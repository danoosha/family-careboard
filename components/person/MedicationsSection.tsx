import EmptyState from "@/components/ui/EmptyState";

interface MedicationsSectionProps {
  medications: any[];
}

export default function MedicationsSection({
  medications = [],
}: MedicationsSectionProps) {
  const active = medications.filter((m) => m?.active !== false);
  const inactive = medications.filter((m) => m?.active === false);

  if (!medications || medications.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-card">
        <EmptyState icon="💊" title="No medications" compact />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.length > 0 && (
        <div className="bg-white rounded-3xl shadow-card divide-y divide-border">
          {active.map((med, index) => (
            <MedRow key={med.id ?? index} med={med} />
          ))}
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2 px-1">
            Past / Inactive
          </p>
          <div className="bg-white rounded-3xl shadow-card divide-y divide-border opacity-60">
            {inactive.map((med, index) => (
              <MedRow key={med.id ?? index} med={med} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MedRow({ med }: { med: any }) {
  const name =
    med.medication_name ??
    med.name ??
    "Unnamed medication";

  const dose =
    med.dose ??
    med.dosage ??
    "";

  const schedule =
    med.schedule_text ??
    med.schedule ??
    med.frequency ??
    "";

  const purpose =
    med.purpose ??
    "";

  const notes =
    med.notes ??
    "";

  const isActive = med.active !== false;

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-[#EAF5D8] flex items-center justify-center flex-shrink-0">
        <span className="text-sm">💊</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-heading leading-tight">
          {name}
        </p>

        {(dose || schedule) && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {dose && <span className="text-xs text-muted">{dose}</span>}
            {schedule && (
              <span className="text-xs text-muted">· {schedule}</span>
            )}
          </div>
        )}

        {purpose && (
          <p className="text-xs text-muted mt-0.5">{purpose}</p>
        )}

        {notes && (
          <p className="text-xs text-muted mt-0.5 italic">{notes}</p>
        )}
      </div>

      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
          isActive
            ? "bg-emerald-100 text-emerald-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {isActive ? "Active" : "Stopped"}
      </span>
    </div>
  );
}