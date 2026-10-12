import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Link2 } from "lucide-react";
import { callFunction } from "../lib/supabaseClient";
import { AuthShell, MenuPlaca, Campo, BotaoEnviar, Erro, TituloForm, somente4Digitos } from "../components/PlacaUi";

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
    <AuthShell
      eyebrow="Trocar link"
      title={<>Mude o destino. <span className="font-serif italic font-normal dds-spectrum-text">A placa continua a mesma.</span></>}
      text="Use quando quiser que a placa leve para outro endereço. Nada precisa ser reimpresso."
      points={["Vale na hora para o QR Code e o NFC", "A imagem do QR Code não muda", "Só com o código e a sua senha"]}
    >
      <MenuPlaca />

      {ok ? (
        <div className="text-center py-4 dds-rise">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_16px_32px_-12px_#059669]"><CheckCircle2 size={30} /></span>
          <h1 className="mt-5 font-display text-2xl font-extrabold tracking-[-.03em]">Link trocado!</h1>
          <p className="mt-1 text-sm text-ink-muted">A placa já está levando as pessoas para o novo link.</p>
          <Link to="/" className="dds-btn dds-btn-outline mt-6">Voltar ao início</Link>
        </div>
      ) : (
        <>
          <TituloForm icon={<Link2 size={20} />} titulo="Trocar o link da placa" texto="Use quando quiser que a placa leve para outro endereço." />
          <form onSubmit={salvar} className="space-y-4">
            <div>
              <Campo
                label="Código da placa"
                value={codigo}
                onChange={setCodigo}
                placeholder="Ex: DDS215"
                ajuda="Está impresso na placa."
              />
              <Link to="/recuperar" className="mt-1.5 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700">
                Esqueceu o código? Clique para recuperar
              </Link>
            </div>
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
            {erro && <Erro>{erro}</Erro>}
            <BotaoEnviar carregando={carregando}>Salvar novo link</BotaoEnviar>
          </form>
        </>
      )}
    </AuthShell>
  );
}
