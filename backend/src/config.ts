import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const config = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl:
    nodeEnv === 'test'
      ? process.env.TEST_DATABASE_URL ??
        'postgresql://dealership:dealership@localhost:5433/dealership_test'
      : required(
          'DATABASE_URL',
          'postgresql://dealership:dealership@localhost:5432/dealership_dev',
        ),
  jwtSecret: required('JWT_SECRET', 'dev-jwt-secret-change-in-production-32chars'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@dealership.local',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'AdminPass123!',
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
