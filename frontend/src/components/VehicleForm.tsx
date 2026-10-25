import { FormEvent, useState } from 'react';
import type { Vehicle } from '../types';

export type VehicleFormValues = {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  year?: number | null;
  description?: string | null;
  imageUrl?: string | null;
};

type Props = {
  initial?: Vehicle | null;
  onSubmit: (values: VehicleFormValues) => Promise<void>;
  onCancel: () => void;
};

const categories = ['Sedan', 'SUV', 'Truck', 'Sports', 'Luxury', 'Electric'];

export function VehicleForm({ initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<VehicleFormValues>({
    make: initial?.make ?? '',
    model: initial?.model ?? '',
    category: initial?.category ?? 'Sedan',
    price: initial?.price ?? 0,
    quantity: initial?.quantity ?? 0,
    year: initial?.year ?? undefined,
    description: initial?.description ?? '',
    imageUrl: initial?.image_url ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        ...values,
        year: values.year || null,
        description: values.description || null,
        imageUrl: values.imageUrl || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-sm border border-bronze/30 bg-charcoal-900 p-4"
    >
      <h2 className="font-display text-2xl">
        {initial ? 'Edit vehicle' : 'Add vehicle'}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Make</label>
          <input
            className="input"
            required
            value={values.make}
            onChange={(e) => setValues({ ...values, make: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Model</label>
          <input
            className="input"
            required
            value={values.model}
            onChange={(e) => setValues({ ...values, model: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={values.category}
            onChange={(e) => setValues({ ...values, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input
            className="input"
            type="number"
            value={values.year ?? ''}
            onChange={(e) =>
              setValues({
                ...values,
                year: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div>
          <label className="label">Price</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            required
            value={values.price}
            onChange={(e) => setValues({ ...values, price: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Quantity</label>
          <input
            className="input"
            type="number"
            min={0}
            required
            disabled={Boolean(initial)}
            value={values.quantity}
            onChange={(e) =>
              setValues({ ...values, quantity: Number(e.target.value) })
            }
          />
          {initial && (
            <p className="mt-1 text-xs text-ivory-muted">
              Use the stock adjustment controls on the vehicle card to change inventory with a reason.
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="label">Image URL</label>
          <input
            className="input"
            type="url"
            value={values.imageUrl ?? ''}
            onChange={(e) => setValues({ ...values, imageUrl: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea
            className="input min-h-[80px]"
            value={values.description ?? ''}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
          />
        </div>
      </div>
      {error && <p className="text-sm text-accent-soft">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
