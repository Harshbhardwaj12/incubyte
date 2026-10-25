import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';
import type { User, UserRole } from '../types.js';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export async function findUserByNormalizedEmail(
  emailNormalized: string,
  db: Queryable = pool,
): Promise<User | null> {
  const result = await db.query<User>(
    'SELECT * FROM users WHERE email_normalized = $1',
    [emailNormalized],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string, db: Queryable = pool): Promise<User | null> {
  const result = await db.query<User>('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createUser(
  input: {
    email: string;
    emailNormalized: string;
    passwordHash: string;
    role?: UserRole;
  },
  db: Queryable = pool,
): Promise<User> {
  const result = await db.query<User>(
    `INSERT INTO users (email, email_normalized, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.email, input.emailNormalized, input.passwordHash, input.role ?? 'user'],
  );
  return result.rows[0];
}
