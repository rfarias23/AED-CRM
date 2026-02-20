import type { Currency, ExchangeRate } from './types'

// ── Currency Metadata ────────────────────────────

interface CurrencyMeta {
  symbol: string
  decimals: number
  locale: string
  name: string
}

const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  // North America
  USD: { symbol: 'US$', decimals: 2, locale: 'en-US', name: 'US Dollar' },
  CAD: { symbol: 'C$', decimals: 2, locale: 'en-CA', name: 'Canadian Dollar' },
  MXN: { symbol: 'MX$', decimals: 2, locale: 'es-MX', name: 'Mexican Peso' },

  // Central America & Caribbean
  GTQ: { symbol: 'Q', decimals: 2, locale: 'es-GT', name: 'Guatemalan Quetzal' },
  HNL: { symbol: 'L', decimals: 2, locale: 'es-HN', name: 'Honduran Lempira' },
  NIO: { symbol: 'C$', decimals: 2, locale: 'es-NI', name: 'Nicaraguan Córdoba' },
  CRC: { symbol: '₡', decimals: 0, locale: 'es-CR', name: 'Costa Rican Colón' },
  PAB: { symbol: 'B/.', decimals: 2, locale: 'es-PA', name: 'Panamanian Balboa' },
  BZD: { symbol: 'BZ$', decimals: 2, locale: 'en-BZ', name: 'Belize Dollar' },
  SVC: { symbol: '₡', decimals: 2, locale: 'es-SV', name: 'Salvadoran Colón' },
  DOP: { symbol: 'RD$', decimals: 2, locale: 'es-DO', name: 'Dominican Peso' },
  HTG: { symbol: 'G', decimals: 2, locale: 'fr-HT', name: 'Haitian Gourde' },
  JMD: { symbol: 'J$', decimals: 2, locale: 'en-JM', name: 'Jamaican Dollar' },
  TTD: { symbol: 'TT$', decimals: 2, locale: 'en-TT', name: 'Trinidad & Tobago Dollar' },
  CUP: { symbol: '₱', decimals: 2, locale: 'es-CU', name: 'Cuban Peso' },
  BBD: { symbol: 'Bds$', decimals: 2, locale: 'en-BB', name: 'Barbadian Dollar' },
  BSD: { symbol: 'B$', decimals: 2, locale: 'en-BS', name: 'Bahamian Dollar' },
  AWG: { symbol: 'Afl.', decimals: 2, locale: 'nl-AW', name: 'Aruban Florin' },
  ANG: { symbol: 'NAƒ', decimals: 2, locale: 'nl-CW', name: 'Netherlands Antillean Guilder' },
  KYD: { symbol: 'CI$', decimals: 2, locale: 'en-KY', name: 'Cayman Islands Dollar' },
  XCD: { symbol: 'EC$', decimals: 2, locale: 'en-AG', name: 'East Caribbean Dollar' },
  BMD: { symbol: 'BD$', decimals: 2, locale: 'en-BM', name: 'Bermudian Dollar' },

  // South America
  BRL: { symbol: 'R$', decimals: 2, locale: 'pt-BR', name: 'Brazilian Real' },
  ARS: { symbol: 'AR$', decimals: 2, locale: 'es-AR', name: 'Argentine Peso' },
  CLP: { symbol: '$', decimals: 0, locale: 'es-CL', name: 'Chilean Peso' },
  PEN: { symbol: 'S/', decimals: 2, locale: 'es-PE', name: 'Peruvian Sol' },
  COP: { symbol: 'COL$', decimals: 0, locale: 'es-CO', name: 'Colombian Peso' },
  UYU: { symbol: '$U', decimals: 2, locale: 'es-UY', name: 'Uruguayan Peso' },
  PYG: { symbol: '₲', decimals: 0, locale: 'es-PY', name: 'Paraguayan Guaraní' },
  BOB: { symbol: 'Bs', decimals: 2, locale: 'es-BO', name: 'Bolivian Boliviano' },
  VES: { symbol: 'Bs.D', decimals: 2, locale: 'es-VE', name: 'Venezuelan Bolívar' },
  GYD: { symbol: 'G$', decimals: 2, locale: 'en-GY', name: 'Guyanese Dollar' },
  SRD: { symbol: 'Sr$', decimals: 2, locale: 'nl-SR', name: 'Surinamese Dollar' },
  FKP: { symbol: 'FK£', decimals: 2, locale: 'en-FK', name: 'Falkland Islands Pound' },

  // Special
  UF: { symbol: 'UF', decimals: 4, locale: 'es-CL', name: 'Unidad de Fomento' },
  EUR: { symbol: '€', decimals: 2, locale: 'de-DE', name: 'Euro' },
}

