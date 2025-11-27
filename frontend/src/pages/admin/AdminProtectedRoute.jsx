import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminProtectedRoute({ children }) {
  const { account } = useAdminAuth();
  if (!account) return <Navigate to="/admin/login" replace />;
  return children;
}
