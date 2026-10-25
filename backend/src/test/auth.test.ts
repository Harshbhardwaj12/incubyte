import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app, createUser, loginAs } from './helpers.js';
import { pool } from '../db/pool.js';

describe('Auth', () => {
  it('registers a new user as role user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'buyer@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('buyer@example.com');
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.password_hash).toBeUndefined();
    expect(res.body.token).toBeTruthy();

    const db = await pool.query('SELECT role FROM users WHERE email_normalized = $1', [
      'buyer@example.com',
    ]);
    expect(db.rows[0].role).toBe('user');
  });

  it('rejects duplicate email (case-insensitive)', async () => {
    await createUser({ email: 'dup@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/register').send({
      email: 'Dup@Example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('logs in with valid credentials', async () => {
    await createUser({ email: 'login@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects invalid login', async () => {
    await createUser({ email: 'login2@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@example.com',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('rejects missing token on protected routes', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('blocks non-admin from admin operations', async () => {
    await createUser({ email: 'user@example.com', password: 'password123', role: 'user' });
    const token = await loginAs('user@example.com', 'password123');
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        make: 'Ford',
        model: 'Focus',
        category: 'Sedan',
        price: 18000,
        quantity: 2,
      });
    expect(res.status).toBe(403);
  });

  it('never grants admin via public registration body', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'hacker@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
  });
});
