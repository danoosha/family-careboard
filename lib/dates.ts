import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "d MMM");
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "d MMM, HH:mm");
  } catch {
    return dateStr;
  }
}

export function getDateLabel(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    const diff = differenceInDays(d, new Date());
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    if (diff < 7) return `In ${diff} days`;
    return format(d, "d MMM");
  } catch {
    return dateStr;
  }
}

export function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    return isPast(new Date(dateStr));
  } catch {
    return false;
  }
}
