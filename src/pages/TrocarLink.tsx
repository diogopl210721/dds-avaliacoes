import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { callFunction } from "../lib/supabaseClient";
import { MenuPlaca, Campo, BotaoEnviar, somente4Digitos } from "../components/PlacaUi";

export default function TrocarLink() {
  const [params] = useSearchParams();
  const [codigo, setCodigo] = useState(params.get("codigo") ?? "");
  const [senha, setSenha] = useState("");
  const [novoLink, setNovoLink] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [ok, setOk] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!codigo.trim() || !senha || !novoLink.trim()) {
      setErro("Preencha o código, a senha e o novo link.");
      return;
    }
    if (!/^\d{4}$/.test(senha)) {
      setErro("A senha tem 4 números.");
      return;
    }
    if (!novoLink.trim().startsWith("http")) {
      setErro("Cole o link completo (começando com https://).");
      return;
    }
    setCarregando(true);
    try {
      const data = await callFunction<{ ok?: boolean; error?: string }>("gerenciar-placa", {
        acao: "trocar",
        codigo: codigo.trim(),
        senha,
        novoLink: novoLink.trim(),
      });
      if (data.error) throw new Error(data.error);
      setOk(true);
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível trocar o link.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <MenuPlaca />

        {ok ? (
          <div className="text-center space-y-3 py-4">
            <div className="text-4xl">✅</div>
            <h1 className="text-xl font-semibold">Link trocado!</h1>
            <p className="text-sm text-gray-500">
              A placa já está levando as pessoas para o novo link.
            </p>
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 inline-block">
              Voltar ao início
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-1">Trocar o link da placa</h1>
            <p className="text-sm text-gray-500 mb-4">
              Use quando quiser que a placa leve para outro endereço.
            </p>
            <form onSubmit={salvar} className="space-y-3">
              <Campo
                label="Código da placa"
                value={codigo}
                onChange={setCodigo}
                placeholder="Ex: DDS215"
                ajuda="Está impresso na placa."
              />
              <p className="text-xs">
                <Link to="/recuperar" className="text-brand-700 underline">
                  Esqueceu o código? Clique para recuperar
                </Link>
              </p>
              <Campo
                label="Sua senha de 4 números"
                value={senha}
                onChange={(v) => setSenha(somente4Digitos(v))}
                placeholder="0000"
                inputMode="numeric"
                maxLength={4}
              />
              <Campo
                label="Novo link de destino"
                value={novoLink}
                onChange={setNovoLink}
                placeholder="https://..."
                inputMode="url"
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <BotaoEnviar carregando={carregando}>Salvar novo link</BotaoEnviar>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
