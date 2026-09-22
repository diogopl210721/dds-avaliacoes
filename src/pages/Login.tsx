import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) return setErro("E-mail ou senha inválidos.");
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={entrar} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-3">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-1">
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold mb-2">Entrar no painel</h1>
        <label className="block">
          <span className="text-sm text-gray-600">E-mail</span>
          <input
            type="email"
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
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
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
