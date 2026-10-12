import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Avaliar from "./pages/Avaliar";
import { ScreenLoading } from "./components/ui/Screen";

// A tela que o cliente vê depois de escanear (Avaliar) e a página inicial vêm no
// pacote principal, sem o código do banco: abrem rápido no celular. As demais
// telas são baixadas só quando alguém entra nelas.
const MiniStudio = lazy(() => import("./pages/MiniStudio"));
const MiniPublic = lazy(() => import("./pages/MiniPublic"));
const Ativar = lazy(() => import("./pages/Ativar"));
const TrocarLink = lazy(() => import("./pages/TrocarLink"));
const Recuperar = lazy(() => import("./pages/Recuperar"));
const Analise = lazy(() => import("./pages/Analise"));
const Login = lazy(() => import("./pages/Login"));
const PrivateDashboard = lazy(() => import("./pages/dashboard/PrivateDashboard"));
const AdminGate = lazy(() => import("./pages/admin/AdminGate"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<ScreenLoading />}>
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
          <Route path="/adm" element={<AdminGate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard/*" element={<PrivateDashboard />} />
          <Route path="/admin" element={<AdminGate />} />
          {/* As telas de Placas e QR Codes foram unificadas em /admin;
              este redirect evita quebrar algum link/favorito antigo. */}
          <Route path="/admin/qrcodes" element={<Navigate to="/admin" replace />} />
          {/* Nota: /a/:slug NÃO é uma rota aqui — o QR/NFC aponta direto
              para a Edge Function scan-redirect (ver README), que já faz
              302 sem precisar carregar este SPA. Isso é o que garante o
              redirecionamento "instantâneo" pedido no briefing. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
