import { CalcInput, CalcResult } from './types.js';

export const MANN_G = 40_000; // 40 kg in grams

export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new Error('Denominator must be positive');
  }
  if (numerator < 0n) {
    return -roundHalfUp(-numerator, denominator);
  }
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder * 2n >= denominator) {
    return quotient + 1n;
  }
  return quotient;
}

export function computeSlip(input: CalcInput): CalcResult {
  const {
    weightsG,
    ratePaisa,
    tarePerBagG,
    commission,
    labour,
    chargeMode,
    roundToRupee,
  } = input;

  const bagCount = weightsG.length;
  if (bagCount === 0) {
    throw new Error('Bag count must be greater than zero');
  }

  for (let i = 0; i < weightsG.length; i++) {
    const w = weightsG[i]!;
    if (w <= 0 || !Number.isInteger(w)) {
      throw new Error(`Bag weight must be positive integer grams (got ${w})`);
    }
  }

  if (ratePaisa < 0 || !Number.isInteger(ratePaisa)) {
    throw new Error(`Rate paisa must be non-negative integer (got ${ratePaisa})`);
  }

  if (tarePerBagG < 0 || !Number.isInteger(tarePerBagG)) {
    throw new Error(`Tare per bag must be non-negative integer (got ${tarePerBagG})`);
  }

  let grossGBig = 0n;
  for (const w of weightsG) {
    grossGBig += BigInt(w);
  }

  const tareGBig = BigInt(tarePerBagG) * BigInt(bagCount);
  const netGBig = grossGBig - tareGBig;

  if (netGBig <= 0n) {
    throw new Error('Net weight must be greater than zero');
  }

  const mannGBig = BigInt(MANN_G);
  const ratePaisaBig = BigInt(ratePaisa);

  const amountPaisaBig = roundHalfUp(netGBig * ratePaisaBig, mannGBig);

  let commissionPaisaBig = 0n;
  if (commission) {
    if (commission.type === 'percent') {
      commissionPaisaBig = roundHalfUp(
        amountPaisaBig * BigInt(commission.hundredthsPct),
        10_000n
      );
    } else {
      commissionPaisaBig = BigInt(commission.paisa);
    }
  }

  let labourPaisaBig = 0n;
  if (labour) {
    if (labour.type === 'perBag') {
      labourPaisaBig = BigInt(labour.paisa) * BigInt(bagCount);
    } else {
      labourPaisaBig = BigInt(labour.paisa);
    }
  }

  const chargesPaisaBig = commissionPaisaBig + labourPaisaBig;
  const totalPaisaBig =
    chargeMode === 'add'
      ? amountPaisaBig + chargesPaisaBig
      : amountPaisaBig - chargesPaisaBig;

  if (totalPaisaBig < 0n) {
    throw new Error('Total amount cannot be negative');
  }

  let totalRupees: number;
  if (roundToRupee) {
    const roundedRupeesBig = roundHalfUp(totalPaisaBig, 100n);
    totalRupees = Number(roundedRupeesBig);
  } else {
    totalRupees = Number(totalPaisaBig) / 100;
  }

  const mannUnitsTimes1000Big = roundHalfUp(netGBig * 1000n, mannGBig);

  return {
    bagCount,
    grossG: Number(grossGBig),
    tareG: Number(tareGBig),
    netG: Number(netGBig),
    mannUnitsTimes1000: Number(mannUnitsTimes1000Big),
    amountPaisa: Number(amountPaisaBig),
    commissionPaisa: Number(commissionPaisaBig),
    labourPaisa: Number(labourPaisaBig),
    chargesPaisa: Number(chargesPaisaBig),
    totalPaisa: Number(totalPaisaBig),
    totalRupees,
  };
}
