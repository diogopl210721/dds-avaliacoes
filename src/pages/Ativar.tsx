import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, ExternalLink, PartyPopper, Search, Zap } from "lucide-react";
import { callFunction } from "../lib/supabaseClient";
import { AuthShell, MenuPlaca, Campo, BotaoEnviar, CodigoPlaca, Erro, TituloForm, somente4Digitos, EscolhaPedirDados } from "../components/PlacaUi";
import { linkDaPropriaPlaca, MSG_LINK_DA_PLACA } from "../lib/linkGuard";

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
  const [pedirDados, setPedirDados] = useState(true);

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
    if (linkDaPropriaPlaca(link)) {
      setErro(MSG_LINK_DA_PLACA);
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
          ? { chave, senha, nomeEmpresa: nomeEmpresa.trim(), reviewLink: link, pedirDados }
          : {
              codigo: codigo.trim(),
              pin: pin.trim(),
              senha,
              nomeEmpresa: nomeEmpresa.trim(),
              reviewLink: link,
              pedirDados,
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

  const moldura = {
    eyebrow: "Ativação da placa",
    title: <>Sua placa pronta em <span className="font-serif italic font-normal dds-spectrum-text">2 minutos.</span></>,
    text: "Sem criar conta. Informe o nome da empresa, cole o link de avaliação do Google e escolha uma senha de 4 números.",
    points: ["Funciona com QR Code e NFC", "Troque o link quando quiser, sem reimprimir", "Acompanhe os acessos no seu sistema"],
  };

  if (concluido) {
    return (
      <AuthShell {...moldura}>
        <div className="text-center dds-rise">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_16px_32px_-12px_#059669]"><PartyPopper size={30} /></span>
          <h1 className="mt-5 font-display text-2xl font-extrabold tracking-[-.03em]">Sua placa está ativada!</h1>
          <p className="mt-1 text-ink-muted">{nomeEmpresa}</p>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm text-ink-soft text-center">Anote: você vai precisar para trocar o link ou ver as estatísticas.</p>
          <CodigoPlaca codigo={concluido.codigo} grande />
          <div className="rounded-2xl border border-[#dbe5f4] bg-[#f7faff] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink-muted">Sua senha</div>
            <div className="font-mono text-2xl font-bold tracking-[.4em]">{concluido.senha}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button onClick={() => navigate("/sistema")} className="dds-btn dds-btn-primary dds-btn-lg dds-btn-block">
            Acesse meu sistema <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate("/")} className="dds-btn dds-btn-outline dds-btn-block">Voltar ao início</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell {...moldura}>
      <MenuPlaca />

      <TituloForm
        icon={<Zap size={20} />}
        titulo={viaPlaca ? "Sua placa ainda não foi ativada" : "Ativar placa DDS Avaliações"}
        texto="Leva 2 minutos. Sem criar conta."
      />

      {viaPlaca && <div className="mb-5"><CodigoPlaca codigo={codigoDoLink.toUpperCase()} /></div>}

      <form onSubmit={salvar} className="space-y-4">
        {!viaPlaca && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo label="Código da placa" value={codigo} onChange={setCodigo} placeholder="Ex: DDS215" />
            <Campo
              label="PIN da placa"
              value={pin}
              onChange={setPin}
              placeholder="0000"
              ajuda="O PIN que veio com a placa."
            />
          </div>
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

        <div className="rounded-2xl border border-dashed border-[#c9d8ef] bg-[#f7faff] p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Search size={16} className="text-brand-600" /> Não tenho o link: procurar empresa aqui</p>
          <a href="https://www.replifast.com/google-review-link-generator" target="_blank" rel="noopener noreferrer" className="dds-btn dds-btn-outline dds-btn-block">Procurar empresa no RepliFast <ExternalLink size={16} /></a>
          <p className="text-xs text-ink-muted leading-relaxed">O gerador abre em outra aba. Procure sua empresa, copie o link de avaliação e volte para colar no campo acima.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Campo
            label="2. Crie uma senha de 4 números"
            value={senha}
            onChange={(v) => setSenha(somente4Digitos(v))}
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
          />
          <Campo
            label="Digite a senha de novo para confirmar"
            value={senha2}
            onChange={(v) => setSenha2(somente4Digitos(v))}
            placeholder="0000"
            inputMode="numeric"
            maxLength={4}
          />
        </div>
        <p className="dds-help !mt-2">Escolha 4 números que você lembre. Serve para trocar o link e ver as estatísticas depois.</p>
        {senha2.length === 4 && (
          <p className={`text-sm font-semibold ${senha === senha2 ? "text-emerald-600" : "text-rose-600"}`}>
            {senha === senha2 ? "✓ As senhas conferem" : "As senhas não são iguais"}
          </p>
        )}

        <EscolhaPedirDados valor={pedirDados} onChange={setPedirDados} titulo="3. Antes da avaliação, pedir o telefone e o aniversário do cliente?" />

        {erro && <Erro>{erro}</Erro>}
        <BotaoEnviar carregando={carregando}><Zap size={18} /> Ativar minha placa</BotaoEnviar>
      </form>
    </AuthShell>
  );
}
