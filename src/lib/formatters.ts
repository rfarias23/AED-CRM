import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Format an ISO date string to a localized display format.
 * Default: "15 feb 2026"
 */
export function formatDate(
  isoDate: string,
  pattern: string = 'd MMM yyyy',
): string {
  return format(parseISO(isoDate), pattern, { locale: es })
}

/**
 * Format relative time: "hace 3 días"
 */
export function formatRelativeDate(isoDate: string): string {
  return formatDistanceToNow(parseISO(isoDate), {
    addSuffix: true,
    locale: es,
  })
}

/**
 * Format a percentage: 0.15 → "15.0%"
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format a number compactly: 1234567 → "1.2M"
 */
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

/**
 * Format a number with thousands separator.
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
): string {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
