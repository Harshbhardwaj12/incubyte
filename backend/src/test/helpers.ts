import bcrypt from 'bcrypt';
import request from 'supertest';
import { createApp } from '../app.js';
import { pool } from '../db/pool.js';
import { normalizeEmail } from '../config.js';
import type { UserRole } from '../types.js';

export const app = createApp();

export async function createUser(opts: {
  email: string;
  password: string;
  role?: UserRole;
}) {
  const hash = await bcrypt.hash(opts.password, 4);
  const result = await pool.query(
    `INSERT INTO users (email, email_normalized, password_hash, role)
     VALUES ($1,$2,$3,$4)
     RETURNING id, email, role`,
    [opts.email, normalizeEmail(opts.email), hash, opts.role ?? 'user'],
  );
  return result.rows[0] as { id: string; email: string; role: UserRole };
}

export async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}

export async function insertVehicle(overrides: Partial<{
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  year: number | null;
}> = {}) {
  const result = await pool.query(
    `INSERT INTO vehicles (make, model, category, price, quantity, year, description, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      overrides.make ?? 'Toyota',
      overrides.model ?? 'Corolla',
      overrides.category ?? 'Sedan',
      overrides.price ?? 20000,
      overrides.quantity ?? 5,
      overrides.year ?? 2024,
      'Test vehicle',
      'https://example.com/car.jpg',
    ],
  );
  return result.rows[0];
}
