export type DoctorSpecialtyOption = {
  value: string;
  label: string;
  icon: string;
  colorClass: string;
  bgClass: string;
};

export const DOCTOR_SPECIALTIES: DoctorSpecialtyOption[] = [
  {
    value: "General Medicine",
    label: "General Medicine",
    icon: "🩺",
    colorClass: "text-slate-700",
    bgClass: "bg-slate-100",
  },
  {
    value: "Pediatrics",
    label: "Pediatrics",
    icon: "👱‍♀️",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-100",
  },
  {
    value: "Gynecology",
    label: "Gynecology",
    icon: "🌸",
    colorClass: "text-pink-700",
    bgClass: "bg-pink-100",
  },
  {
    value: "ENT",
    label: "ENT",
    icon: "👂",
    colorClass: "text-orange-700",
    bgClass: "bg-orange-100",
  },
  {
    value: "Ophthalmology",
    label: "Ophthalmology",
    icon: "👁️",
    colorClass: "text-blue-700",
    bgClass: "bg-blue-100",
  },
  {
    value: "Dermatology",
    label: "Dermatology",
    icon: "🧴",
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-100",
  },
  {
    value: "Gastroenterology",
    label: "Gastroenterology",
    icon: "🫃",
    colorClass: "text-violet-700",
    bgClass: "bg-violet-100",
  },
  {
    value: "Psychiatry",
    label: "Psychiatry",
    icon: "🧠",
    colorClass: "text-fuchsia-700",
    bgClass: "bg-fuchsia-100",
  },
  {
    value: "Psychology",
    label: "Psychology",
    icon: "💬",
    colorClass: "text-cyan-700",
    bgClass: "bg-cyan-100",
  },
  {
    value: "Speech Therapy",
    label: "Speech Therapy",
    icon: "🗣️",
    colorClass: "text-lime-700",
    bgClass: "bg-lime-100",
  },
  {
    value: "Dentistry",
    label: "Dentistry",
    icon: "🦷",
    colorClass: "text-teal-700",
    bgClass: "bg-teal-100",
  },
  {
    value: "Orthopedics",
    label: "Orthopedics",
    icon: "🦴",
    colorClass: "text-stone-700",
    bgClass: "bg-stone-100",
  },
  {
    value: "Neurology",
    label: "Neurology",
    icon: "⚡",
    colorClass: "text-indigo-700",
    bgClass: "bg-indigo-100",
  },
  {
    value: "Cardiology",
    label: "Cardiology",
    icon: "❤️",
    colorClass: "text-rose-700",
    bgClass: "bg-rose-100",
  },
  {
    value: "Endocrinology",
    label: "Endocrinology",
    icon: "🧪",
    colorClass: "text-sky-700",
    bgClass: "bg-sky-100",
  },
];

export function getSpecialtyMeta(specialty?: string | null) {
  const found = DOCTOR_SPECIALTIES.find((s) => s.value === specialty);

  return (
    found || {
      value: specialty || "Other",
      label: specialty || "Other",
      icon: "🩺",
      colorClass: "text-slate-700",
      bgClass: "bg-slate-100",
    }
  );
}