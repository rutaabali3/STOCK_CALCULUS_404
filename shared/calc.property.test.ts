import { describe, it, expect } from 'vitest';
import { computeSlip } from './calc';
import { CalcInput } from './types';

// Simple Linear Congruential Generator for reproducible pseudo-random numbers
function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('Property-Based Determinism Tests', () => {
  it('produces 100% deterministic, identical results across runs with fixed seed', () => {
    const rng = createPRNG(42);

    for (let iteration = 0; iteration < 100; iteration++) {
      const bagCount = Math.floor(rng() * 20) + 1; // 1 to 20 bags
      const weightsG: number[] = [];
      for (let b = 0; b < bagCount; b++) {
        // Bag weight between 20 kg (20000 g) and 120 kg (120000 g)
        weightsG.push(Math.floor(rng() * 100000) + 20000);
      }

      // Rate between Rs 1,000 (100,000 paisa) and Rs 10,000 (1,000,000 paisa)
      const ratePaisa = Math.floor(rng() * 900000) + 100000;

      // Tare 0 to 2 kg
      const tarePerBagG = Math.floor(rng() * 2000);

      const chargeMode = rng() > 0.5 ? 'add' : 'deduct';
      const roundToRupee = rng() > 0.5;

      const input: CalcInput = {
        weightsG,
        ratePaisa,
        tarePerBagG,
        chargeMode,
        roundToRupee,
      };

      const result1 = computeSlip(input);
      const result2 = computeSlip(input);

      expect(result1).toEqual(result2);
      expect(result1.grossG).toBeGreaterThan(0);
      expect(result1.netG).toBe(result1.grossG - result1.tareG);
      expect(result1.totalPaisa).toBeGreaterThan(0);
    }
  });
});
