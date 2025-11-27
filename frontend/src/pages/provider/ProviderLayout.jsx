import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useProviderAuth } from "../../context/ProviderAuthContext.jsx";

const TABS = [
  { to: "/provider/dashboard", label: "Overview" },
  { to: "/provider/tests", label: "Tests & pricing" },
  { to: "/provider/bookings", label: "Bookings" },
];

export default function ProviderLayout() {
  const { account, logout } = useProviderAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-mist bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-lg text-ink">{account.providerName}</p>
            <p className="text-xs text-ink/50">Provider portal</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/provider/login");
            }}
            className="rounded-full border border-mist px-4 py-2 text-sm text-ink/60 hover:border-coral hover:text-coral"
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
                location.pathname === t.to ? "border-teal text-ink" : "border-transparent text-ink/50 hover:text-ink"
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
