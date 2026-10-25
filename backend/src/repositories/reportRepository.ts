import { pool } from '../db/pool.js';
import type { Purchase, Vehicle } from '../types.js';

export async function listInventory(): Promise<Vehicle[]> {
  const result = await pool.query<Vehicle>(
    'SELECT * FROM vehicles ORDER BY category ASC, make ASC, model ASC',
  );
  return result.rows;
}

export async function listSales(): Promise<Purchase[]> {
  const result = await pool.query<Purchase>(
    `SELECT p.*, u.email AS acting_user_email
     FROM purchases p
     LEFT JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC`,
  );
  return result.rows;
}
