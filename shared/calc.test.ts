import { describe, it, expect } from 'vitest';
import { computeSlip, roundHalfUp } from './calc';
import { parseDecimal, formatDecimal } from './decimal';
import { CalcInput } from './types';

describe('Decimal Parsing & Formatting', () => {
  it('parses valid decimal strings correctly', () => {
    expect(parseDecimal('55', 3)).toBe(55000);
    expect(parseDecimal('55.0', 3)).toBe(55000);
    expect(parseDecimal('55.5', 3)).toBe(55500);
    expect(parseDecimal('55.25', 3)).toBe(55250);
    expect(parseDecimal('55.125', 3)).toBe(55125);
    expect(parseDecimal('.5', 3)).toBe(500);
    expect(parseDecimal('0.5', 3)).toBe(500);
    expect(parseDecimal('0', 3)).toBe(0);
    expect(parseDecimal('2000', 2)).toBe(200000);
    expect(parseDecimal('1999.50', 2)).toBe(199950);
  });

  it('rejects invalid or out-of-precision decimal strings', () => {
    expect(parseDecimal('', 3)).toBeNull();
    expect(parseDecimal('   ', 3)).toBeNull();
    expect(parseDecimal('.', 3)).toBeNull();
    expect(parseDecimal('-5', 3)).toBeNull();
    expect(parseDecimal('55.1234', 3)).toBeNull(); // exceeds dp 3
    expect(parseDecimal('1e3', 3)).toBeNull();
    expect(parseDecimal('abc', 3)).toBeNull();
    expect(parseDecimal('55.2.1', 3)).toBeNull();
  });

  it('formats decimals correctly', () => {
    expect(formatDecimal(55000, 3)).toBe('55');
    expect(formatDecimal(55250, 3)).toBe('55.25');
    expect(formatDecimal(500, 3)).toBe('0.5');
    expect(formatDecimal(501125, 2, false)).toBe('5011.25');
    expect(formatDecimal(501100, 2, true)).toBe('5011');
  });
});

describe('roundHalfUp helper', () => {
  it('rounds half up accurately with integers', () => {
    expect(roundHalfUp(5n, 2n)).toBe(3n);
    expect(roundHalfUp(4n, 2n)).toBe(2n);
    expect(roundHalfUp(1n, 2n)).toBe(1n);
    expect(roundHalfUp(0n, 2n)).toBe(0n);
    expect(roundHalfUp(1385000n, 100n)).toBe(13850n);
    expect(roundHalfUp(501125n, 100n)).toBe(5011n); // 5011.25 -> 5011
    expect(roundHalfUp(501150n, 100n)).toBe(5012n); // 5011.50 -> 5012
  });
});

