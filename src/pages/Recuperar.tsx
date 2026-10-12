import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, SearchCheck } from "lucide-react";
import { callFunction } from "../lib/supabaseClient";
import { AuthShell, MenuPlaca, Campo, BotaoEnviar, CodigoPlaca, Erro, TituloForm, somente4Digitos } from "../components/PlacaUi";

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
    <AuthShell
      eyebrow="Recuperar código"
      title={<>Esqueceu o código? <span className="font-serif italic font-normal dds-spectrum-text">A gente encontra.</span></>}
      text="Informe o link que a placa abre hoje e a senha de 4 números que você criou na ativação."
      points={["Sem precisar falar com ninguém", "Depois é só trocar o link, se quiser"]}
    >
      <MenuPlaca />

      {codigo ? (
        <div className="py-2 dds-rise">
          <div className="text-center">
            <span className="mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-[0_16px_32px_-12px_#1a6fe0]"><SearchCheck size={30} /></span>
            <h1 className="mt-5 font-display text-2xl font-extrabold tracking-[-.03em]">Encontramos sua placa</h1>
          </div>
          <div className="mt-6"><CodigoPlaca codigo={codigo} grande /></div>
          <Link to={`/editar?codigo=${encodeURIComponent(codigo)}`} className="dds-btn dds-btn-primary dds-btn-lg dds-btn-block mt-5">
            Trocar o link agora <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <TituloForm icon={<KeyRound size={20} />} titulo="Recuperar código da placa" texto="Perdeu o código? Informe o link que a placa abre hoje e a sua senha de 4 números." />
          <form onSubmit={buscar} className="space-y-4">
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
            {erro && <Erro>{erro}</Erro>}
            <BotaoEnviar carregando={carregando}>Localizar código da placa</BotaoEnviar>
          </form>
        </>
      )}
    </AuthShell>
  );
}
