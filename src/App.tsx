import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Ativar from "./pages/Ativar";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import AdminPlacas from "./pages/admin/AdminPlacas";
import AdminQrCodes from "./pages/admin/AdminQrCodes";
import { useAuth } from "./hooks/useAuth";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Centered>Carregando...</Centered>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ativar" element={<Ativar />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPlacas />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/qrcodes"
          element={
            <PrivateRoute>
              <AdminQrCodes />
            </PrivateRoute>
          }
        />
        {/* Nota: /a/:slug NÃO é uma rota aqui — o QR/NFC aponta direto
            para a Edge Function scan-redirect (ver README), que já faz
            302 sem precisar carregar este SPA. Isso é o que garante o
            redirecionamento "instantâneo" pedido no briefing. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