describe('Mandi Calculator Core Engine — Required Test Vectors', () => {
  // Vector 1: bags 55, 54, 50, 58, 60 (277 kg); rate Rs. 2,000 -> Rs. 13,850
  it('Vector 1: standard weighment 277 kg @ Rs 2000/Mann -> Rs 13,850', () => {
    const input: CalcInput = {
      weightsG: [55000, 54000, 50000, 58000, 60000],
      ratePaisa: 200000, // Rs 2,000
      tarePerBagG: 0,
      chargeMode: 'add',
      roundToRupee: true,
    };
    const res = computeSlip(input);
    expect(res.bagCount).toBe(5);
    expect(res.grossG).toBe(277000); // 277 kg
    expect(res.netG).toBe(277000);
    expect(res.amountPaisa).toBe(1385000); // Rs 13,850
    expect(res.totalPaisa).toBe(1385000);
    expect(res.totalRupees).toBe(13850);
  });

  // Vector 2: same bags, tare 1 kg per bag -> net 272 kg -> Rs. 13,600
  it('Vector 2: tare 1 kg/bag -> net 272 kg -> Rs 13,600', () => {
    const input: CalcInput = {
      weightsG: [55000, 54000, 50000, 58000, 60000],
      ratePaisa: 200000,
      tarePerBagG: 1000, // 1 kg
      chargeMode: 'add',
      roundToRupee: true,
    };
    const res = computeSlip(input);
    expect(res.grossG).toBe(277000);
    expect(res.tareG).toBe(5000);
    expect(res.netG).toBe(272000);
    expect(res.amountPaisa).toBe(1360000); // Rs 13,600
    expect(res.totalRupees).toBe(13600);
  });

  // Vector 3: same bags, 2% commission added -> commission Rs. 277 -> total Rs. 14,127
  it('Vector 3: 2% commission added -> total Rs 14,127', () => {
    const input: CalcInput = {
      weightsG: [55000, 54000, 50000, 58000, 60000],
      ratePaisa: 200000,
      tarePerBagG: 0,
      commission: { type: 'percent', hundredthsPct: 200 }, // 2.00%
      chargeMode: 'add',
      roundToRupee: true,
    };
    const res = computeSlip(input);
    expect(res.amountPaisa).toBe(1385000);
    expect(res.commissionPaisa).toBe(27700); // Rs 277
    expect(res.chargesPaisa).toBe(27700);
    expect(res.totalPaisa).toBe(1412700);
    expect(res.totalRupees).toBe(14127);
  });

  // Vector 4: same bags, 2% commission deducted -> total Rs. 13,573
  it('Vector 4: 2% commission deducted -> total Rs 13,573', () => {
    const input: CalcInput = {
      weightsG: [55000, 54000, 50000, 58000, 60000],
      ratePaisa: 200000,
      tarePerBagG: 0,
      commission: { type: 'percent', hundredthsPct: 200 },
      chargeMode: 'deduct',
      roundToRupee: true,
    };
    const res = computeSlip(input);
    expect(res.amountPaisa).toBe(1385000);
    expect(res.commissionPaisa).toBe(27700);
    expect(res.totalPaisa).toBe(1357300);
    expect(res.totalRupees).toBe(13573);
  });

  // Vector 5: same bags, labour Rs. 10 per bag added -> total Rs. 13,900
  it('Vector 5: labour Rs 10/bag added -> total Rs 13,900', () => {
    const input: CalcInput = {
      weightsG: [55000, 54000, 50000, 58000, 60000],
      ratePaisa: 200000,
      tarePerBagG: 0,
      labour: { type: 'perBag', paisa: 1000 }, // Rs 10 = 1000 paisa
      chargeMode: 'add',
      roundToRupee: true,
    };
    const res = computeSlip(input);
    expect(res.amountPaisa).toBe(1385000);
    expect(res.labourPaisa).toBe(5000); // 5 bags * 10 = Rs 50
    expect(res.totalPaisa).toBe(1390000);
    expect(res.totalRupees).toBe(13900);
  });

  // Vector 6: 50.5, 49.75 kg @ 1999.50 -> amount 5,011.25 -> 5,011 rounded to rupee
  it('Vector 6: fractional weights & rate rounded to rupee -> Rs 5,011', () => {
    const input: CalcInput = {
      weightsG: [50500, 49750], // 50.5 kg + 49.75 kg = 100.25 kg = 100250 g
      ratePaisa: 199950,        // Rs 1999.50 = 199950 paisa
      tarePerBagG: 0,
      chargeMode: 'add',
      roundToRupee: true,
    };
    const res = computeSlip(input);
    // netG = 100250
    // netG * ratePaisa = 100250 * 199950 = 20,044,987,500
    // divided by 40,000 = 501,124.6875 -> roundHalfUp -> 501,125 paisa = 5,011.25
    expect(res.grossG).toBe(100250);
    expect(res.amountPaisa).toBe(501125);
    expect(res.totalRupees).toBe(5011);
  });

  // Vector 7: same with roundToRupee = false -> 5,011.25
  it('Vector 7: fractional weights & rate with roundToRupee=false -> 5,011.25', () => {
    const input: CalcInput = {
      weightsG: [50500, 49750],
      ratePaisa: 199950,
      tarePerBagG: 0,
      chargeMode: 'add',
      roundToRupee: false,
    };
    const res = computeSlip(input);
    expect(res.amountPaisa).toBe(501125);
    expect(res.totalRupees).toBe(5011.25);
  });
});

describe('Edge cases and error handling', () => {
  it('throws error when bags array is empty', () => {
    expect(() =>
      computeSlip({
        weightsG: [],
        ratePaisa: 200000,
        tarePerBagG: 0,
        chargeMode: 'add',
        roundToRupee: true,
      })
    ).toThrow('Bag count must be greater than zero');
  });

  it('throws error when net weight is zero or negative', () => {
    expect(() =>
      computeSlip({
        weightsG: [1000],
        ratePaisa: 200000,
        tarePerBagG: 1000, // 1000 - 1000 = 0
        chargeMode: 'add',
        roundToRupee: true,
      })
    ).toThrow('Net weight must be greater than zero');
  });

  it('handles extremely large weights with BigInt safely without precision loss', () => {
    // 10,000 bags of 500 kg each = 5,000,000 kg = 5,000,000,000 grams
    // Rate = Rs 100,000 per Mann = 10,000,000 paisa
    // 5,000,000,000 * 10,000,000 = 50,000,000,000,000,000 (> 2^53 = 9,007,199,254,740,991)
    const weightsG = Array(100).fill(50_000_000); // 100 bags of 50,000 kg each = 5,000,000 kg
    const input: CalcInput = {
      weightsG,
      ratePaisa: 10_000_000,
      tarePerBagG: 0,
      chargeMode: 'add',
      roundToRupee: true,
    };
    const res = computeSlip(input);
    // netG = 5,000,000,000 g
    // amount = 5,000,000,000 * 10,000,000 / 40,000 = 1,250,000,000,000 paisa = Rs 12,500,000,000
    expect(res.amountPaisa).toBe(1250000000000);
    expect(res.totalRupees).toBe(12500000000);
  });
});
