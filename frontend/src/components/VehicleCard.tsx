import { useState } from 'react';
import { ApiClientError } from '../api/client';
import type { Vehicle } from '../types';

type Props = {
  vehicle: Vehicle;
  isAdmin: boolean;
  onPurchase: (id: string, qty: number) => Promise<void>;
  onRestock: (id: string, qty: number, reason: string) => Promise<void>;
  onAdjust: (id: string, quantityChange: number, reason: string) => Promise<void>;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => Promise<void>;
};

export function VehicleCard({
  vehicle,
  isAdmin,
  onPurchase,
  onRestock,
  onAdjust,
  onEdit,
  onDelete,
}: Props) {
  const [qty, setQty] = useState(1);
  const [restockQty, setRestockQty] = useState(1);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [reason, setReason] = useState('Admin restock');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const soldOut = vehicle.quantity === 0;
  const lowStock = vehicle.quantity > 0 && vehicle.quantity <= 2;

  async function handlePurchase() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await onPurchase(vehicle.id, qty);
      setMessage('Purchase successful');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Purchase failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestock() {
    setBusy(true);
    setError(null);
    try {
      await onRestock(vehicle.id, restockQty, reason.trim() || 'Admin restock');
      setMessage('Restocked');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Restock failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleAdjustment() {
    if (!adjustmentQty || !reason.trim()) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await onAdjust(vehicle.id, adjustmentQty, reason.trim());
      setAdjustmentQty(0);
      setMessage('Stock adjusted');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Adjustment failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden border border-charcoal-700 bg-charcoal-900/70">
      <div className="relative aspect-[16/10] overflow-hidden bg-charcoal-800">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ivory-muted">
            No image
          </div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 bg-accent px-2 py-1 text-xs font-semibold uppercase tracking-wide">
            Sold out
          </span>
        )}
        {lowStock && (
          <span className="absolute left-3 top-3 bg-bronze px-2 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal-950">
            Low stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-bronze">{vehicle.category}</p>
          <h3 className="font-display text-2xl text-ivory">
            {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.year && (
            <p className="text-sm text-ivory-muted">{vehicle.year}</p>
          )}
        </div>
        {vehicle.description && (
          <p className={showDetails ? 'text-sm text-ivory-muted' : 'line-clamp-2 text-sm text-ivory-muted'}>{vehicle.description}</p>
        )}
        <button type="button" className="self-start text-xs uppercase tracking-wider text-bronze-bright" onClick={() => setShowDetails((current) => !current)}>
          {showDetails ? 'Hide details' : 'View details'}
        </button>
        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="font-display text-2xl text-bronze-bright">
            ${vehicle.price.toLocaleString()}
          </p>
          <p className="text-sm text-ivory-muted">
            Stock: <span className="text-ivory">{vehicle.quantity}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            className="input w-20"
            value={qty}
            aria-label={`Purchase quantity for ${vehicle.make} ${vehicle.model}`}
            onChange={(e) => setQty(Number(e.target.value))}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={soldOut || busy || qty < 1}
            onClick={handlePurchase}
          >
            Purchase
          </button>
          {isAdmin && (
            <>
              <button type="button" className="btn-secondary" onClick={() => onEdit(vehicle)}>
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost text-accent-soft"
                disabled={busy}
                onClick={() => onDelete(vehicle.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 border-t border-charcoal-700 pt-3">
            <input
              className="input min-w-48 flex-1"
              value={reason}
              aria-label={`Stock movement reason for ${vehicle.make} ${vehicle.model}`}
              placeholder="Reason"
              onChange={(e) => setReason(e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="input w-20"
              value={restockQty}
              aria-label={`Restock quantity for ${vehicle.make} ${vehicle.model}`}
              onChange={(e) => setRestockQty(Number(e.target.value))}
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || restockQty < 1}
              onClick={handleRestock}
            >
              Restock
            </button>
            <input
              type="number"
              className="input w-24"
              value={adjustmentQty || ''}
              aria-label={`Stock adjustment for ${vehicle.make} ${vehicle.model}`}
              placeholder="+/-"
              onChange={(e) => setAdjustmentQty(Number(e.target.value))}
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || adjustmentQty === 0 || !reason.trim()}
              onClick={handleAdjustment}
            >
              Adjust
            </button>
          </div>
        )}
        {message && <p className="text-sm text-bronze-bright">{message}</p>}
        {error && (
          <p className="text-sm text-accent-soft" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}
