/**
 * Reusable currency formatting utility for Tamale Daa.
 * All prices are displayed in Ghana cedis (GH₵).
 * Do not change numeric values — only the display symbol.
 */

const CURRENCY_SYMBOL = 'GH₵'

/**
 * Format a numeric value as a currency string with GH₵ symbol.
 * @param value - The numeric amount to format
 * @returns Formatted string, e.g. "GH₵12.50"
 */
export function formatCurrency(value: number | undefined | null): string {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0
  return `${CURRENCY_SYMBOL}${num.toFixed(2)}`
}
