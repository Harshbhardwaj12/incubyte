import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { VehicleCard } from '../components/VehicleCard';
import { VehicleForm, type VehicleFormValues } from '../components/VehicleForm';
import type { DashboardSummary, Pagination, Vehicle } from '../types';

const emptyFilters = {
  make: '',
  model: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  year: '',
  status: '',
  sortBy: 'created_at',
  sortDirection: 'desc',
};

function money(value: string | number): string {
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function date(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function movementName(type: string): string {
  return type === 'purchase' ? 'Sale' : type === 'restock' ? 'Restock' : 'Adjustment';
}

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventory, dashboard] = await Promise.all([
        api.searchVehicles({ ...filters, page: String(page), pageSize: '12', lowStockThreshold: '2' }),
        api.dashboard(),
      ]);
      setVehicles(inventory.vehicles);
      setPagination(inventory.pagination);
      setSummary(dashboard);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { void load(); }, [load]);

  function updateFilter(key: keyof typeof emptyFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  async function handleSave(values: VehicleFormValues) {
    if (editing) await api.updateVehicle(editing.id, values);
    else await api.createVehicle(values);
    setShowForm(false);
    setEditing(null);
    await load();
  }

  async function handlePurchase(id: string, quantity: number) {
    await api.purchase(id, quantity);
    await load();
  }

  async function handleRestock(id: string, quantity: number, reason: string) {
    await api.restock(id, quantity, reason);
    await load();
  }

  async function handleAdjust(id: string, quantityChange: number, reason: string) {
    await api.adjust(id, quantityChange, reason);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this vehicle? Purchase and movement history will be preserved.')) return;
    await api.deleteVehicle(id);
    await load();
  }

  async function handleExport(path: string, filename: string) {
    setExportError(null);
    try {
      await api.downloadCsv(path, filename);
    } catch (err) {
      setExportError(err instanceof ApiClientError ? err.message : 'Export failed');
    }
  }

  const kpis = summary?.kpis;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-bronze">Apex Motors / Operations</p>
          <h1 className="font-display text-4xl text-ivory">Inventory command center</h1>
          <p className="text-sm text-ivory-muted">Live stock, valuation, and movement intelligence from PostgreSQL.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => void handleExport('/reports/inventory.csv', 'apex-motors-inventory.csv')}>Export inventory CSV</button>
          {isAdmin && <button type="button" className="btn-secondary" onClick={() => void handleExport('/reports/sales.csv', 'apex-motors-sales.csv')}>Export sales CSV</button>}
          {isAdmin && <button type="button" className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>Add vehicle</button>}
        </div>
      </div>

      {exportError && <p className="text-sm text-accent-soft" role="alert">{exportError}</p>}

      <section aria-label="Inventory KPIs" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Vehicle models', kpis?.total_vehicle_models ?? '—', 'Catalogue depth'],
          ['Total units', kpis?.total_units ?? '—', 'Physical inventory'],
          ['Inventory value', kpis ? money(kpis.inventory_valuation) : '—', 'At listed price'],
          ['Low stock', kpis?.low_stock_items ?? '—', '1–2 units remaining'],
          ['Sold out', kpis?.sold_out_vehicles ?? '—', 'Needs replenishment'],
        ].map(([label, value, note]) => (
          <div key={label} className="border border-charcoal-700 bg-charcoal-900/75 p-4">
            <p className="text-xs uppercase tracking-wider text-ivory-muted">{label}</p>
            <p className="mt-2 font-display text-3xl text-bronze-bright">{value}</p>
            <p className="mt-1 text-xs text-ivory-muted">{note}</p>
          </div>
        ))}
      </section>

      {summary && <section className="grid gap-5 lg:grid-cols-3">
        <div className="border border-charcoal-700 bg-charcoal-900/60 p-4">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl text-ivory">By category</h2><span className="text-xs text-ivory-muted">Units / value</span></div>
          <div className="space-y-3">
            {summary.category_breakdown.map((category) => <div key={category.category}>
              <div className="flex justify-between text-sm"><span className="text-ivory">{category.category}</span><span className="text-bronze-bright">{category.units} · {money(category.valuation)}</span></div>
              <div className="mt-1 h-1.5 bg-charcoal-800"><div className="h-full bg-bronze" style={{ width: `${Math.min(100, (category.units / Math.max(1, kpis?.total_units ?? 1)) * 100)}%` }} /></div>
            </div>)}
            {!summary.category_breakdown.length && <p className="text-sm text-ivory-muted">No category data yet.</p>}
          </div>
        </div>
        <div className="border border-charcoal-700 bg-charcoal-900/60 p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-2xl text-ivory">Best sellers</h2><span className="text-xs text-ivory-muted">Units sold</span></div>
          {summary.best_selling_vehicles.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wider text-ivory-muted"><tr><th className="pb-2">Vehicle</th><th className="pb-2">Category</th><th className="pb-2">Units</th><th className="pb-2">Revenue</th></tr></thead><tbody>{summary.best_selling_vehicles.map((vehicle) => <tr key={`${vehicle.vehicle_make}-${vehicle.vehicle_model}`} className="border-t border-charcoal-700"><td className="py-2 text-ivory">{vehicle.vehicle_make} {vehicle.vehicle_model}</td><td className="py-2 text-ivory-muted">{vehicle.vehicle_category}</td><td className="py-2 text-bronze-bright">{vehicle.units_sold}</td><td className="py-2 text-ivory">{money(vehicle.revenue)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-ivory-muted">Sales data will appear after the first purchase.</p>}
        </div>
      </section>}

      {summary && <section className="grid gap-5 lg:grid-cols-3">
        <div className="border border-charcoal-700 bg-charcoal-900/60 p-4"><h2 className="mb-4 font-display text-2xl text-ivory">Recent purchases</h2>{summary.recent_purchases.length ? <div className="space-y-3">{summary.recent_purchases.map((purchase) => <div key={purchase.id} className="flex items-center justify-between gap-3 border-b border-charcoal-700 pb-3 text-sm last:border-0 last:pb-0"><div><p className="text-ivory">{purchase.vehicle_make} {purchase.vehicle_model}</p><p className="text-xs text-ivory-muted">{date(purchase.created_at)} · {purchase.quantity} unit(s)</p></div><span className="text-bronze-bright">{money(purchase.total_price)}</span></div>)}</div> : <p className="text-sm text-ivory-muted">No purchases recorded yet.</p>}</div>
        <div id="stock-movements" className="border border-charcoal-700 bg-charcoal-900/60 p-4"><h2 className="mb-4 font-display text-2xl text-ivory">Stock movement ledger</h2>{summary.recent_movements.length ? <div className="space-y-3">{summary.recent_movements.map((movement) => <div key={movement.id} className="flex items-center justify-between gap-3 border-b border-charcoal-700 pb-3 text-sm last:border-0 last:pb-0"><div><p className="text-ivory">{movement.vehicle_make} {movement.vehicle_model}</p><p className="text-xs text-ivory-muted">{movementName(movement.movement_type)} · {movement.reason}</p></div><span className={movement.quantity_change > 0 ? 'text-emerald-300' : 'text-accent-soft'}>{movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}</span></div>)}</div> : <p className="text-sm text-ivory-muted">No stock movements recorded yet.</p>}</div>
        <div className="border border-charcoal-700 bg-charcoal-900/60 p-4"><h2 className="mb-4 font-display text-2xl text-ivory">Sales trend</h2>{summary.sales_trend.length ? <div className="space-y-3">{summary.sales_trend.map((point) => <div key={point.date} className="flex items-center justify-between gap-3 text-sm"><span className="text-ivory-muted">{date(point.date)}</span><span className="text-ivory">{point.units_sold} sold</span><span className="text-bronze-bright">{money(point.revenue)}</span></div>)}</div> : <p className="text-sm text-ivory-muted">No sales in the last 30 days.</p>}</div>
      </section>}

      <form className="grid gap-3 rounded-sm border border-charcoal-700 bg-charcoal-900/50 p-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => { event.preventDefault(); setPage(1); void load(); }}>
        <input className="input" aria-label="Make filter" placeholder="Make" value={filters.make} onChange={(e) => updateFilter('make', e.target.value)} />
        <input className="input" aria-label="Model filter" placeholder="Model" value={filters.model} onChange={(e) => updateFilter('model', e.target.value)} />
        <select className="input" aria-label="Category filter" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{['Sedan', 'SUV', 'Truck', 'Sports', 'Luxury', 'Electric'].map((category) => <option key={category} value={category}>{category}</option>)}</select>
        <select className="input" aria-label="Stock status filter" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}><option value="">All stock statuses</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="sold_out">Sold out</option></select>
        <input className="input" aria-label="Year filter" placeholder="Year" type="number" min={1886} max={2100} value={filters.year} onChange={(e) => updateFilter('year', e.target.value)} />
        <input className="input" aria-label="Minimum price filter" placeholder="Min price" type="number" min={0} value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
        <input className="input" aria-label="Maximum price filter" placeholder="Max price" type="number" min={0} value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
        <select className="input" aria-label="Inventory sort" value={`${filters.sortBy}:${filters.sortDirection}`} onChange={(e) => { const [sortBy, sortDirection] = e.target.value.split(':'); setFilters((current) => ({ ...current, sortBy, sortDirection })); setPage(1); }}><option value="created_at:desc">Newest first</option><option value="price:asc">Price: low to high</option><option value="price:desc">Price: high to low</option><option value="quantity:asc">Stock: low to high</option><option value="make:asc">Make: A–Z</option></select>
        <button type="button" className="btn-ghost" onClick={() => { setFilters(emptyFilters); setPage(1); }}>Clear filters</button>
      </form>

      {(showForm || editing) && <VehicleForm initial={editing} onSubmit={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />}
      {loading && <p className="text-ivory-muted">Loading live inventory…</p>}
      {error && <p className="text-accent-soft" role="alert">{error}</p>}
      {!loading && !error && vehicles.length === 0 && <p className="rounded-sm border border-dashed border-charcoal-700 p-8 text-center text-ivory-muted">No vehicles match these filters.</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} isAdmin={isAdmin} onPurchase={handlePurchase} onRestock={handleRestock} onAdjust={handleAdjust} onEdit={(selected) => { setEditing(selected); setShowForm(true); }} onDelete={handleDelete} />)}</div>
      {pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-charcoal-700 pt-4 text-sm"><span className="text-ivory-muted">{pagination.total} vehicle models</span><div className="flex gap-2"><button className="btn-secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span className="flex items-center px-2 text-ivory-muted">Page {pagination.page} of {pagination.totalPages}</span><button className="btn-secondary" type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}
    </div>
  );
}
