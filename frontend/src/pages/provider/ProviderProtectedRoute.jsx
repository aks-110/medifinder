import { Navigate } from "react-router-dom";
import { useProviderAuth } from "../../context/ProviderAuthContext.jsx";

export default function ProviderProtectedRoute({ children }) {
  const { account } = useProviderAuth();
  if (!account) return <Navigate to="/provider/login" replace />;
  return children;
}
