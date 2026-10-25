CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_category TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'restock', 'adjustment')),
  quantity_change INTEGER NOT NULL CHECK (quantity_change <> 0),
  previous_quantity INTEGER NOT NULL CHECK (previous_quantity >= 0),
  new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
  acting_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_vehicle ON stock_movements (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements (movement_type);

-- Preserve the opening balance of vehicles that existed before the ledger migration.
INSERT INTO stock_movements
  (vehicle_id, vehicle_make, vehicle_model, vehicle_category, movement_type,
   quantity_change, previous_quantity, new_quantity, acting_user_id, reason)
SELECT v.id, v.make, v.model, v.category, 'adjustment',
       v.quantity, 0, v.quantity, NULL, 'Opening balance'
FROM vehicles v
WHERE v.quantity > 0
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements sm
    WHERE sm.vehicle_id = v.id AND sm.reason = 'Opening balance'
  );
