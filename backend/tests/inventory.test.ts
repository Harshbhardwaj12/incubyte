import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { pool } from '../src/db/pool.js';
import {
  app,
  createAdmin,
  loginAdmin,
  registerUser,
  resetDb,
} from './helpers.js';

describe('Inventory', () => {
  let userToken: string;
  let adminToken: string;
  let vehicleId: string;

  beforeEach(async () => {
    await resetDb();
    await createAdmin();
    const user = await registerUser();
    userToken = user.body.token;
    const admin = await loginAdmin();
    adminToken = admin.body.token;

    const created = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 30000,
        quantity: 5,
      });
    vehicleId = created.body.vehicle.id;
  });

  it('purchases and decreases stock', async () => {
    const res = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.vehicle.quantity).toBe(3);
    expect(res.body.purchase.total_price).toBe('60000.00');

    const count = await pool.query('SELECT COUNT(*)::int AS c FROM purchases');
    expect(count.rows[0].c).toBe(1);

    const movement = await pool.query(
      `SELECT movement_type, quantity_change, previous_quantity, new_quantity
       FROM stock_movements WHERE vehicle_id = $1 AND movement_type = 'purchase'`,
      [vehicleId],
    );
    expect(movement.rows[0]).toEqual({
      movement_type: 'purchase',
      quantity_change: -2,
      previous_quantity: 5,
      new_quantity: 3,
    });
  });

  it('rejects insufficient stock and leaves DB unchanged', async () => {
    const beforePurchases = await pool.query(
      'SELECT COUNT(*)::int AS c FROM purchases',
    );
    const beforeMovements = await pool.query(
      'SELECT COUNT(*)::int AS c FROM stock_movements',
    );
    const beforeQty = await pool.query(
      'SELECT quantity FROM vehicles WHERE id = $1',
      [vehicleId],
    );

    const res = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 99 });
    expect(res.status).toBe(409);

    const afterPurchases = await pool.query(
      'SELECT COUNT(*)::int AS c FROM purchases',
    );
    const afterMovements = await pool.query(
      'SELECT COUNT(*)::int AS c FROM stock_movements',
    );
    const afterQty = await pool.query(
      'SELECT quantity FROM vehicles WHERE id = $1',
      [vehicleId],
    );
    expect(afterPurchases.rows[0].c).toBe(beforePurchases.rows[0].c);
    expect(afterMovements.rows[0].c).toBe(beforeMovements.rows[0].c);
    expect(afterQty.rows[0].quantity).toBe(beforeQty.rows[0].quantity);
  });

  it('rejects non-positive purchase quantity', async () => {
    const res = await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('prevents oversell under concurrent purchases', async () => {
    await pool.query('UPDATE vehicles SET quantity = 1 WHERE id = $1', [vehicleId]);

    const results = await Promise.all(
      [1, 2].map(() =>
        request(app)
          .post(`/api/vehicles/${vehicleId}/purchase`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ quantity: 1 }),
      ),
    );

    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);

    const qty = await pool.query('SELECT quantity FROM vehicles WHERE id = $1', [
      vehicleId,
    ]);
    expect(qty.rows[0].quantity).toBe(0);

    const purchases = await pool.query('SELECT COUNT(*)::int AS c FROM purchases');
    expect(purchases.rows[0].c).toBe(1);
  });

  it('allows admin restock and blocks non-admin', async () => {
    const forbidden = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 3 });
    expect(forbidden.status).toBe(403);

    const ok = await request(app)
      .post(`/api/vehicles/${vehicleId}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 3 });
    expect(ok.status).toBe(200);
    expect(ok.body.vehicle.quantity).toBe(8);

    const movement = await pool.query(
      `SELECT movement_type, quantity_change, previous_quantity, new_quantity, reason
       FROM stock_movements WHERE vehicle_id = $1 AND movement_type = 'restock'`,
      [vehicleId],
    );
    expect(movement.rows[0]).toEqual({
      movement_type: 'restock',
      quantity_change: 3,
      previous_quantity: 5,
      new_quantity: 8,
      reason: 'Admin restock',
    });
  });

  it('records atomic stock movements and supports reasoned adjustments', async () => {
    const forbidden = await request(app)
      .post(`/api/vehicles/${vehicleId}/adjust`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantityChange: -1, reason: 'Customer count' });
    expect(forbidden.status).toBe(403);

    const adjusted = await request(app)
      .post(`/api/vehicles/${vehicleId}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantityChange: -1, reason: 'Cycle count correction' });
    expect(adjusted.status).toBe(200);
    expect(adjusted.body.vehicle.quantity).toBe(4);

    const negative = await request(app)
      .post(`/api/vehicles/${vehicleId}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantityChange: -99, reason: 'Invalid count' });
    expect(negative.status).toBe(409);

    const movements = await pool.query(
      `SELECT movement_type, quantity_change, previous_quantity, new_quantity, reason
       FROM stock_movements WHERE vehicle_id = $1 ORDER BY created_at ASC`,
      [vehicleId],
    );
    expect(movements.rows).toEqual([
      {
        movement_type: 'adjustment',
        quantity_change: 5,
        previous_quantity: 0,
        new_quantity: 5,
        reason: 'Initial inventory',
      },
      {
        movement_type: 'adjustment',
        quantity_change: -1,
        previous_quantity: 5,
        new_quantity: 4,
        reason: 'Cycle count correction',
      },
    ]);
  });

  it('returns database-backed dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.kpis).toMatchObject({
      total_vehicle_models: 1,
      total_units: 5,
      low_stock_items: 0,
      sold_out_vehicles: 0,
    });
    expect(res.body.kpis.inventory_valuation).toBe('150000.00');
    expect(res.body.category_breakdown[0]).toMatchObject({
      category: 'Sedan',
      units: 5,
    });
    expect(res.body.recent_movements[0].reason).toBe('Initial inventory');

    const ledger = await request(app)
      .get('/api/stock-movements')
      .set('Authorization', `Bearer ${userToken}`);
    expect(ledger.status).toBe(200);
    expect(ledger.body.movements[0]).toMatchObject({
      vehicle_make: 'Toyota',
      movement_type: 'adjustment',
      quantity_change: 5,
      previous_quantity: 0,
      new_quantity: 5,
      reason: 'Initial inventory',
    });
  });

  it('exports real inventory data and protects sales exports', async () => {
    const inventory = await request(app)
      .get('/api/reports/inventory.csv')
      .set('Authorization', `Bearer ${userToken}`);
    expect(inventory.status).toBe(200);
    expect(inventory.headers['content-type']).toContain('text/csv');
    expect(inventory.text).toContain('Toyota');

    const forbidden = await request(app)
      .get('/api/reports/sales.csv')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);

    const sales = await request(app)
      .get('/api/reports/sales.csv')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(sales.status).toBe(200);
    expect(sales.headers['content-type']).toContain('text/csv');
  });

  it('preserves purchase history after vehicle delete', async () => {
    await request(app)
      .post(`/api/vehicles/${vehicleId}/purchase`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ quantity: 1 });

    await request(app)
      .delete(`/api/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const purchases = await pool.query(
      'SELECT vehicle_id, vehicle_make, quantity FROM purchases',
    );
    expect(purchases.rows).toHaveLength(1);
    expect(purchases.rows[0].vehicle_id).toBeNull();
    expect(purchases.rows[0].vehicle_make).toBe('Toyota');

    const movements = await pool.query(
      'SELECT vehicle_id, vehicle_make FROM stock_movements ORDER BY created_at DESC',
    );
    expect(movements.rows).toHaveLength(2);
    expect(movements.rows.every((row: { vehicle_id: string | null }) => row.vehicle_id === null)).toBe(
      true,
    );
  });
});
