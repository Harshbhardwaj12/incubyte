import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('API client vehicle contract', () => {
  it('normalizes database vehicle fields for the UI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            vehicles: [
              {
                id: 'vehicle-1',
                make: 'Toyota',
                model: 'Camry',
                category: 'Sedan',
                price: '31200.00',
                quantity: 2,
                year: 2024,
                description: null,
                image_url: null,
                created_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const result = await api.listVehicles();

    expect(result.vehicles[0].price).toBe(31200);
    expect(result.vehicles[0].image_url).toBeNull();
  });

  it('translates imageUrl when creating a vehicle', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ vehicle: { price: '1', image_url: null } }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.createVehicle({ make: 'A', imageUrl: 'https://example.com/a.jpg' });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      image_url: 'https://example.com/a.jpg',
    });
  });
});
