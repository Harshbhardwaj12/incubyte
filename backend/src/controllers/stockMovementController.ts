import type { NextFunction, Request, Response } from 'express';
import * as stockMovementRepository from '../repositories/stockMovementRepository.js';

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const movements = await stockMovementRepository.listMovements();
    res.status(200).json({ movements });
  } catch (error) {
    next(error);
  }
}
