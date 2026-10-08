import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { callFunction } from "../lib/supabaseClient";
import { MenuPlaca, Campo, BotaoEnviar, CopiarBotao, somente4Digitos } from "../components/PlacaUi";

// Ativação da placa. Quando a pessoa chega pelo QR/NFC da própria placa, o
// link já traz o código e a chave secreta (`k`): ela só informa nome, link e
// escolhe uma senha de 4 números. Se chegar sem a chave (digitou o endereço
// na mão), pede também o código e o PIN da placa.
export default function Ativar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const chave = params.get("k") ?? "";
  const codigoDoLink = params.get("codigo") ?? "";
  const viaPlaca = !!chave && !!codigoDoLink;

  const [codigo, setCodigo] = useState(codigoDoLink);
  const [pin, setPin] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [linkAvaliacao, setLinkAvaliacao] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [concluido, setConcluido] = useState<{ codigo: string; senha: string } | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const link = linkAvaliacao.trim();
    if (!viaPlaca && (!codigo.trim() || !pin.trim())) {
      setErro("Preencha o código da placa e o PIN.");
      return;
    }
    if (!nomeEmpresa.trim() || !link) {
      setErro("Preencha o nome da empresa e o link de avaliação.");
      return;
    }
    if (!link.startsWith("http")) {
      setErro("Cole o link completo (começando com https://).");
      return;
    }
    if (!/^\d{4}$/.test(senha)) {
      setErro("Crie uma senha com exatamente 4 números.");
      return;
    }
    if (senha !== senha2) {
      setErro("As duas senhas não são iguais. Digite de novo.");
      return;
    }

    setCarregando(true);
    try {
      const data = await callFunction<{ ok?: boolean; error?: string; codigo?: string }>(
        "registrar-placa",
        viaPlaca
          ? { chave, senha, nomeEmpresa: nomeEmpresa.trim(), reviewLink: link }
          : {
              codigo: codigo.trim(),
              pin: pin.trim(),
              senha,
              nomeEmpresa: nomeEmpresa.trim(),
              reviewLink: link,
            }
      );
      if (data.error) throw new Error(data.error);
      setConcluido({ codigo: data.codigo ?? codigo.trim().toUpperCase(), senha });
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível concluir o cadastro.");
    } finally {
      setCarregando(false);
    }
  }

  if (concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold">Sua placa está ativada! 🎉</h1>
          <p className="text-gray-600">{nomeEmpresa}</p>

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3 text-left">
            <p className="text-sm text-gray-600 text-center">
              Anote — você vai precisar para trocar o link ou ver as estatísticas:
            </p>
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs text-gray-400">Código da placa</div>
                <div className="font-mono text-lg font-semibold">{concluido.codigo}</div>
              </div>
              <CopiarBotao texto={concluido.codigo} rotulo="Copiar" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Sua senha</div>
              <div className="font-mono text-lg font-semibold tracking-widest">{concluido.senha}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/analise")}
              className="px-5 py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
            >
              Ver estatísticas da minha placa
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <MenuPlaca />

        <h1 className="text-xl font-semibold mb-1">
          {viaPlaca ? "Sua placa ainda não foi ativada" : "Ativar placa DDS Avaliações"}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Leva 2 minutos. Sem criar conta.
        </p>

        {viaPlaca && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 mb-4">
            <div>
              <div className="text-xs text-gray-400">Código da placa</div>
              <div className="font-mono font-semibold">{codigoDoLink.toUpperCase()}</div>
            </div>
            <CopiarBotao texto={codigoDoLink.toUpperCase()} rotulo="📋 Copiar" />
          </div>
        )}

        <form onSubmit={salvar} className="space-y-3">
          {!viaPlaca && (
            <>
              <Campo label="Código da placa" value={codigo} onChange={setCodigo} placeholder="Ex: DDS215" />
              <Campo
                label="PIN da placa"
                value={pin}
                onChange={setPin}
                placeholder="0000"
                ajuda="O PIN que veio com a placa."
              />
            </>
          )}

          <Campo
            label="Nome da empresa"
            value={nomeEmpresa}
            onChange={setNomeEmpresa}
            placeholder="Ex: Padaria do João"
          />

          <Campo
            label="1. Cole o link de avaliação do Google"
            value={linkAvaliacao}
            onChange={setLinkAvaliacao}
            placeholder="https://..."
            inputMode="url"
            ajuda="É o link para o cliente deixar a avaliação da sua empresa."
          />

          <details className="rounded-lg border border-gray-200 overflow-hidden">
            <summary className="cursor-pointer text-sm text-brand-700 px-3 py-2 bg-gray-50">
              Não tenho o link — gerar agora (grátis)
            </summary>
            <p className="text-xs text-gray-500 px-3 py-2 border-b border-gray-200">
              Gere o link da sua empresa aqui embaixo, copie e cole no campo acima.
            </p>
            <iframe
              src="https://productmate.com/google-review-link-generator"
              title="Gerador de link de avaliação do Google"
              className="w-full"
              style={{ height: 420, border: "none" }}
              allow="clipboard-write"
            />
          </details>

          <Campo
            label="2. Crie uma senha de 4 números"
            value={senha}
            onChange={(v) => setSenha(somente4Digitos(v))}
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
            ajuda="Escolha 4 números que você lembre. Serve para trocar o link e ver as estatísticas depois."
          />
          <Campo
            label="Digite a senha de novo para confirmar"
            value={senha2}
            onChange={(v) => setSenha2(somente4Digitos(v))}
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
          />
          {senha2.length === 4 && (
            <p className={`text-xs ${senha === senha2 ? "text-green-600" : "text-red-600"}`}>
              {senha === senha2 ? "✓ As senhas conferem" : "As senhas não são iguais"}
            </p>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <BotaoEnviar carregando={carregando}>⚡ Ativar minha placa</BotaoEnviar>
        </form>
      </div>
    </div>
  );
}
