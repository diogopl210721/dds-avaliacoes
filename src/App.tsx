import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { withTimeout } from "./lib/withTimeout";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import MiniStudio from "./pages/MiniStudio";
import MiniPublic from "./pages/MiniPublic";
import Ativar from "./pages/Ativar";
import Avaliar from "./pages/Avaliar";
import TrocarLink from "./pages/TrocarLink";
import Recuperar from "./pages/Recuperar";
import Analise from "./pages/Analise";
import Login from "./pages/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import AdminPlacas from "./pages/admin/AdminPlacas";
import { useAuth } from "./hooks/useAuth";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Centered>Carregando...</Centered>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute() {
  const { user, loading, error: sessionError, retry: retrySession } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [switching, setSwitching] = useState(false);
  useEffect(() => {
    setChecked(false); setRole(null); setPermissionError("");
    if (!user) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    supabase.from('profiles').select('role').eq('id', user.id)
      .abortSignal(controller.signal).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setPermissionError("Não foi possível verificar seu acesso. Tente novamente.");
        else setRole(data?.role ?? 'customer');
        setChecked(true);
      }, () => { if (active) { setPermissionError("Não foi possível verificar seu acesso. Tente novamente."); setChecked(true); } })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [user?.id, attempt]);
  async function switchAccount() {
    setSwitching(true);
    try {
      const { error } = await withTimeout(supabase.auth.signOut({ scope: 'local' }), "Não foi possível trocar de conta. Tente novamente.");
      if (error) throw error;
      navigate('/login?next=adm', { replace: true });
    } catch { setPermissionError("Não foi possível trocar de conta. Tente novamente."); }
    finally { setSwitching(false); }
  }
  if (sessionError) return <Centered><div className="text-center space-y-3"><p>{sessionError}</p><button className="text-brand-700 underline" onClick={retrySession}>Tentar novamente</button></div></Centered>;
  if (loading || (user && !checked)) return <Centered>Verificando acesso administrativo…</Centered>;
  if (!user) return <Navigate to="/login?next=adm" replace />;
  if (permissionError || role !== 'admin') return <Centered><div className="bg-white rounded-xl shadow p-6 max-w-md mx-4 text-center space-y-4">
    <h1 className="text-xl font-semibold text-gray-800">{permissionError ? "Não conseguimos verificar seu acesso" : "Entre com sua conta de administrador"}</h1>
    <p className="text-sm" role="alert">{permissionError || "A conta conectada não tem permissão para administrar as plaquinhas."}</p>
    <p className="text-sm break-all">Conta conectada: <strong>{user.email ?? 'Conta sem e-mail'}</strong></p>
    {permissionError && <button className="text-brand-700 underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}
    <button className="block w-full rounded-lg bg-brand-500 text-white px-4 py-2.5 disabled:opacity-50" disabled={switching} onClick={switchAccount}>{switching ? 'Aguarde…' : 'Entrar com outra conta'}</button>
  </div></Centered>;
  return <AdminPlacas />;
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
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/minisite" element={<MiniStudio />} />
        <Route path="/demo" element={<MiniStudio demo />} />
        <Route path="/loja/:slug" element={<MiniPublic />} />
        <Route path="/ativar" element={<Ativar />} />
        <Route path="/cadastrar" element={<Ativar />} />
        <Route path="/cadastrarqrcode" element={<Ativar />} />
        <Route path="/cadastrartag" element={<Ativar />} />
        <Route path="/editar" element={<TrocarLink />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/avaliar" element={<Avaliar />} />
        <Route path="/analise" element={<Analise />} />
        <Route path="/sistema" element={<Analise />} />
        <Route path="/adm" element={<AdminRoute />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/admin" element={<AdminRoute />} />
        {/* As telas de Placas e QR Codes foram unificadas em /admin;
            este redirect evita quebrar algum link/favorito antigo. */}
        <Route path="/admin/qrcodes" element={<Navigate to="/admin" replace />} />
        {/* Nota: /a/:slug NÃO é uma rota aqui — o QR/NFC aponta direto
            para a Edge Function scan-redirect (ver README), que já faz
            302 sem precisar carregar este SPA. Isso é o que garante o
            redirecionamento "instantâneo" pedido no briefing. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

