import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-hero-grid">
      <header className="border-b border-charcoal-700/80 bg-charcoal-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="font-display text-2xl tracking-wide text-ivory">
            Apex <span className="text-bronze">Motors</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {user ? (
              <>
                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    isActive ? 'text-bronze-bright' : 'btn-ghost'
                  }
                >
                  Inventory
                </NavLink>
                <span className="hidden text-ivory-muted sm:inline">
                  {user.email}
                  {user.role === 'admin' ? ' · Admin' : ''}
                </span>
                <button type="button" className="btn-secondary" onClick={logout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn-ghost">
                  Log in
                </NavLink>
                <NavLink to="/register" className="btn-primary">
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-charcoal-700/60 py-6 text-center text-xs text-ivory-muted">
        Apex Motors Inventory · Local demo
      </footer>
    </div>
  );
}
