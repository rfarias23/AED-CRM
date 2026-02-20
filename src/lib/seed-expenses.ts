import { v4 as uuid } from 'uuid'
import type { Expense } from './types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export function createSeedExpenses(): Expense[] {
  const now = new Date().toISOString()

  return [
    {
      id: uuid(), date: daysAgo(5), type: 'travel',
      description: 'Vuelo Santiago → Antofagasta (visita Atacama III)',
      vendor: 'LATAM Airlines', amountOriginal: 185000, currency: 'CLP',
      amountUSD: 194.74, tags: ['chile', 'mining'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(5), type: 'accommodation',
      description: 'Hotel 2 noches Antofagasta — reunión Minera Escondida',
      vendor: 'Hotel Antofagasta', amountOriginal: 120000, currency: 'CLP',
      amountUSD: 126.32, tags: ['chile', 'mining'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(12), type: 'travel',
      description: 'Vuelo Santiago → Lima (Central Solar Moquegua)',
      vendor: 'LATAM Airlines', amountOriginal: 320, currency: 'USD',
      amountUSD: 320, tags: ['peru', 'energy'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(12), type: 'meals',
      description: 'Almuerzo de negocios con equipo Engie Perú',
      vendor: 'Restaurante Central', amountOriginal: 450, currency: 'PEN',
      amountUSD: 120, tags: ['peru', 'entertainment'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(20), type: 'travel',
      description: 'Vuelo Santiago → Bogotá (Metro Bogotá + Puerto Barranquilla)',
      vendor: 'Avianca', amountOriginal: 480, currency: 'USD',
      amountUSD: 480, tags: ['colombia', 'infrastructure'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(18), type: 'accommodation',
      description: 'Hotel 3 noches Bogotá — reuniones ANI y Metro',
      vendor: 'Hotel Dann Carlton', amountOriginal: 1200000, currency: 'COP',
      amountUSD: 285.71, tags: ['colombia'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(30), type: 'subscriptions',
      description: 'Suscripción anual BNAmericas (inteligencia de mercado)',
      vendor: 'BNAmericas', amountOriginal: 1800, currency: 'USD',
      amountUSD: 1800, tags: ['tools', 'market-intelligence'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(8), type: 'representation',
      description: 'Almuerzo networking Club de la Unión — contactos Colbún',
      vendor: 'Club de la Unión', amountOriginal: 95000, currency: 'CLP',
      amountUSD: 100, tags: ['chile', 'networking'],
      createdAt: now,
    },
    {
      id: uuid(), date: daysAgo(3), type: 'communication',
      description: 'Pack roaming internacional 30 días (Chile/Perú/Colombia)',
      vendor: 'Entel', amountOriginal: 29990, currency: 'CLP',
      amountUSD: 31.57, tags: ['telecom'],
      createdAt: now,
    },
  ]
}
