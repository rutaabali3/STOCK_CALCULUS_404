/**
 * Sanitizes CSV cell values to neutralize CSV injection / formula execution.
 * Cells starting with =, +, -, or @ are prefixed with a single quote.
 */
export function sanitizeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);

  let clean = str;
  if (/^[=+\-@]/.test(clean)) {
    clean = `'${clean}`;
  }

  // Escape double quotes
  const escaped = clean.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildCsvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(sanitizeCsvCell).join(',');
}
