import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';
import type { Vehicle } from '../types.js';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export interface VehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  year?: number | null;
  description?: string | null;
  image_url?: string | null;
}

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  status?: 'in_stock' | 'low_stock' | 'sold_out';
  lowStockThreshold?: number;
  sortBy?: 'price' | 'quantity' | 'year' | 'created_at' | 'make';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface VehicleSearchResult {
  vehicles: Vehicle[];
  total: number;
}

export async function createVehicle(
  input: VehicleInput,
  db: Queryable = pool,
): Promise<Vehicle> {
  const imageUrl = input.image_url === '' ? null : input.image_url ?? null;
  const result = await db.query<Vehicle>(
    `INSERT INTO vehicles
      (make, model, category, price, quantity, year, description, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      input.make,
      input.model,
      input.category,
      input.price,
      input.quantity,
      input.year ?? null,
      input.description ?? null,
      imageUrl,
    ],
  );
  return result.rows[0];
}

export async function listVehicles(db: Queryable = pool): Promise<Vehicle[]> {
  const result = await db.query<Vehicle>(
    'SELECT * FROM vehicles ORDER BY created_at DESC',
  );
  return result.rows;
}

export async function findVehicleById(
  id: string,
  db: Queryable = pool,
): Promise<Vehicle | null> {
  const result = await db.query<Vehicle>('SELECT * FROM vehicles WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findVehicleByIdForUpdate(
  id: string,
  db: Queryable = pool,
): Promise<Vehicle | null> {
  const result = await db.query<Vehicle>(
    'SELECT * FROM vehicles WHERE id = $1 FOR UPDATE',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function searchVehicles(
  filters: VehicleSearchFilters,
  db: Queryable = pool,
): Promise<VehicleSearchResult> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.make) {
    params.push(`%${filters.make.toLowerCase()}%`);
    clauses.push(`LOWER(make) LIKE $${params.length}`);
  }
  if (filters.model) {
    params.push(`%${filters.model.toLowerCase()}%`);
    clauses.push(`LOWER(model) LIKE $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category.toLowerCase());
    clauses.push(`LOWER(category) = $${params.length}`);
  }
  if (filters.minPrice !== undefined) {
    params.push(filters.minPrice);
    clauses.push(`price >= $${params.length}`);
  }
  if (filters.maxPrice !== undefined) {
    params.push(filters.maxPrice);
    clauses.push(`price <= $${params.length}`);
  }

  if (filters.year !== undefined) {
    params.push(filters.year);
    clauses.push(`year = $${params.length}`);
  }
  if (filters.status === 'sold_out') {
    clauses.push('quantity = 0');
  } else if (filters.status === 'in_stock') {
    clauses.push('quantity > 0');
  } else if (filters.status === 'low_stock') {
    params.push(filters.lowStockThreshold ?? 2);
    clauses.push(`quantity > 0 AND quantity <= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sortColumns: Record<NonNullable<VehicleSearchFilters['sortBy']>, string> = {
    price: 'price',
    quantity: 'quantity',
    year: 'year',
    created_at: 'created_at',
    make: 'make',
  };
  const sortColumn = sortColumns[filters.sortBy ?? 'created_at'];
  const sortDirection = filters.sortDirection === 'asc' ? 'ASC' : 'DESC';
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  params.push(pageSize, (page - 1) * pageSize);
  const limitParam = params.length - 1;
  const offsetParam = params.length;
  const result = await db.query<Vehicle & { total_count: string }>(
    `SELECT *, COUNT(*) OVER()::text AS total_count
     FROM vehicles ${where}
     ORDER BY ${sortColumn} ${sortDirection}, id
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    params,
  );
  const vehicles = result.rows.map((row) => {
    const vehicle = { ...row };
    delete (vehicle as { total_count?: string }).total_count;
    return vehicle;
  });
  return {
    vehicles,
    total: result.rows[0] ? Number(result.rows[0].total_count) : 0,
  };
}

export async function updateVehicle(
  id: string,
  input: Partial<VehicleInput>,
  db: Queryable = pool,
): Promise<Vehicle | null> {
  const fields: string[] = [];
  const params: unknown[] = [];

  const mapping: Array<[keyof VehicleInput, string]> = [
    ['make', 'make'],
    ['model', 'model'],
    ['category', 'category'],
    ['price', 'price'],
    ['quantity', 'quantity'],
    ['year', 'year'],
    ['description', 'description'],
    ['image_url', 'image_url'],
  ];

  for (const [key, column] of mapping) {
    if (input[key] !== undefined) {
      let value = input[key];
      if (key === 'image_url' && value === '') value = null;
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  }

  if (!fields.length) return findVehicleById(id, db);

  fields.push('updated_at = NOW()');
  params.push(id);

  const result = await db.query<Vehicle>(
    `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

export async function deleteVehicle(
  id: string,
  db: Queryable = pool,
): Promise<boolean> {
  const result = await db.query('DELETE FROM vehicles WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

/** Conditional stock decrement — returns updated row or null if insufficient stock. */
export async function decrementStockIfAvailable(
  id: string,
  quantity: number,
  db: Queryable = pool,
): Promise<Vehicle | null> {
  const result = await db.query<Vehicle>(
    `UPDATE vehicles
     SET quantity = quantity - $2, updated_at = NOW()
     WHERE id = $1 AND quantity >= $2
     RETURNING *`,
    [id, quantity],
  );
  return result.rows[0] ?? null;
}

export async function incrementStock(
  id: string,
  quantity: number,
  db: Queryable = pool,
): Promise<Vehicle | null> {
  const result = await db.query<Vehicle>(
    `UPDATE vehicles
     SET quantity = quantity + $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, quantity],
  );
  return result.rows[0] ?? null;
}
