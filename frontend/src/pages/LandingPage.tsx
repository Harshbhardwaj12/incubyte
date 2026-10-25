import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden rounded-sm border border-charcoal-700/50 bg-charcoal-900/60">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/85 to-transparent" />
      <div className="relative flex min-h-[70vh] flex-col justify-end gap-6 p-8 md:p-14">
        <p className="font-display text-5xl leading-none text-ivory md:text-7xl">
          Apex Motors
        </p>
        <h1 className="max-w-xl font-display text-2xl text-bronze-bright md:text-3xl">
          Curated inventory. Honest stock. Seamless purchase.
        </h1>
        <p className="max-w-md text-sm text-ivory-muted md:text-base">
          Browse sedans, SUVs, trucks, sports, and luxury vehicles with live
          quantities backed by a real PostgreSQL inventory.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link to="/inventory" className="btn-primary">
              Open inventory
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
