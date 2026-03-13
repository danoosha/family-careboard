"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AddAppointmentForm from "./AddAppointmentForm";
import AddPreventiveForm from "./AddPreventiveForm";
import AddPrescriptionForm from "./AddPrescriptionForm";
import AddReferralForm from "./AddReferralForm";
import AddTestResultForm from "./AddTestResultForm";
import AddDoctorForm from "./AddDoctorForm";
import AddDocumentForm from "./AddDocumentForm";

type FormKey =
  | "appointment"
  | "preventive"
  | "prescription"
  | "referral"
  | "test_result"
  | "doctor"
  | "document"
  | null;

const MENU_ITEMS: {
  key: Exclude<FormKey, null>;
  icon: string;
  label: string;
}[] = [
  { key: "appointment", icon: "🩺", label: "Appointment" },
  { key: "preventive", icon: "🔔", label: "Preventive check" },
  { key: "prescription", icon: "📄", label: "Prescription" },
  { key: "referral", icon: "📨", label: "Referral" },
  { key: "test_result", icon: "🧪", label: "Test result" },
  { key: "doctor", icon: "👨‍⚕️", label: "Doctor" },
  { key: "document", icon: "📁", label: "Document" },
];

const FORM_TITLES: Record<Exclude<FormKey, null>, string> = {
  appointment: "Add Appointment",
  preventive: "Add Preventive Check",
  prescription: "Add Prescription",
  referral: "Add Referral",
  test_result: "Add Test Result",
  doctor: "Add Doctor",
  document: "Add Document",
};

export default function AddMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<FormKey>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedForm = searchParams.get("add");
  const requestedJourneyId = searchParams.get("journey");
  const pathParts = pathname.split("/");
  const personIdFromPath =
    pathParts[1] === "people" && pathParts[2] ? pathParts[2] : "";

  useEffect(() => {
    if (requestedForm === "appointment") {
      setOpen(false);
      setActive("appointment");
    }
  }, [requestedForm]);

  function closeAll() {
    setOpen(false);
    setActive(null);

    if (requestedForm) {
      router.replace(pathname);
    }
  }

  function handleSuccess() {
    closeAll();
    router.refresh();
  }

  function openForm(key: Exclude<FormKey, null>) {
    setOpen(false);
    setActive(key);
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[#3A3370] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Add"
      >
        <Plus
          size={26}
          strokeWidth={2.5}
          className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          className="fixed bottom-36 right-4 z-50 bg-white rounded-3xl shadow-card overflow-hidden w-52"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          {MENU_ITEMS.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => openForm(key)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-heading hover:bg-surface transition-colors border-b border-border last:border-0"
            >
              <span className="text-base w-6">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {active && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={closeAll}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-card max-h-[90dvh] overflow-y-auto"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-extrabold text-heading">
                {FORM_TITLES[active]}
              </h2>
              <button
                onClick={closeAll}
                className="p-1.5 rounded-full bg-surface"
              >
                <X size={16} className="text-muted" />
              </button>
            </div>

            <div className="px-5 py-5">
              {active === "appointment" ? (
                <AddAppointmentForm
                  onSuccess={handleSuccess}
                  onCancel={closeAll}
                  initialPersonId={personIdFromPath}
                  initialCareJourneyId={requestedJourneyId || ""}
                />
              ) : active === "preventive" ? (
                <AddPreventiveForm
                  onSuccess={handleSuccess}
                  onCancel={closeAll}
                />
              ) : active === "prescription" ? (
                <AddPrescriptionForm
                  onSuccess={handleSuccess}
                  onCancel={closeAll}
                />
              ) : active === "referral" ? (
                <AddReferralForm
                  onSuccess={handleSuccess}
                  onCancel={closeAll}
                />
              ) : active === "test_result" ? (
                <AddTestResultForm
                  onSuccess={handleSuccess}
                  onCancel={closeAll}
                />
              ) : active === "doctor" ? (
                <AddDoctorForm onSuccess={handleSuccess} onCancel={closeAll} />
              ) : active === "document" ? (
                <AddDocumentForm
                  onSuccess={handleSuccess}
                  onCancel={closeAll}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}
