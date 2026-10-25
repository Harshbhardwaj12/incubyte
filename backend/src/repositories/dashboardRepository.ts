import type { PoolClient } from 'pg';
import { pool } from '../db/pool.js';
import type { DashboardSummary, Purchase, StockMovement } from '../types.js';

type Queryable = Pick<typeof pool, 'query'> | PoolClient;

export async function getDashboardSummary(
  lowStockThreshold = 2,
  db: Queryable = pool,
): Promise<DashboardSummary> {
  const [kpis, categories, recentPurchases, bestSelling, salesTrend, recentMovements] =
    await Promise.all([
      db.query<DashboardSummary['kpis']>(
        `SELECT
           COUNT(*)::int AS total_vehicle_models,
           COALESCE(SUM(quantity), 0)::int AS total_units,
           COALESCE(SUM(price * quantity), 0)::numeric AS inventory_valuation,
           COUNT(*) FILTER (WHERE quantity > 0 AND quantity <= $1)::int AS low_stock_items,
           COUNT(*) FILTER (WHERE quantity = 0)::int AS sold_out_vehicles
         FROM vehicles`,
        [lowStockThreshold],
      ),
      db.query<DashboardSummary['category_breakdown'][number]>(
        `SELECT
           category,
           COUNT(*)::int AS vehicle_models,
           COALESCE(SUM(quantity), 0)::int AS units,
           COALESCE(SUM(price * quantity), 0)::numeric AS valuation
         FROM vehicles
         GROUP BY category
         ORDER BY units DESC, category ASC`,
      ),
      db.query<Purchase>(
        `SELECT p.*, u.email AS acting_user_email
         FROM purchases p
         LEFT JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC
         LIMIT 8`,
      ),
      db.query<DashboardSummary['best_selling_vehicles'][number]>(
        `SELECT
           vehicle_id,
           vehicle_make,
           vehicle_model,
           vehicle_category,
           SUM(quantity)::int AS units_sold,
           SUM(total_price)::numeric AS revenue,
           MAX(created_at) AS last_purchase_at
         FROM purchases
         GROUP BY vehicle_id, vehicle_make, vehicle_model, vehicle_category
         ORDER BY units_sold DESC, revenue DESC, last_purchase_at DESC
         LIMIT 8`,
      ),
      db.query<DashboardSummary['sales_trend'][number]>(
        `SELECT
           TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date,
           SUM(quantity)::int AS units_sold,
           SUM(total_price)::numeric AS revenue
         FROM purchases
         WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY created_at::date
         ORDER BY created_at::date ASC`,
      ),
      db.query<StockMovement>(
        `SELECT sm.*, u.email AS acting_user_email
         FROM stock_movements sm
         LEFT JOIN users u ON u.id = sm.acting_user_id
         ORDER BY sm.created_at DESC
         LIMIT 8`,
      ),
    ]);

  return {
    kpis: kpis.rows[0],
    category_breakdown: categories.rows,
    recent_purchases: recentPurchases.rows,
    best_selling_vehicles: bestSelling.rows,
    sales_trend: salesTrend.rows,
    recent_movements: recentMovements.rows,
  };
}
