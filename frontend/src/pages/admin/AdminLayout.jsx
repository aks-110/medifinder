import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const TABS = [
  { to: "/admin/dashboard", label: "Overview" },
  { to: "/admin/providers", label: "Providers" },
  { to: "/admin/bookings", label: "Bookings" },
];

export default function AdminLayout() {
  const { account, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-mist bg-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-lg text-paper">MediFinder Admin</p>
            <p className="text-xs text-paper/50">{account.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
            className="rounded-full border border-paper/20 px-4 py-2 text-sm text-paper/70 hover:border-coral hover:text-coral"
          >
            Log out
          </button>
        </div>
        <div className="mx-auto flex max-w-5xl gap-6 px-6">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition ${
                location.pathname === t.to ? "border-coral text-paper" : "border-transparent text-paper/50 hover:text-paper"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
