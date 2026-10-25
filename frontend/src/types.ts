export type User = {
  id: string;
  email: string;
  role: 'user' | 'admin';
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  year: number | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type VehicleSearchResponse = {
  vehicles: Vehicle[];
  pagination: Pagination;
};

export type Purchase = {
  id: string;
  vehicle_id: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_category: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  acting_user_email?: string | null;
  created_at: string;
};

export type StockMovement = {
  id: string;
  vehicle_id: string | null;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_category: string;
  movement_type: 'purchase' | 'restock' | 'adjustment';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  acting_user_id: string | null;
  acting_user_email?: string | null;
  reason: string;
  created_at: string;
};

export type DashboardSummary = {
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
    last_purchase_at: string;
  }>;
  sales_trend: Array<{
    date: string;
    units_sold: number;
    revenue: string;
  }>;
  recent_movements: StockMovement[];
};

export type ApiError = {
  error: {
    message: string;
    code?: string;
  };
};
