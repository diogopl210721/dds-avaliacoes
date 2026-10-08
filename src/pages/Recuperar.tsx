import { useState } from "react";
import { Link } from "react-router-dom";
import { callFunction } from "../lib/supabaseClient";
import { MenuPlaca, Campo, BotaoEnviar, CopiarBotao, somente4Digitos } from "../components/PlacaUi";

export default function Recuperar() {
  const [link, setLink] = useState("");
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!link.trim() || !senha) {
      setErro("Preencha o link atual e a senha.");
      return;
    }
    if (!/^\d{4}$/.test(senha)) {
      setErro("A senha tem 4 números.");
      return;
    }
    setCarregando(true);
    try {
      const data = await callFunction<{ ok?: boolean; error?: string; codigo?: string }>(
        "gerenciar-placa",
        { acao: "recuperar", link: link.trim(), senha }
      );
      if (data.error) throw new Error(data.error);
      setCodigo(data.codigo ?? null);
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível localizar a placa.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <MenuPlaca />

        {codigo ? (
          <div className="text-center space-y-4 py-2">
            <div className="text-4xl">🔎</div>
            <h1 className="text-xl font-semibold">Encontramos sua placa</h1>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 flex items-center justify-between gap-2 text-left">
              <div>
                <div className="text-xs text-gray-400">Código da placa</div>
                <div className="font-mono text-lg font-semibold">{codigo}</div>
              </div>
              <CopiarBotao texto={codigo} rotulo="📋 Copiar" />
            </div>
            <Link
              to={`/editar?codigo=${encodeURIComponent(codigo)}`}
              className="inline-block px-5 py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
            >
              Trocar o link agora
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1">Recuperar código da placa</h1>
            <p className="text-sm text-gray-500 mb-4">
              Perdeu o código? Informe o link que a placa abre hoje e a sua senha de 4 números.
            </p>
            <form onSubmit={buscar} className="space-y-3">
              <Campo
                label="Link configurado na placa"
                value={link}
                onChange={setLink}
                placeholder="https://..."
                inputMode="url"
                ajuda="O mesmo link que você colou na ativação (Google Maps, g.page...)."
              />
              <Campo
                label="Sua senha de 4 números"
                value={senha}
                onChange={(v) => setSenha(somente4Digitos(v))}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
                ajuda="A senha que você criou ao ativar a placa."
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <BotaoEnviar carregando={carregando}>Localizar código da placa 🔍</BotaoEnviar>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
