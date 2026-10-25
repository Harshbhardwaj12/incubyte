import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import * as dashboardRepository from '../repositories/dashboardRepository.js';

const querySchema = z.object({
  lowStockThreshold: z.coerce.number().int().min(1).max(100).default(2),
});

export async function summary(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { lowStockThreshold } = querySchema.parse(req.query);
    const dashboard = await dashboardRepository.getDashboardSummary(lowStockThreshold);
    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
}
