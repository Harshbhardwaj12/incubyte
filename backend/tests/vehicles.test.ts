import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createAdmin, loginAdmin, registerUser, resetDb } from './helpers.js';

describe('Vehicles', () => {
  let token: string;
  let adminToken: string;

  beforeEach(async () => {
    await resetDb();
    const res = await registerUser();
    token = res.body.token;
    await createAdmin();
    const admin = await loginAdmin();
    adminToken = admin.body.token;
  });

  const sample = {
    make: 'Honda',
    model: 'Civic',
    category: 'Sedan',
    price: 25000,
    quantity: 4,
    year: 2024,
    description: 'Compact sedan',
    imageUrl: 'https://example.com/civic.jpg',
  };

  it('creates and lists vehicles including zero stock', async () => {
    const created = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sample);
    expect(created.status).toBe(201);

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...sample, model: 'SoldOut', quantity: 0 });

    const list = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.vehicles).toHaveLength(2);
    expect(list.body.vehicles.some((v: { quantity: number }) => v.quantity === 0)).toBe(
      true,
    );
  });

  it('rejects invalid vehicle fields', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...sample, price: -1 });
    expect(res.status).toBe(400);
  });

  it('updates a vehicle', async () => {
    const created = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sample);

    const updated = await request(app)
      .put(`/api/vehicles/${created.body.vehicle.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 24000 });
    expect(updated.status).toBe(200);
    expect(updated.body.vehicle.price).toBe('24000.00');
  });

  it('searches by make, model, category, and price range', async () => {
    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sample);
    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        make: 'Ford',
        model: 'Explorer',
        category: 'SUV',
        price: 40000,
        quantity: 2,
      });

    const byMake = await request(app)
      .get('/api/vehicles/search')
      .query({ make: 'honda' })
      .set('Authorization', `Bearer ${token}`);
    expect(byMake.body.vehicles).toHaveLength(1);

    const byPrice = await request(app)
      .get('/api/vehicles/search')
      .query({ minPrice: 30000, maxPrice: 50000 })
      .set('Authorization', `Bearer ${token}`);
    expect(byPrice.body.vehicles).toHaveLength(1);
    expect(byPrice.body.vehicles[0].make).toBe('Ford');
  });

  it('rejects invalid price filters', async () => {
    const res = await request(app)
      .get('/api/vehicles/search')
      .query({ minPrice: 50000, maxPrice: 10000 })
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
