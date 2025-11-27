import { Link, useNavigate } from "react-router-dom";
import { Activity, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-mist/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-medium text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-paper">
            <Activity size={16} strokeWidth={2.5} />
          </span>
          MediFinder
        </Link>

        <nav className="hidden items-center gap-8 font-body text-sm text-ink/70 md:flex">
          <Link to="/search?q=" className="hover:text-ink">Find a test</Link>
          <Link to="/search?category=package" className="hover:text-ink">Health packages</Link>
          {user && <Link to="/dashboard" className="hover:text-ink">My bookings</Link>}
          {user && <Link to="/reports" className="hover:text-ink">Reports</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-mist px-4 py-2 text-sm font-medium text-ink/80 transition hover:border-teal hover:text-teal"
              >
                <User size={15} /> {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full px-3 py-2 text-sm font-medium text-ink/50 hover:text-ink"
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-ink/80 hover:text-ink">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-deep"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
