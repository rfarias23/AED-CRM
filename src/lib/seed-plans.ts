import { v4 as uuid } from 'uuid'
import type { QuarterPlan } from './types'

export function createSeedPlans(): QuarterPlan[] {
  const now = new Date().toISOString()

  return [
    // Active Q1 2026 plan (ASCH framework)
    {
      id: uuid(),
      year: 2026,
      quarter: 1,
      status: 'active',

      // Pipeline Input
      pipelineBrutoUSD: 200,
      opportunidadesActivas: 12,
      pipelinePorFase: {
        identification: 3,
        qualification: 4,
        proposal: 3,
        negotiation: 2,
      },

      // Conversion
      opportunidadesEvaluadas: 8,
      opportunidadesGo: 6,
      winRateTarget: 0.25,

      // Results
      wonUSD: 15,
      lostUSD: 8,
      feesDevengadosUSD: 0.45,
      feesCobradosUSD: 0.2,

      // Vintage & Aging
      agingPromedioMeses: 7.5,
      pipelineNuevoUSD: 45,
      pipelineSalidoUSD: 23,
      velocidadPipelineMeses: 9,
      vintageWon: ['Hospital Maipú — Won Q1 2026 — Vintage Q3 2025 (6m)'],

      // Commercial Cost
      bidCostUSD: 3200,
      budgetUSD: 15000,

      // Activity
      targetNewContacts: 10,
      targetInteractionsPerWeek: 8,
      targetMeetingsPerWeek: 3,
      reunionesDecisionMakers: 4,

      // Narrative
      strategicPriorities: [
        'Consolidar pipeline Perú',
        'Expandir contactos Colombia',
        'Cerrar Hospital Maipú',
      ],
      top3Oportunidades: [
        { name: 'Central Solar Moquegua', valueUSD: 85, stage: 'proposal', pWin: 0.45, nextMilestone: 'RFP Deadline Mar 15' },
        { name: 'Metro Bogotá Línea 2', valueUSD: 120, stage: 'qualification', pWin: 0.2, nextMilestone: 'Site Visit Feb 28' },
        { name: 'Atacama III Expansión', valueUSD: 65, stage: 'negotiation', pWin: 0.6, nextMilestone: 'Firma Contrato Mar 1' },
      ],
      riesgos: [
        'Retraso en licitación Metro Bogotá por cambio de gobierno local',
        'Tipo de cambio CLP/USD desfavorable afecta competitividad en Perú',
      ],
      notes: 'Foco en cerrar oportunidades avanzadas y generar pipeline fresco en Colombia.',

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

      createdAt: '2026-01-05T10:00:00.000Z',
      updatedAt: now,
    },
    // Closed Q4 2025 plan
    {
      id: uuid(),
      year: 2025,
      quarter: 4,
      status: 'closed',

      pipelineBrutoUSD: 180,
      opportunidadesActivas: 9,
      pipelinePorFase: { identification: 2, qualification: 3, proposal: 2, negotiation: 2 },

      opportunidadesEvaluadas: 6,
      opportunidadesGo: 5,
      winRateTarget: 0.20,

      wonUSD: 40,
      lostUSD: 12,
      feesDevengadosUSD: 1.2,
      feesCobradosUSD: 0.8,

      agingPromedioMeses: 8,
      pipelineNuevoUSD: 35,
      pipelineSalidoUSD: 52,
      velocidadPipelineMeses: 10,
      vintageWon: [],

      bidCostUSD: 2800,
      budgetUSD: 12000,

      targetNewContacts: 8,
      targetInteractionsPerWeek: 7,
      targetMeetingsPerWeek: 2,
      reunionesDecisionMakers: 3,

      strategicPriorities: [
        'Cerrar Hospital Maipú fase 1',
        'Generar pipeline Perú',
        'Primer contacto Colombia',
      ],
      top3Oportunidades: [
        { name: 'Hospital Maipú', valueUSD: 45, stage: 'won', pWin: 1.0, nextMilestone: 'Contrato firmado' },
        { name: 'Metro Lima L3', valueUSD: 95, stage: 'proposal', pWin: 0.3, nextMilestone: 'Evaluación técnica' },
        { name: 'Puerto Barranquilla', valueUSD: 40, stage: 'identification', pWin: 0.15, nextMilestone: 'Primer contacto' },
      ],
      riesgos: [
        'Presupuesto público en Perú podría reducirse en 2026',
        'Competencia agresiva de firmas españolas en Colombia',
      ],
      notes: 'Trimestre enfocado en Chile y primeros pasos en Perú/Colombia.',

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

      createdAt: '2025-10-01T10:00:00.000Z',
      updatedAt: '2025-12-31T23:59:59.000Z',
      closedAt: '2025-12-31T23:59:59.000Z',
    },
  ]
}
