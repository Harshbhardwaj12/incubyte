import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  app,
  createAdmin,
  loginAdmin,
  registerUser,
  resetDb,
} from './helpers.js';

describe('Auth', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('registers a new user without admin role', async () => {
    const res = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('user');
    expect(res.body.user.email).toBe('user@example.com');
  });

  it('rejects duplicate email', async () => {
    await registerUser();
    const res = await registerUser();
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('logs in successfully', async () => {
    await registerUser('login@example.com', 'Password123!');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects bad password', async () => {
    await registerUser('bad@example.com', 'Password123!');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects missing token on protected route', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('enforces admin-only delete', async () => {
    await createAdmin();
    const user = await registerUser();
    const admin = await loginAdmin();

    const create = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${admin.body.token}`)
      .send({
        make: 'Toyota',
        model: 'Corolla',
        category: 'Sedan',
        price: 20000,
        quantity: 1,
      });

    const updateForbidden = await request(app)
      .put(`/api/vehicles/${create.body.vehicle.id}`)
      .set('Authorization', `Bearer ${user.body.token}`)
      .send({ price: 21000 });
    expect(updateForbidden.status).toBe(403);

    const forbidden = await request(app)
      .delete(`/api/vehicles/${create.body.vehicle.id}`)
      .set('Authorization', `Bearer ${user.body.token}`);
    expect(forbidden.status).toBe(403);

    const ok = await request(app)
      .delete(`/api/vehicles/${create.body.vehicle.id}`)
      .set('Authorization', `Bearer ${admin.body.token}`);
    expect(ok.status).toBe(204);
  });
});
