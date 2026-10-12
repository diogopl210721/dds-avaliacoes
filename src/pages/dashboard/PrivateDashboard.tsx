import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ScreenLoading } from "../../components/ui/Screen";
import Dashboard from "./Dashboard";

// Painel de quem entra com e-mail e senha (mesma regra de antes: sem sessão, vai para o login).
export default function PrivateDashboard() {
  const { user, loading } = useAuth();
  if (loading) return <ScreenLoading light />;
  if (!user) return <Navigate to="/login" replace />;
  return <Dashboard />;
}
