import { z } from 'zod';

export const ProductItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  size: z.string().optional().nullable(),
});

export const SubmitSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dob: z.string().min(4), // YYYY-MM-DD
    street: z.string().min(1),
    zip: z.string().min(3),
    city: z.string().min(1),
    phone: z.string().optional().nullable().default(''),
    email: z.string().email().optional().nullable().default(''),
    insuranceType: z.enum(['gesetzlich', 'privat']),
    insuranceName: z.string().min(1),
    careGrade: z.enum(['1','2','3','4','5']),
    beihilfePercent: z.union([z.literal(0), z.literal(50), z.literal(70), z.literal(80)]).default(0),
    legalRepPresent: z.boolean().default(false),
    legalRepName: z.string().optional().nullable().default(''),
  }),
  order: z.object({
    monthKey: z.string().min(7), // YYYY-MM
    total: z.number().nonnegative(),
    budgetMax: z.number().positive(),
    items: z.array(ProductItemSchema).min(1),
  }),
});

export type SubmitPayload = z.infer<typeof SubmitSchema>;
