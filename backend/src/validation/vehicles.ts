import { z } from 'zod';

export const createVehicleSchema = z.object({
  make: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(100),
  price: z.coerce.number().finite().nonnegative(),
  quantity: z.coerce.number().int().nonnegative(),
  year: z.coerce.number().int().min(1886).max(2100).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  image_url: z.string().url().max(1000).optional().nullable().or(z.literal('')),
});

export const updateVehicleSchema = createVehicleSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const updateVehicleRequestSchema = createVehicleSchema.partial().extend({
  reason: z.string().trim().min(1).max(250).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' },
);

export const searchVehiclesSchema = z.object({
  make: z.string().trim().optional(),
  model: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().finite().nonnegative().optional(),
  maxPrice: z.coerce.number().finite().nonnegative().optional(),
  year: z.coerce.number().int().min(1886).max(2100).optional(),
  status: z.enum(['in_stock', 'low_stock', 'sold_out']).optional(),
  lowStockThreshold: z.coerce.number().int().min(1).max(100).default(2),
  sortBy: z.enum(['price', 'quantity', 'year', 'created_at', 'make']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
}).refine(
  (data) =>
    data.minPrice === undefined ||
    data.maxPrice === undefined ||
    data.minPrice <= data.maxPrice,
  { message: 'minPrice must be less than or equal to maxPrice', path: ['minPrice'] },
);

export const purchaseSchema = z.object({
  quantity: z.coerce.number().int().positive(),
});

export const restockSchema = z.object({
  quantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(1).max(250).optional(),
});

export const adjustmentSchema = z.object({
  quantityChange: z.coerce.number().int().refine((value) => value !== 0, {
    message: 'quantityChange cannot be zero',
  }),
  reason: z.string().trim().min(1).max(250),
});
