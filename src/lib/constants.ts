import { v4 as uuid } from 'uuid'
import type { ExchangeRate, FeeStructure, WithholdingProfile } from './types'

// ── Exchange Rates (to USD) ──────────────────────
// Rate: 1 local = rate USD (i.e., how many USD per 1 unit of local)
// Updated manually — source: approximate market rates Feb 2026

export const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  // USD identity
  { id: uuid(), fromCurrency: 'USD', toCurrency: 'USD', rate: 1, updatedAt: '2026-02-01', source: 'fixed' },

  // North America
  { id: uuid(), fromCurrency: 'CAD', toCurrency: 'USD', rate: 0.74, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'MXN', toCurrency: 'USD', rate: 0.055, updatedAt: '2026-02-01', source: 'manual' },

  // South America — active markets
  { id: uuid(), fromCurrency: 'CLP', toCurrency: 'USD', rate: 0.00105, updatedAt: '2026-02-01', source: 'BCCh' },
  { id: uuid(), fromCurrency: 'PEN', toCurrency: 'USD', rate: 0.265, updatedAt: '2026-02-01', source: 'SBS' },
  { id: uuid(), fromCurrency: 'COP', toCurrency: 'USD', rate: 0.000245, updatedAt: '2026-02-01', source: 'BanRep' },
  { id: uuid(), fromCurrency: 'BRL', toCurrency: 'USD', rate: 0.175, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'ARS', toCurrency: 'USD', rate: 0.00098, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'UYU', toCurrency: 'USD', rate: 0.024, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'PYG', toCurrency: 'USD', rate: 0.000154, updatedAt: '2026-02-20', source: 'BCP' },
  { id: uuid(), fromCurrency: 'BOB', toCurrency: 'USD', rate: 0.145, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'VES', toCurrency: 'USD', rate: 0.027, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'GYD', toCurrency: 'USD', rate: 0.00478, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'SRD', toCurrency: 'USD', rate: 0.028, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'FKP', toCurrency: 'USD', rate: 1.27, updatedAt: '2026-02-01', source: 'manual' },

  // Central America & Caribbean
  { id: uuid(), fromCurrency: 'GTQ', toCurrency: 'USD', rate: 0.129, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'HNL', toCurrency: 'USD', rate: 0.040, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'NIO', toCurrency: 'USD', rate: 0.027, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'CRC', toCurrency: 'USD', rate: 0.00194, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'PAB', toCurrency: 'USD', rate: 1, updatedAt: '2026-02-01', source: 'fixed' },
  { id: uuid(), fromCurrency: 'BZD', toCurrency: 'USD', rate: 0.496, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'SVC', toCurrency: 'USD', rate: 0.114, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'DOP', toCurrency: 'USD', rate: 0.017, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'HTG', toCurrency: 'USD', rate: 0.0076, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'JMD', toCurrency: 'USD', rate: 0.0064, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'TTD', toCurrency: 'USD', rate: 0.148, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'CUP', toCurrency: 'USD', rate: 0.042, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'BBD', toCurrency: 'USD', rate: 0.50, updatedAt: '2026-02-01', source: 'fixed' },
  { id: uuid(), fromCurrency: 'BSD', toCurrency: 'USD', rate: 1, updatedAt: '2026-02-01', source: 'fixed' },
  { id: uuid(), fromCurrency: 'AWG', toCurrency: 'USD', rate: 0.558, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'ANG', toCurrency: 'USD', rate: 0.558, updatedAt: '2026-02-01', source: 'manual' },
  { id: uuid(), fromCurrency: 'KYD', toCurrency: 'USD', rate: 1.22, updatedAt: '2026-02-01', source: 'fixed' },
  { id: uuid(), fromCurrency: 'XCD', toCurrency: 'USD', rate: 0.37, updatedAt: '2026-02-01', source: 'fixed' },
  { id: uuid(), fromCurrency: 'BMD', toCurrency: 'USD', rate: 1, updatedAt: '2026-02-01', source: 'fixed' },

  // Special
  { id: uuid(), fromCurrency: 'UF', toCurrency: 'USD', rate: 39.5, updatedAt: '2026-02-01', source: 'BCCh' },
  { id: uuid(), fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.08, updatedAt: '2026-02-01', source: 'manual' },
]

// ── Fee Structures ───────────────────────────────

export const DEFAULT_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: uuid(),
    name: 'ASCH Default',
    isDefault: true,
    scope: { type: 'global' },
    tiers: [
      { label: 'Tier 1', minMillions: 0, maxMillions: 40, rate: 0.03 },
      { label: 'Tier 2', minMillions: 40, maxMillions: 60, rate: 0.02 },
      { label: 'Tier 3', minMillions: 60, maxMillions: Infinity, rate: 0.0125 },
    ],
    effectiveDate: '2024-01-01',
    notes: 'Standard ASCH SPA success fee structure: 3%/2%/1.25%',
  },
  {
    id: uuid(),
    name: 'Adenda Perú',
    isDefault: false,
    scope: { type: 'country', country: 'PE' },
    tiers: [
      { label: 'Tier 1', minMillions: 0, maxMillions: 30, rate: 0.035 },
      { label: 'Tier 2', minMillions: 30, maxMillions: 50, rate: 0.025 },
      { label: 'Tier 3', minMillions: 50, maxMillions: Infinity, rate: 0.015 },
    ],
    effectiveDate: '2025-06-01',
    notes: 'Peru-specific fee schedule: 3.5%/2.5%/1.5%',
  },
]

// ── Withholding Profiles ─────────────────────────

export const DEFAULT_WITHHOLDING_PROFILES: WithholdingProfile[] = [
  {
    id: uuid(),
    jurisdictionCountry: 'CL',
    name: 'Chile — Retención',
    scenarios: [
      {
        name: 'Art. 59 (15%)',
        rate: 0.15,
        description: 'Servicios técnicos y profesionales prestados desde el exterior',
        isDefault: true,
      },
      {
        name: 'Art. 60 (35%)',
        rate: 0.35,
        description: 'Rentas de fuente chilena sin convenio aplicable',
        isDefault: false,
      },
    ],
    notes: 'Ley de Impuesto a la Renta, Chile. La tasa depende de la naturaleza del servicio y si existe convenio de doble tributación.',
  },
  {
    id: uuid(),
    jurisdictionCountry: 'PE',
    name: 'Perú — Retención',
    scenarios: [
      {
        name: 'Art. 76 (15%)',
        rate: 0.15,
        description: 'Asistencia técnica calificada como tal por SUNAT',
        isDefault: true,
      },
      {
        name: 'Art. 76 (30%)',
        rate: 0.30,
        description: 'Servicios generales prestados desde el exterior',
        isDefault: false,
      },
    ],
    notes: 'Ley del Impuesto a la Renta, Perú. Tasa reducida para asistencia técnica calificada.',
  },
  {
    id: uuid(),
    jurisdictionCountry: 'CO',
    name: 'Colombia — Retención',
    scenarios: [
      {
        name: 'Art. 408 (15%)',
        rate: 0.15,
        description: 'Asistencia técnica, servicios técnicos y consultoría',
        isDefault: true,
      },
      {
        name: 'Art. 408 (20%)',
        rate: 0.20,
        description: 'Servicios generales desde el exterior sin convenio',
        isDefault: false,
      },
    ],
    notes: 'Estatuto Tributario, Colombia. La tasa depende de la clasificación del servicio.',
  },
]
