import { v4 as uuid } from 'uuid'
import type { QuarterPlan } from './types'

export function createSeedPlans(): QuarterPlan[] {
  const now = new Date().toISOString()

  return [
    // Active Q1 2026 plan
    {
      id: uuid(),
      year: 2026,
      quarter: 1,
      status: 'active',
      targetPipelineUSD: 200,
      targetWonUSD: 50,
      targetFeesUSD: 1.5,
      targetNewContacts: 10,
      targetInteractionsPerWeek: 8,
      targetMeetingsPerWeek: 3,
      strategicPriorities: [
        'Consolidar pipeline Perú',
        'Expandir contactos Colombia',
        'Cerrar Hospital Maipú',
      ],
      milestones: [
        {
          id: uuid(),
          name: 'Propuesta Transporte Bogotá',
          targetDate: '2026-02-28',
          achieved: false,
          actions: [],
        },
        {
          id: uuid(),
          name: 'Site visit Lima',
          targetDate: '2026-03-15',
          achieved: false,
          actions: [],
        },
      ],
      budgetUSD: 15000,
      notes: 'Foco en cerrar oportunidades avanzadas y generar pipeline fresco en Colombia.',
      createdAt: '2026-01-05T10:00:00.000Z',
      updatedAt: now,
    },
    // Closed Q4 2025 plan
    {
      id: uuid(),
      year: 2025,
      quarter: 4,
      status: 'closed',
      targetPipelineUSD: 180,
      targetWonUSD: 40,
      targetFeesUSD: 1.2,
      targetNewContacts: 8,
      targetInteractionsPerWeek: 7,
      targetMeetingsPerWeek: 2,
      strategicPriorities: [
        'Cerrar Hospital Maipú fase 1',
        'Generar pipeline Perú',
        'Primer contacto Colombia',
      ],
      milestones: [
        {
          id: uuid(),
          name: 'Reunión Ministerio Salud Chile',
          targetDate: '2025-11-15',
          achieved: true,
          achievedDate: '2025-11-14',
          actions: [],
        },
        {
          id: uuid(),
          name: 'Propuesta Metro Lima L3',
          targetDate: '2025-12-01',
          achieved: true,
          achievedDate: '2025-11-28',
          actions: [],
        },
      ],
      budgetUSD: 12000,
      notes: 'Trimestre enfocado en Chile y primeros pasos en Perú/Colombia.',
      createdAt: '2025-10-01T10:00:00.000Z',
      updatedAt: '2025-12-31T23:59:59.000Z',
      closedAt: '2025-12-31T23:59:59.000Z',
    },
  ]
}
