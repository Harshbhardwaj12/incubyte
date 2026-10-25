import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../db/migrations',
);

export const app = createApp();

export async function resetDb() {
  await pool.query(`
    DROP TABLE IF EXISTS purchases CASCADE;
    DROP TABLE IF EXISTS stock_movements CASCADE;
    DROP TABLE IF EXISTS vehicles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS schema_migrations CASCADE;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query(
      'INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING',
      [file],
    );
  }
}

export async function createAdmin() {
  const hash = await bcrypt.hash(env.ADMIN_PASSWORD, env.BCRYPT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (email, email_normalized, password_hash, role)
     VALUES ($1, $2, $3, 'admin') RETURNING id, email, role`,
    [env.ADMIN_EMAIL, env.ADMIN_EMAIL.toLowerCase(), hash],
  );
  return result.rows[0];
}

export async function registerUser(
  email = 'user@example.com',
  password = 'Password123!',
) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password });
  return res;
}

export async function loginAdmin() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
  return res;
}

export async function closePool() {
  await pool.end();
}
