// lib/currency.ts
// Robust Brazilian Real (BRL) monetary parsing and formatting utilities

/**
 * Intelligently parses any Brazilian currency representation into a clean JavaScript number.
 * 
 * Handles all real-world Brazilian formats, including:
 * - "1.575" -> 1575 (single dot with 3 digits is a thousands separator in BR)
 * - "1.575,00" -> 1575
 * - "1.575,50" -> 1575.5
 * - "1575,50" -> 1575.5
 * - "1575,00" -> 1575
 * - "1575.50" -> 1575.5
 * - "1575" -> 1575
 * - "1.500.000,00" -> 1500000
 * - "R$ 1.575,00" -> 1575
 * - "R$ 1.575" -> 1575
 * - "35" -> 35
 * - "0,50" -> 0.5
 * - ",50" -> 0.5
 * - 1575 -> 1575
 */
export function parseBrlMoney(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }

  let str = String(val).trim();
  if (!str || str === '-' || str === 'R$' || str === 'R$ -') return 0;

  // Remove currency prefix "R$", "R $", spaces and non-breaking spaces
  str = str.replace(/R\$\s*/gi, '').replace(/\s+/g, '').replace(/\u00A0/g, '').trim();
  if (!str) return 0;

  // If input starts with comma or dot (e.g. ",50" or ".50")
  if (str.startsWith(',')) str = '0' + str;
  if (str.startsWith('.')) str = '0' + str;

  const commas = (str.match(/,/g) || []).length;
  const dots = (str.match(/\./g) || []).length;

  // Case 1: Both comma and dot exist (e.g. "1.575,50" or "1,575.50" or "1.500.000,00")
  if (commas > 0 && dots > 0) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Standard Brazilian: "1.575,50" -> remove dots, replace comma with dot
      const clean = str.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    } else {
      // US standard: "1,575.50" -> remove commas
      const clean = str.replace(/,/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
  }

  // Case 2: Only comma exists (e.g. "1575,50", "1575,00", "35,00", "0,50")
  if (commas > 0 && dots === 0) {
    if (commas === 1) {
      const clean = str.replace(',', '.');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    } else {
      // Multiple commas (weird format) -> treat all but last as thousand separators
      const lastComma = str.lastIndexOf(',');
      const clean = str.substring(0, lastComma).replace(/,/g, '') + '.' + str.substring(lastComma + 1);
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }
  }

  // Case 3: Only dot exists (e.g. "1.575", "1.500.000", "1575.50", "15.5")
  if (dots > 0 && commas === 0) {
    if (dots > 1) {
      // Multiple dots: "1.500.000" -> thousand separators
      const clean = str.replace(/\./g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }

    // Exactly 1 dot
    const parts = str.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';

    // In Brazil, if exactly 3 digits follow a single dot (e.g. "1.575", "2.000", "10.500"),
    // it is virtually 100% intended as a thousands separator.
    if (decimalPart.length === 3) {
      const clean = str.replace('.', '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    }

    // Otherwise, if 1 or 2 digits follow (e.g. "1575.50", "15.5"), treat as decimal
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Case 4: Plain integer numbers (e.g. "1575", "35")
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number into Brazilian numeric format: "1.575,00"
 */
export function formatBrl(val: number | string | null | undefined): string {
  const num = typeof val === 'number' ? (isNaN(val) ? 0 : val) : parseBrlMoney(val);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats a number into Brazilian currency with R$ symbol: "R$ 1.575,00"
 */
export function formatBrlCurrency(val: number | string | null | undefined): string {
  const num = typeof val === 'number' ? (isNaN(val) ? 0 : val) : parseBrlMoney(val);
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
