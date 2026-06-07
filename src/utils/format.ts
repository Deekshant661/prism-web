/**
 * Centralized formatters for numbers, currency, dates, and scores.
 */

export function formatReturn(value: number | null): string {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatCurrency(crores: number | null): string {
  if (crores === null || crores === undefined) return '—';
  // Indian number format: 1,00,000 style
  const formatted = crores.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
  return `₹${formatted} Cr`;
}

export function formatDate(isoString: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNavDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${month} '${year}`;
}

export function formatScore(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(1);
}

export function formatExpenseRatio(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)}%`;
}

export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    LARGE_CAP: 'Large Cap',
    MID_CAP: 'Mid Cap',
    SMALL_CAP: 'Small Cap',
    FLEXI_CAP: 'Flexi Cap',
    ELSS: 'ELSS',
    INDEX: 'Index',
    DEBT: 'Debt',
    BALANCED_ADVANTAGE: 'Balanced Advantage',
    ALL: 'All Categories',
  };
  return labels[category] || category;
}

/**
 * Format a number in Indian Rupee notation with lakh/crore commas.
 * 500000    → "₹5,00,000"
 * 10000000  → "₹1,00,00,000"
 */
export function formatINR(value: number): string {
  const abs = Math.abs(Math.round(value));
  const sign = value < 0 ? '-' : '';
  const s = abs.toString();

  if (s.length <= 3) return `${sign}₹${s}`;

  // Last 3 digits, then groups of 2
  let result = s.slice(-3);
  let remaining = s.slice(0, -3);
  while (remaining.length > 0) {
    const chunk = remaining.slice(-2);
    remaining = remaining.slice(0, -2);
    result = chunk + ',' + result;
  }
  return `${sign}₹${result}`;
}

/**
 * Short Indian Rupee format for chart axes.
 * 50000     → "₹50K"
 * 500000    → "₹5L"
 * 1500000   → "₹15L"
 * 10000000  → "₹1Cr"
 * 150000000 → "₹15Cr"
 */
export function formatINRShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000;
    return `${sign}₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)}Cr`;
  }
  if (abs >= 1_00_000) {
    const l = abs / 1_00_000;
    return `${sign}₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
}
