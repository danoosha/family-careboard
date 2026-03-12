import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, parseISO, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd MMM yyyy, HH:mm')
  } catch {
    return '—'
  }
}

export function getRelativeDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    const d = parseISO(date)
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    const diff = differenceInDays(d, new Date())
    if (diff < 0) return `${Math.abs(diff)}d ago`
    if (diff < 7) return `In ${diff}d`
    return format(d, 'dd MMM')
  } catch {
    return '—'
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(200,200,200,${alpha})`
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`
}

export function darken(hex: string, amount = 0.2): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = Math.max(0, Math.round(parseInt(result[1], 16) * (1 - amount)))
  const g = Math.max(0, Math.round(parseInt(result[2], 16) * (1 - amount)))
  const b = Math.max(0, Math.round(parseInt(result[3], 16) * (1 - amount)))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}
