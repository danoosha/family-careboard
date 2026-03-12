import type { PersonColor } from "@/types";

export const PERSON_COLORS: Record<
  PersonColor,
  {
    bg: string;       // card background
    light: string;    // lighter tint
    border: string;   // border color
    text: string;     // text on light bg
    dot: string;      // timeline dot / tag
    badge: string;    // badge classes (tailwind)
  }
> = {
  dana: {
    bg: "#C7E6A3",
    light: "#EAF5D8",
    border: "#B0D485",
    text: "#3A6B1A",
    dot: "#8DBF5A",
    badge: "bg-[#EAF5D8] text-[#3A6B1A]",
  },
  jenny: {
    bg: "#D4A017",
    light: "#F5E8C0",
    border: "#C49010",
    text: "#6B4E0A",
    dot: "#D4A017",
    badge: "bg-[#F5E8C0] text-[#6B4E0A]",
  },
  lia: {
    bg: "#E8A0A6",
    light: "#F7DCDE",
    border: "#D4787F",
    text: "#7A2730",
    dot: "#C45E67",
    badge: "bg-[#F7DCDE] text-[#7A2730]",
  },
  ahuva: {
    bg: "#C9C3E6",
    light: "#EAE8F7",
    border: "#A89FD4",
    text: "#3A3370",
    dot: "#8B82C4",
    badge: "bg-[#EAE8F7] text-[#3A3370]",
  },
};

export function getPersonColors(color: PersonColor) {
  return PERSON_COLORS[color] ?? PERSON_COLORS.dana;
}

export const ALERT_COLORS = {
  error:   { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  warning: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  info:    { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
};

export const PREVENTIVE_STATUS_COLORS: Record<string, string> = {
  ok:       "bg-emerald-100 text-emerald-700",
  due_soon: "bg-amber-100  text-amber-700",
  overdue:  "bg-red-100    text-red-700",
  missing:  "bg-gray-100   text-gray-600",
};

export const REFERRAL_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100  text-amber-700",
  scheduled: "bg-blue-100   text-blue-700",
  done:      "bg-emerald-100 text-emerald-700",
  expired:   "bg-gray-100   text-gray-500",
};
