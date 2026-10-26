import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "../ui/Spinner.jsx";

/**
 * Redirects to /login if not authenticated, or to / if the logged-in
 * user's role doesn't match the route (e.g. a traveler hitting an owner page).
 */
export default function ProtectedRoute({ role, children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
