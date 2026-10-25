import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';
import type { Purchase } from '../types.js';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export async function createPurchase(
  input: {
    userId: string;
    vehicleId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    vehicleMake: string;
    vehicleModel: string;
    vehicleCategory: string;
  },
  db: Queryable = pool,
): Promise<Purchase> {
  const result = await db.query<Purchase>(
    `INSERT INTO purchases
      (user_id, vehicle_id, quantity, unit_price, total_price,
       vehicle_make, vehicle_model, vehicle_category)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      input.userId,
      input.vehicleId,
      input.quantity,
      input.unitPrice,
      input.totalPrice,
      input.vehicleMake,
      input.vehicleModel,
      input.vehicleCategory,
    ],
  );
  return result.rows[0];
}

export async function countPurchases(db: Queryable = pool): Promise<number> {
  const result = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM purchases');
  return Number(result.rows[0].count);
}
