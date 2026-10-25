import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const mocks = vi.hoisted(() => ({
  searchVehicles: vi.fn(),
  dashboard: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  purchase: vi.fn(),
  restock: vi.fn(),
  adjust: vi.fn(),
  downloadCsv: vi.fn(),
}));

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('../api/client', () => ({
  api: mocks,
  ApiClientError: class ApiClientError extends Error {},
}));

vi.mock('../auth/AuthContext', () => ({ useAuth: useAuthMock }));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { id: 'admin-id', email: 'admin@example.com', role: 'admin' } });
    mocks.searchVehicles.mockResolvedValue({
      vehicles: [
        {
          id: 'vehicle-1',
          make: 'Toyota',
          model: 'Camry',
          category: 'Sedan',
          price: 30000,
          quantity: 2,
          year: 2024,
          description: 'Executive sedan',
          image_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'vehicle-2',
          make: 'Ford',
          model: 'Mustang',
          category: 'Sports',
          price: 45000,
          quantity: 0,
          year: 2025,
          description: null,
          image_url: null,
          created_at: '2026-01-02T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 12, total: 2, totalPages: 1 },
    });
    mocks.dashboard.mockResolvedValue({
      kpis: {
        total_vehicle_models: 2,
        total_units: 2,
        inventory_valuation: '60000.00',
        low_stock_items: 1,
        sold_out_vehicles: 1,
      },
      category_breakdown: [{ category: 'Sedan', vehicle_models: 1, units: 2, valuation: '60000.00' }],
      recent_purchases: [],
      best_selling_vehicles: [],
      sales_trend: [],
      recent_movements: [{
        id: 'movement-1',
        vehicle_id: 'vehicle-1',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        vehicle_category: 'Sedan',
        movement_type: 'adjustment',
        quantity_change: 2,
        previous_quantity: 0,
        new_quantity: 2,
        acting_user_id: 'admin-id',
        acting_user_email: 'admin@example.com',
        reason: 'Initial inventory',
        created_at: '2026-01-01T00:00:00.000Z',
      }],
    });
  });

  it('renders database-backed KPIs, inventory, ledger, and admin controls', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText('Inventory command center')).toBeInTheDocument();
    expect(screen.getByText('Inventory value')).toBeInTheDocument();
    expect(screen.getByText('$60,000')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Toyota Camry' })).toBeInTheDocument();
    expect(screen.getByText('Stock movement ledger')).toBeInTheDocument();
    expect(await screen.findByText(/Initial inventory/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add vehicle' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Purchase' })[1]).toBeDisabled();
    });
    expect(mocks.searchVehicles).toHaveBeenCalledWith(expect.objectContaining({ page: '1', pageSize: '12' }));
    expect(mocks.dashboard).toHaveBeenCalledOnce();
  });
});
