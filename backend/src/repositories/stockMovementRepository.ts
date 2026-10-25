import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';
import type { StockMovement, StockMovementType } from '../types.js';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export async function createMovement(
  input: {
    vehicleId: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleCategory: string;
    movementType: StockMovementType;
    quantityChange: number;
    previousQuantity: number;
    newQuantity: number;
    actingUserId: string | null;
    reason: string;
  },
  db: Queryable = pool,
): Promise<StockMovement> {
  const result = await db.query<StockMovement>(
    `INSERT INTO stock_movements
      (vehicle_id, vehicle_make, vehicle_model, vehicle_category,
       movement_type, quantity_change, previous_quantity, new_quantity,
       acting_user_id, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      input.vehicleId,
      input.vehicleMake,
      input.vehicleModel,
      input.vehicleCategory,
      input.movementType,
      input.quantityChange,
      input.previousQuantity,
      input.newQuantity,
      input.actingUserId,
      input.reason,
    ],
  );
  return result.rows[0];
}

export async function listMovements(
  limit = 50,
  db: Queryable = pool,
): Promise<StockMovement[]> {
  const result = await db.query<StockMovement>(
    `SELECT sm.*, u.email AS acting_user_email
     FROM stock_movements sm
     LEFT JOIN users u ON u.id = sm.acting_user_id
     ORDER BY sm.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return result.rows;
}
