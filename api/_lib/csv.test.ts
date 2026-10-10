import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, buildCsvRow } from './csv';

describe('CSV Formula Injection Neutralization', () => {
  it('neutralizes cells starting with =', () => {
    const raw = '=cmd|"/c calc"!A0';
    const sanitized = sanitizeCsvCell(raw);
    expect(sanitized).toBe('"\'=cmd|""/c calc""!A0"');
  });

  it('neutralizes cells starting with +', () => {
    const raw = '+12345';
    const sanitized = sanitizeCsvCell(raw);
    expect(sanitized).toBe("\"'+12345\"");
  });

  it('neutralizes cells starting with -', () => {
    const raw = '-12345';
    const sanitized = sanitizeCsvCell(raw);
    expect(sanitized).toBe("\"'-12345\"");
  });

  it('neutralizes cells starting with @', () => {
    const raw = '@SUM(A1:A10)';
    const sanitized = sanitizeCsvCell(raw);
    expect(sanitized).toBe("\"'@SUM(A1:A10)\"");
  });

  it('escapes regular strings with double quotes properly', () => {
    const raw = 'Wheat "Grade A" Lot';
    const sanitized = sanitizeCsvCell(raw);
    expect(sanitized).toBe('"Wheat ""Grade A"" Lot"');
  });

  it('builds CSV rows properly', () => {
    const row = buildCsvRow(['1010-ABCD', '2026-10-10', '=sum(1,2)', 'Wheat']);
    expect(row).toBe('"1010-ABCD","2026-10-10","\'=sum(1,2)","Wheat"');
  });
});
