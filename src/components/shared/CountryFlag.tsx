/**
 * Renders a country flag emoji from ISO 3166-1 alpha-2 code.
 * Uses Unicode Regional Indicator Symbols (no external dependencies).
 */
export default function CountryFlag({
  code,
  size = 'md',
}: {
  code: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const flag = countryCodeToFlag(code)
  const sizeClass = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }[size]

  return (
    <span className={sizeClass} role="img" aria-label={`Flag of ${code}`}>
      {flag}
    </span>
  )
}

function countryCodeToFlag(code: string): string {
  const upper = code.toUpperCase()
  if (upper.length !== 2) return '🏳️'
  const codePoints = [...upper].map(
    (c) => 0x1f1e6 + c.charCodeAt(0) - 65,
  )
  return String.fromCodePoint(...codePoints)
}
