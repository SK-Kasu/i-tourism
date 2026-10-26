import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-surface-border">
      <Link to="/" className="text-heading-md text-primary-600">
        I-Tourism
      </Link>
      <nav className="flex items-center gap-4 text-body text-ink-600">
        {user ? (
          <>
            {user.role === "TRAVELER" && <Link to="/my-bookings">My bookings</Link>}
            {user.role === "OWNER" && <Link to="/owner/dashboard">Dashboard</Link>}
            <button onClick={logout} className="text-ink-600 hover:text-ink-900">
              Log out
            </button>
          </>
        ) : (
          <Link to="/login">Log in</Link>
        )}
      </nav>
    </header>
  );
}
