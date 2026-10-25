import type { NextFunction, Request, Response } from 'express';
import * as reportRepository from '../repositories/reportRepository.js';

function escapeCsv(value: unknown): string {
  const text = value instanceof Date ? value.toISOString() : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function sendCsv(res: Response, filename: string, headers: string[], rows: unknown[][]): void {
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n');
  res.type('text/csv').attachment(filename).send(`${csv}\n`);
}

export async function inventoryCsv(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const vehicles = await reportRepository.listInventory();
    sendCsv(
      res,
      'apex-motors-inventory.csv',
      ['id', 'make', 'model', 'category', 'year', 'price', 'quantity', 'valuation', 'status', 'updated_at'],
      vehicles.map((vehicle) => [
        vehicle.id,
        vehicle.make,
        vehicle.model,
        vehicle.category,
        vehicle.year,
        vehicle.price,
        vehicle.quantity,
        Number(vehicle.price) * vehicle.quantity,
        vehicle.quantity === 0 ? 'sold_out' : vehicle.quantity <= 2 ? 'low_stock' : 'in_stock',
        vehicle.updated_at,
      ]),
    );
  } catch (error) {
    next(error);
  }
}

export async function salesCsv(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const purchases = await reportRepository.listSales();
    sendCsv(
      res,
      'apex-motors-sales.csv',
      ['id', 'vehicle_make', 'vehicle_model', 'vehicle_category', 'quantity', 'unit_price', 'total_price', 'buyer_email', 'created_at'],
      purchases.map((purchase) => [
        purchase.id,
        purchase.vehicle_make,
        purchase.vehicle_model,
        purchase.vehicle_category,
        purchase.quantity,
        purchase.unit_price,
        purchase.total_price,
        purchase.acting_user_email,
        purchase.created_at,
      ]),
    );
  } catch (error) {
    next(error);
  }
}