// ── Conversion Functions ─────────────────────────

/**
 * Build a lookup map from ExchangeRate[] for O(1) access.
 * Key format: "CLP->USD"
 */
export function buildRateMap(rates: ExchangeRate[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of rates) {
    map.set(`${r.fromCurrency}->${r.toCurrency}`, r.rate)
  }
  return map
}

/**
 * Convert an amount from any currency to USD.
 * Returns the amount in USD.
 */
export function convertToUSD(
  amount: number,
  fromCurrency: Currency,
  rateMap: Map<string, number>,
): number {
  if (fromCurrency === 'USD') return amount
  const rate = rateMap.get(`${fromCurrency}->USD`)
  if (rate === undefined) {
    throw new Error(`Exchange rate not found: ${fromCurrency} → USD`)
  }
  return amount * rate
}

/**
 * Convert an amount from USD to any currency.
 * Returns the amount in the target currency.
 */
export function convertFromUSD(
  amountUSD: number,
  toCurrency: Currency,
  rateMap: Map<string, number>,
): number {
  if (toCurrency === 'USD') return amountUSD
  const rate = rateMap.get(`${toCurrency}->USD`)
  if (rate === undefined) {
    throw new Error(`Exchange rate not found: ${toCurrency} → USD`)
  }
  if (rate === 0) throw new Error(`Exchange rate is zero for ${toCurrency}`)
  return amountUSD / rate
}

/**
 * Convert between any two currencies via USD pivot.
 */
export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  rateMap: Map<string, number>,
): number {
  if (from === to) return amount
  const usd = convertToUSD(amount, from, rateMap)
  return convertFromUSD(usd, to, rateMap)
}

// ── Formatting ───────────────────────────────────

export function getCurrencyMeta(currency: Currency): CurrencyMeta {
  return CURRENCY_META[currency]
}

/**
 * Format a monetary amount with proper locale, symbol, and decimal handling.
 *
 * @param amount - The raw amount
 * @param currency - Currency code
 * @param options - compact: use M/B suffixes; showCode: append currency code
 */
export function formatMoney(
  amount: number,
  currency: Currency,
  options: { compact?: boolean; showCode?: boolean } = {},
): string {
  const meta = CURRENCY_META[currency]
  const { compact = false, showCode = false } = options

  if (compact) {
    return formatCompactMoney(amount, meta, currency, showCode)
  }

  const formatted = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(amount)

  const result = `${meta.symbol} ${formatted}`
  return showCode ? `${result} ${currency}` : result
}

function formatCompactMoney(
  amount: number,
  meta: CurrencyMeta,
  currency: Currency,
  showCode: boolean,
): string {
  const abs = Math.abs(amount)
  let value: number
  let suffix: string

  if (abs >= 1_000_000_000) {
    value = amount / 1_000_000_000
    suffix = 'B'
  } else if (abs >= 1_000_000) {
    value = amount / 1_000_000
    suffix = 'M'
  } else if (abs >= 1_000) {
    value = amount / 1_000
    suffix = 'K'
  } else {
    value = amount
    suffix = ''
  }

  const formatted = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: suffix ? 1 : meta.decimals,
  }).format(value)

  const result = `${meta.symbol} ${formatted}${suffix}`
  return showCode ? `${result} ${currency}` : result
}

/**
 * Format a dual-currency display: "CLP 42.750M / USD 45M"
 * Only shows dual when original ≠ USD.
 */
export function formatDualCurrency(
  amountOriginal: number,
  currencyOriginal: Currency,
  amountUSD: number,
  options: { compact?: boolean } = {},
): string {
  const { compact = true } = options
  const original = formatMoney(amountOriginal, currencyOriginal, { compact, showCode: false })

  if (currencyOriginal === 'USD') return original

  const usd = formatMoney(amountUSD, 'USD', { compact, showCode: false })
  return `${original} ${currencyOriginal} / ${usd} USD`
}
