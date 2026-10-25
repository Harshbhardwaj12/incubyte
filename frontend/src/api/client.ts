import type {
  ApiError,
  DashboardSummary,
  StockMovement,
  User,
  Vehicle,
  VehicleSearchResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

type ApiVehicle = Omit<Vehicle, 'price'> & { price: number | string };

function mapVehicle(vehicle: ApiVehicle): Vehicle {
  return { ...vehicle, price: Number(vehicle.price) };
}

function mapVehicles<T extends { vehicles: ApiVehicle[] }>(
  data: T,
): Omit<T, 'vehicles'> & { vehicles: Vehicle[] } {
  return { ...data, vehicles: data.vehicles.map(mapVehicle) };
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as ApiError;
    throw new ApiClientError(
      err.error?.message ?? 'Request failed',
      res.status,
      err.error?.code,
    );
  }
  return data as T;
}

export const api = {
  register(email: string, password: string) {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  login(email: string, password: string) {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return request<{ user: User }>('/auth/me');
  },
  listVehicles() {
    return request<{ vehicles: Vehicle[] }>('/vehicles').then(mapVehicles);
  },
  searchVehicles(params: Record<string, string>) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== ''),
    ).toString();
    return request<VehicleSearchResponse>(`/vehicles/search?${qs}`).then(mapVehicles);
  },
  dashboard() {
    return request<DashboardSummary>('/dashboard');
  },
  listMovements() {
    return request<{ movements: StockMovement[] }>('/stock-movements');
  },
  createVehicle(body: Record<string, unknown>) {
    return request<{ vehicle: Vehicle }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(toApiVehicle(body)),
    }).then((data) => ({ ...data, vehicle: mapVehicle(data.vehicle) }));
  },
  updateVehicle(id: string, body: Record<string, unknown>) {
    return request<{ vehicle: Vehicle }>(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toApiVehicle(body)),
    }).then((data) => ({ ...data, vehicle: mapVehicle(data.vehicle) }));
  },
  deleteVehicle(id: string) {
    return request<void>(`/vehicles/${id}`, { method: 'DELETE' });
  },
  purchase(id: string, quantity: number) {
    return request<{ vehicle: Vehicle }>(`/vehicles/${id}/purchase`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    }).then((data) => ({ ...data, vehicle: mapVehicle(data.vehicle) }));
  },
  restock(id: string, quantity: number, reason?: string) {
    return request<{ vehicle: Vehicle }>(`/vehicles/${id}/restock`, {
      method: 'POST',
      body: JSON.stringify({ quantity, ...(reason ? { reason } : {}) }),
    }).then((data) => ({ ...data, vehicle: mapVehicle(data.vehicle) }));
  },
  adjust(id: string, quantityChange: number, reason: string) {
    return request<{ vehicle: Vehicle }>(`/vehicles/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ quantityChange, reason }),
    }).then((data) => ({ ...data, vehicle: mapVehicle(data.vehicle) }));
  },
  async downloadCsv(path: string, filename: string): Promise<void> {
    const token = getToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as ApiError;
      throw new ApiClientError(data.error?.message ?? 'Export failed', res.status, data.error?.code);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

function toApiVehicle(body: Record<string, unknown>): Record<string, unknown> {
  const { imageUrl, ...rest } = body;
  return { ...rest, ...(imageUrl !== undefined ? { image_url: imageUrl } : {}) };
}
