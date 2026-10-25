import { beforeAll, afterAll, beforeEach } from 'vitest';
import { pool } from '../db/pool.js';
import { migrate } from '../db/migrate.js';

// Force test database for all backend tests.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://dealership:dealership@localhost:5433/dealership_test';
process.env.JWT_SECRET = 'test-jwt-secret-not-for-production';
process.env.BCRYPT_ROUNDS = '4';

beforeAll(async () => {
  // Re-import config after env override is awkward; pool already uses config at import.
  // Ensure migrations on test DB.
  await migrate();
});

beforeEach(async () => {
  await pool.query(
    'TRUNCATE purchases, stock_movements, vehicles, users RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await pool.end();
});
