import { z } from 'zod';

export const vehicleBodySchema = z.object({
  make: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50),
  price: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().nonnegative(),
  year: z.coerce.number().int().min(1886).max(2100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().max(1000).optional().nullable(),
});

export const vehicleUpdateSchema = vehicleBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const searchQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
}).refine(
  (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice,
  { message: 'minPrice must be <= maxPrice', path: ['minPrice'] },
);

export const purchaseSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const restockSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});
