export type CryptoNetwork = 'ERC-20' | 'TRC-20' | 'BEP-20' | 'BTC' | 'ETH' | 'USDT-TRC20' | 'USDT-ERC20' | string

const patterns: Record<string, RegExp> = {
  // Bitcoin: P2PKH (1...), P2SH (3...), bech32 (bc1...)
  BTC: /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/,
  // Ethereum / EVM-compatible (0x + 40 hex chars)
  ETH: /^0x[a-fA-F0-9]{40}$/,
  // USDT ERC-20 / BEP-20 (same format as ETH)
  'USDT-ERC20': /^0x[a-fA-F0-9]{40}$/,
  'USDT-BEP20': /^0x[a-fA-F0-9]{40}$/,
  // USDT TRC-20 (Tron): starts with T, base58, 34 chars
  'USDT-TRC20': /^T[a-km-zA-HJ-NP-Z1-9]{33}$/,
}

export function validateCryptoAddress(address: string, currency: string, network?: string): { valid: boolean; error?: string } {
  if (!address || address.trim().length < 10) {
    return { valid: false, error: 'Address is too short' }
  }

  const key = network
    ? `${currency.toUpperCase()}-${network.toUpperCase().replace(/[-\s]/g, '')}`
    : currency.toUpperCase()

  const pattern = patterns[key] ?? patterns[currency.toUpperCase()]

  if (!pattern) {
    // No specific pattern — just ensure minimum length and basic structure
    if (address.length < 20) return { valid: false, error: 'Address appears too short' }
    return { valid: true }
  }

  if (!pattern.test(address.trim())) {
    return {
      valid: false,
      error: `Invalid ${currency}${network ? ` (${network})` : ''} address format`,
    }
  }

  return { valid: true }
}

export function detectNetworkFromAddress(address: string): string | null {
  if (!address) return null
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'ERC-20 / BEP-20'
  if (/^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(address)) return 'TRC-20'
  if (/^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/.test(address)) return 'Bitcoin'
  return null
}
