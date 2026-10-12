import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { withTimeout } from "../lib/withTimeout";

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-3">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-1">
          ← Voltar
        </Link>
        <Link to="/minisite" className="text-sm text-emerald-700 block">Estúdio de mini páginas →</Link>
        <h1 className="text-xl font-semibold mb-2">Entrar no painel</h1>
        <label className="block">
          <span className="text-sm text-gray-600">E-mail</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-600">Senha</span>
          <input
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        {erro && <p className="text-sm text-red-600" role="alert">{erro}</p>}
        <button
          type="submit"
          disabled={carregando}
          className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

