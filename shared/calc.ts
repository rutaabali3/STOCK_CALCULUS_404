import { CalcInput, CalcResult } from './types';

export const MANN_G = 40_000; // 40 kg in grams

/**
 * Performs round half-up using pure integer / BigInt arithmetic.
 * e.g. roundHalfUp(5, 2) = 3 (5 / 2 = 2.5 -> 3)
 *      roundHalfUp(4, 2) = 2 (4 / 2 = 2.0 -> 2)
 */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new Error('Denominator must be positive');
  }
  if (numerator < 0n) {
    // For negative numbers: -(roundHalfUp(-numerator, denominator))
    return -roundHalfUp(-numerator, denominator);
  }
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder * 2n >= denominator) {
    return quotient + 1n;
  }
  return quotient;
}

/**
 * Single source of truth calculation module.
 *
 * All inputs and intermediate variables are strictly integers:
 * - Weights in grams (1 kg = 1,000 g)
 * - Rates in paisa per Mann (Rs 2,000 = 200,000 paisa)
 * - Money amounts in paisa (Rs 13,850 = 1,385,000 paisa)
 * - Commission percentages in hundredths of a percent (2.5% = 250)
 *
 * Formulas:
 *   grossG    = sum(weightsG)
 *   tareG     = tarePerBagG * bagCount
 *   netG      = grossG - tareG
 *   amountP   = roundHalfUp(netG * ratePaisa / MANN_G)
 *   commissionP = commission.type === 'percent'
 *       ? roundHalfUp(amountP * commission.hundredthsPct / 10_000)
 *       : commission.paisa
 *   labourP   = labour.type === 'perBag' ? labour.paisa * bagCount : labour.paisa
 *   chargesP  = commissionP + labourP
 *   totalP    = chargeMode === 'add' ? amountP + chargesP : amountP - chargesP
 *   totalRupees = roundToRupee ? roundHalfUp(totalP / 100) : totalP / 100
 */
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

  // Compute weights using BigInt to eliminate any overflow concern
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

  // amountP = roundHalfUp(netG * ratePaisa / MANN_G)
  const amountPaisaBig = roundHalfUp(netGBig * ratePaisaBig, mannGBig);

  // Commission calculation
  let commissionPaisaBig = 0n;
  if (commission) {
    if (commission.type === 'percent') {
      // hundredths of percent: e.g. 2% = 200, so divide by 10,000
      commissionPaisaBig = roundHalfUp(
        amountPaisaBig * BigInt(commission.hundredthsPct),
        10_000n
      );
    } else {
      commissionPaisaBig = BigInt(commission.paisa);
    }
  }

  // Labour calculation
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

  // Final Rupees calculation
  let totalRupees: number;
  if (roundToRupee) {
    const roundedRupeesBig = roundHalfUp(totalPaisaBig, 100n);
    totalRupees = Number(roundedRupeesBig);
  } else {
    // When roundToRupee is false, return exact rupees as number (e.g. 5011.25)
    totalRupees = Number(totalPaisaBig) / 100;
  }

  // Mann units * 1000 = (netG / 40_000) * 1000 = roundHalfUp(netG * 1000, 40_000)
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
