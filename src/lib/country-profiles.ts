import { v4 as uuid } from 'uuid'
import type { CountryProfile } from './types'

export const DEFAULT_COUNTRY_PROFILES: CountryProfile[] = [
  // Active markets
  {
    id: uuid(),
    code: 'CL',
    name: 'Chile',
    currency: 'CLP',
    vatRate: 0.19,
    active: true,
    timezone: 'America/Santiago',
    locale: 'es-CL',
  },
  {
    id: uuid(),
    code: 'PE',
    name: 'Perú',
    currency: 'PEN',
    vatRate: 0.18,
    active: true,
    timezone: 'America/Lima',
    locale: 'es-PE',
  },
  {
    id: uuid(),
    code: 'CO',
    name: 'Colombia',
    currency: 'COP',
    vatRate: 0.19,
    active: true,
    timezone: 'America/Bogota',
    locale: 'es-CO',
  },

  // Inactive markets (available for activation)
  {
    id: uuid(),
    code: 'BR',
    name: 'Brasil',
    currency: 'BRL',
    vatRate: 0.17,
    active: false,
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
  },
  {
    id: uuid(),
    code: 'MX',
    name: 'México',
    currency: 'MXN',
    vatRate: 0.16,
    active: false,
    timezone: 'America/Mexico_City',
    locale: 'es-MX',
  },
  {
    id: uuid(),
    code: 'PA',
    name: 'Panamá',
    currency: 'PAB',
    vatRate: 0.07,
    active: false,
    timezone: 'America/Panama',
    locale: 'es-PA',
  },
  {
    id: uuid(),
    code: 'AR',
    name: 'Argentina',
    currency: 'ARS',
    vatRate: 0.21,
    active: false,
    timezone: 'America/Buenos_Aires',
    locale: 'es-AR',
  },
]
