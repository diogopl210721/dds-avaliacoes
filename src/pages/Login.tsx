import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, LogIn } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { withTimeout } from "../lib/withTimeout";
import { AuthShell, Erro, TituloForm } from "../components/PlacaUi";
import { Spinner } from "../components/ui/Fx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password: senha }),
        "O login demorou mais que o esperado. Confira a conexão e tente novamente."
      );
      if (error || !data.user) {
        setErro(error?.status === 429 ? "Muitas tentativas. Aguarde um pouco e tente novamente." : "E-mail ou senha inválidos.");
        return;
      }
      const { data: profile, error: profileError } = await supabase.from("profiles")
        .select("role").eq("id", data.user.id)
        .abortSignal(AbortSignal.timeout(12000)).maybeSingle();
      if (profileError) throw new Error("Seu login foi aceito, mas não foi possível verificar a permissão. Tente novamente.");
      if (params.get("next") === "adm" && profile?.role !== "admin") {
        setErro("Esta conta não tem acesso administrativo. Entre com sua conta de administrador.");
        return;
      }
      navigate(profile?.role === "admin" ? params.get("next") === "minisite" ? "/minisite" : "/adm" : params.get("next") === "minisite" ? "/minisite" : "/dashboard", { replace: true });
    } catch (e: any) {
      setErro(e?.message || "Não foi possível entrar. Confira a conexão e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Painel"
      title={<>Entre no seu <span className="font-serif italic font-normal dds-spectrum-text">painel.</span></>}
      text="Acesso com e-mail e senha para administradores e contas do DDS Avaliações."
      points={["Placas, QR Codes e links em um só lugar", "Estúdio de mini páginas"]}
    >
      <TituloForm icon={<LogIn size={20} />} titulo="Entrar no painel" texto="Use o e-mail e a senha da sua conta." />
      <form onSubmit={entrar} className="space-y-4">
        <label className="block">
          <span className="dds-label">E-mail</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="dds-input"
            placeholder="voce@empresa.com.br"
          />
        </label>
        <label className="block">
          <span className="dds-label">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="dds-input"
          />
        </label>
        {erro && <Erro>{erro}</Erro>}
        <button type="submit" disabled={carregando} className="dds-btn dds-btn-primary dds-btn-lg dds-btn-block mt-2">
          {carregando ? <><Spinner /> Entrando...</> : "Entrar"}
        </button>
      </form>
      <div className="mt-6 pt-5 border-t border-[#e8edf5] flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-ink-muted">Tem uma placa? Use o código e a senha.</span>
        <Link to="/sistema" className="font-semibold text-brand-600 hover:text-brand-700">Meu sistema</Link>
      </div>
      <Link to="/minisite" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">Estúdio de mini páginas <ArrowUpRight size={15} /></Link>
    </AuthShell>
  );
}
