import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { withTimeout } from "../../lib/withTimeout";
import { useAuth } from "../../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { ScreenLoading, ScreenMessage } from "../../components/ui/Screen";
import AdminPlacas from "./AdminPlacas";

// Só administradores entram no painel das placas (mesma verificação de antes).
export default function AdminGate() {
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
    Promise.resolve(supabase.from('profiles').select('role').eq('id', user.id)
      .abortSignal(controller.signal).maybeSingle())
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
  if (sessionError) return <ScreenMessage><div className="dds-card dds-card-pad max-w-sm w-full text-center space-y-4 text-ink"><p>{sessionError}</p><button className="dds-btn dds-btn-primary dds-btn-block" onClick={retrySession}>Tentar novamente</button></div></ScreenMessage>;
  if (loading || (user && !checked)) return <ScreenLoading label="Verificando acesso administrativo…" />;
  if (!user) return <Navigate to="/login?next=adm" replace />;
  if (permissionError || role !== 'admin') return <ScreenMessage>
    <div className="dds-card dds-card-pad max-w-md w-full text-center space-y-4 text-ink dds-rise">
      <span className="dds-icon-tile mx-auto"><ShieldAlert size={22} /></span>
      <h1 className="font-display text-xl font-bold">{permissionError ? "Não conseguimos verificar seu acesso" : "Entre com sua conta de administrador"}</h1>
      <p className="text-sm text-ink-muted" role="alert">{permissionError || "A conta conectada não tem permissão para administrar as plaquinhas."}</p>
      <p className="text-sm break-all rounded-xl bg-[#f4f6fb] px-3 py-2">Conta conectada: <strong>{user.email ?? 'Conta sem e-mail'}</strong></p>
      {permissionError && <button className="dds-btn dds-btn-outline dds-btn-block" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}
      <button className="dds-btn dds-btn-primary dds-btn-block" disabled={switching} onClick={switchAccount}>{switching ? 'Aguarde…' : 'Entrar com outra conta'}</button>
    </div>
  </ScreenMessage>;
  return <AdminPlacas />;
}
