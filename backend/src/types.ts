export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  email_normalized: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: string;
  quantity: number;
  year: number | null;
  description: string | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Purchase {
  id: string;
  user_id: string | null;
  vehicle_id: string | null;
  quantity: number;
  unit_price: string;
  total_price: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_category: string;
  created_at: Date;
  acting_user_email?: string | null;
}

export type StockMovementType = 'purchase' | 'restock' | 'adjustment';

export interface StockMovement {
  id: string;
  vehicle_id: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_category: string;
  movement_type: StockMovementType;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  acting_user_id: string | null;
  reason: string;
  created_at: Date;
  acting_user_email?: string | null;
}

export interface DashboardSummary {
  kpis: {
    total_vehicle_models: number;
    total_units: number;
    inventory_valuation: string;
    low_stock_items: number;
    sold_out_vehicles: number;
  };
  category_breakdown: Array<{
    category: string;
    vehicle_models: number;
    units: number;
    valuation: string;
  }>;
  recent_purchases: Purchase[];
  best_selling_vehicles: Array<{
    vehicle_id: string | null;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_category: string;
    units_sold: number;
    revenue: string;
    last_purchase_at: Date;
  }>;
  sales_trend: Array<{
    date: string;
    units_sold: number;
    revenue: string;
  }>;
  recent_movements: StockMovement[];
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload;
  }
}
