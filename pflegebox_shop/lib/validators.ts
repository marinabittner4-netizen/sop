import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  qty: z.number().int().nonnegative(),
  variant: z.string().optional().default('')
});

export const SubmitSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dob: z.string().min(4),
    street: z.string().min(1),
    zip: z.string().min(3),
    city: z.string().min(1),
    phone: z.string().optional().default(''),
    email: z.string().email().optional().or(z.literal('')).default(''),
    insuranceType: z.enum(['gesetzlich','privat']).default('gesetzlich'),
    insuranceName: z.string().optional().default(''),
    beihilfePercent: z.enum(['','50','70','80']).optional().default(''),
    careGrade: z.enum(['1','2','3','4','5'])
  }),
  order: z.object({
    month: z.string().min(4),
    budget: z.number().positive(),
    total: z.number().nonnegative(),
    products: z.array(ProductSchema).min(1)
  })
});
