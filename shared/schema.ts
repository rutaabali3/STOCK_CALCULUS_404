import { z } from 'zod';

export const commissionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('percent'),
    hundredthsPct: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('fixed'),
    paisa: z.number().int().min(0),
  }),
]);

export const labourSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('fixed'),
    paisa: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('perBag'),
    paisa: z.number().int().min(0),
  }),
]);

export const slipPayloadSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  deviceId: z.string().optional(),
  seller: z.string().max(120).optional(),
  buyer: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
  weightsG: z.array(z.number().int().positive()).min(1),
  ratePaisa: z.number().int().nonnegative(),
  tarePerBagG: z.number().int().nonnegative().default(0),
  commission: commissionSchema.optional(),
  labour: labourSchema.optional(),
  chargeMode: z.enum(['add', 'deduct']).default('add'),
  roundToRupee: z.boolean().default(true),
});

export const batchSlipsPayloadSchema = z.object({
  slips: z.array(slipPayloadSchema).min(1).max(50),
});

export const voidSlipSchema = z.object({
  reason: z.string().trim().min(3),
});

export const loginSchema = z.object({
  pin: z.string().min(1),
});
