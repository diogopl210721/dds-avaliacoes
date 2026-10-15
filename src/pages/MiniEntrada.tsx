import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, KeyRound, LayoutTemplate, LogOut, MessageCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { callFunction } from "../lib/supabaseClient";
import { MiniRecord } from "../lib/miniPage";
import { PlateMiniAccess, isSiteAccess } from "../components/PlateMiniOffer";
import { AuthShell, BotaoEnviar, CodigoPlaca, Erro, TituloForm, somente4Digitos } from "../components/PlacaUi";
import { ScreenLoading } from "../components/ui/Screen";
import BuildDemo from "../components/BuildDemo";
import "../mini.css";

// Entrada do estúdio do mini site (#/minisite, link curto www.ddsinovacao.com.br/meusite).
//  - ?ativar=<chave>: o cliente de mini site (SITE101…) abriu o link que recebeu no WhatsApp e cria a senha.
//  - Código + senha: SITE101 ou o código da plaquinha. Os dois caem no mesmo estúdio.
//  - Com login de e-mail (o admin), abre o estúdio da conta, como antes.
// A plaquinha continua com o sistema completo em #/sistema.
const MiniStudio = lazy(() => import("./MiniStudio"));
const WHATS = "5541991542931";
const GUARDA = "dds-mini-acesso";

type Liberacao = { enabled: boolean; page: MiniRecord | null; company: PlateMiniAccess["company"] };

function lerSessao(): { codigo: string; senha: string } | null {
  try { const v = JSON.parse(sessionStorage.getItem(GUARDA) || "null"); return v?.codigo && v?.senha ? v : null; } catch { return null; }
}
function gravarSessao(v: { codigo: string; senha: string } | null) {
  try { if (v) sessionStorage.setItem(GUARDA, JSON.stringify(v)); else sessionStorage.removeItem(GUARDA); } catch { /* sem armazenamento */ }
}

export default function MiniEntrada() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const chave = params.get("ativar");
  const [acesso, setAcesso] = useState<PlateMiniAccess | null>(null);
  const [bloqueado, setBloqueado] = useState<{ codigo: string; empresa: string } | null>(null);
  const [retomando, setRetomando] = useState(() => !chave && !!lerSessao());

  async function entrar(codigo: string, senha: string) {
    const data = await callFunction<Liberacao>("plate-mini", { action: "get", codigo, senha });
    gravarSessao({ codigo, senha });
    if (!data.enabled) { setBloqueado({ codigo, empresa: data.company?.nome ?? "" }); return; }
    setAcesso({ codigo, senha, page: data.page, company: data.company });
  }
  function sair() { gravarSessao(null); setAcesso(null); setBloqueado(null); }

  // Senha criada pelo link: tira o ?ativar do endereço (recarregar não volta para o link já usado).
  const [ativou, setAtivou] = useState(false);
  useEffect(() => { if (chave && ativou) { setAtivou(false); navigate("/minisite", { replace: true }); } }, [chave, ativou]);

  // Recarregou a página no meio da edição: entra de novo com o acesso desta aba.
  useEffect(() => {
    const s = retomando ? lerSessao() : null;
    if (!s) return;
    entrar(s.codigo, s.senha).catch(() => gravarSessao(null)).finally(() => setRetomando(false));
  }, []);

  if (acesso) return <>
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 bg-navy-950 text-white border-b border-white/10">
      <span className="min-w-0 truncate text-xs sm:text-sm text-[#a7b7d1]"><strong className="text-white font-semibold">{acesso.company?.nome || "Meu mini site"}</strong> · {isSiteAccess(acesso.codigo) ? "acesso" : "placa"} {acesso.codigo}</span>
      <button className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8fd8ff] hover:text-white" onClick={sair}><LogOut size={16} /> Sair</button>
    </div>
    <Suspense fallback={<ScreenLoading light label="Abrindo o estúdio…" />}><MiniStudio plateAccess={acesso} /></Suspense>
  </>;

  if (chave) return <Ativacao chave={chave} onEntrar={async (c, s) => { await entrar(c, s); setAtivou(true); }} onLogin={() => navigate("/minisite", { replace: true })} />;
  if (loading || retomando) return <ScreenLoading />;
  if (user) return <Suspense fallback={<ScreenLoading light label="Abrindo o estúdio…" />}><MiniStudio /></Suspense>;
  if (bloqueado) return <Moldura><AguardandoLiberacao {...bloqueado} onSair={sair} /></Moldura>;
  return <Moldura><Login onEntrar={entrar} /></Moldura>;
}

function Moldura({ children }: { children: React.ReactNode }) {
  return <AuthShell
    eyebrow="Mini site"
    title={<>O seu site, <span className="font-serif italic font-normal dds-spectrum-text">do seu jeito.</span></>}
    text="Entre para montar, mudar e publicar o seu mini site quantas vezes quiser."
    points={["Mude fotos, preços e textos quando quiser", "Veja como fica na hora, antes de publicar", "Seu site em www.ddsinovacao.com.br/suaempresa"]}
    art={<div className="mt-10 w-[250px] dds-rise" style={{ ["--d" as string]: ".24s" }}><BuildDemo /></div>}
    back={{ to: "/exemplos", label: "Ver os modelos" }}
  >{children}</AuthShell>;
}

function Login({ onEntrar }: { onEntrar: (codigo: string, senha: string) => Promise<void> }) {
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  async function enviar(e: FormEvent) {
    e.preventDefault(); setErro("");
    const c = codigo.trim().toUpperCase().replace(/\s+/g, "");
    if (!c) return setErro("Informe o seu código.");
    if (!/^\d{4}$/.test(senha)) return setErro("A senha tem 4 números.");
    setCarregando(true);
    try { await onEntrar(c, senha); }
    catch (err: any) { setErro(err?.message || "Não foi possível entrar. Tente de novo."); }
    finally { setCarregando(false); }
  }
  const esqueci = `https://wa.me/${WHATS}?text=${encodeURIComponent(`Olá! Esqueci a senha do meu mini site${codigo.trim() ? ` (código ${codigo.trim().toUpperCase()})` : ""}. Pode me mandar um novo link?`)}`;
  return <>
    <TituloForm icon={<LayoutTemplate size={20} />} titulo="Entrar no meu mini site" texto="Use o código que você recebeu (ex.: SITE101) ou o código da sua plaquinha, e a sua senha de 4 números." />
    <form onSubmit={enviar} className="space-y-4">
      <label className="block">
        <span className="dds-label">Código</span>
        <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Ex: SITE101 ou DDS215" autoComplete="username" autoCapitalize="characters" spellCheck={false} className="dds-input font-semibold uppercase placeholder:normal-case placeholder:font-normal" />
      </label>
      <label className="block">
        <span className="dds-label">Senha (4 números)</span>
        <input type="password" inputMode="numeric" maxLength={4} autoComplete="current-password" value={senha} onChange={e => setSenha(somente4Digitos(e.target.value))} placeholder="0000" className="dds-input tracking-[.4em] font-semibold" />
      </label>
      {erro && <Erro>{erro}</Erro>}
      <BotaoEnviar carregando={carregando}>Entrar <ArrowRight size={18} /></BotaoEnviar>
    </form>
    <div className="mt-5 space-y-2.5 text-[13.5px] leading-relaxed text-ink-muted">
      <p><strong className="text-ink">Ainda não criou sua senha?</strong> Abra o link que você recebeu no WhatsApp.</p>
      <p><a href={esqueci} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline"><MessageCircle size={15} /> Esqueci a senha: pedir um novo link</a></p>
    </div>
    <div className="mt-6 pt-4 border-t border-[#e3e8f2] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px]">
      <Link to="/sistema" className="text-ink-muted hover:text-ink">Tem plaquinha? <span className="font-semibold text-brand-600">Sistema completo</span></Link>
      <Link to="/login?next=minisite" className="inline-flex items-center gap-1 text-ink-muted hover:text-ink"><ShieldCheck size={14} /> Sou administrador</Link>
    </div>
  </>;
}

function Ativacao({ chave, onEntrar, onLogin }: { chave: string; onEntrar: (codigo: string, senha: string) => Promise<void>; onLogin: () => void }) {
  const [info, setInfo] = useState<{ codigo: string; empresa: string } | null>(null);
  const [invalido, setInvalido] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    callFunction<{ codigo: string; empresa: string }>("site-access", { acao: "info", chave })
      .then(setInfo)
      .catch((e: any) => setInvalido(e?.message || "Este link não vale mais."));
  }, [chave]);

  async function enviar(e: FormEvent) {
    e.preventDefault(); setErro("");
    if (!/^\d{4}$/.test(senha)) return setErro("A senha deve ter 4 números.");
    if (senha !== senha2) return setErro("As duas senhas não são iguais.");
    if (/^(\d)\1{3}$/.test(senha) || senha === "1234") return setErro("Escolha uma senha menos óbvia que 0000 ou 1234.");
    setCarregando(true);
    try {
      const r = await callFunction<{ codigo: string }>("site-access", { acao: "ativar", chave, senha });
      await onEntrar(r.codigo, senha);
    } catch (err: any) { setErro(err?.message || "Não foi possível criar a senha. Tente de novo."); }
    finally { setCarregando(false); }
  }

  if (!info && !invalido) return <ScreenLoading label="Abrindo o seu acesso…" />;
  return <Moldura>
    {invalido ? <>
      <TituloForm icon={<KeyRound size={20} />} titulo="Este link já foi usado" texto={invalido} />
      <button type="button" onClick={onLogin} className="dds-btn dds-btn-primary dds-btn-lg dds-btn-block">Entrar com código e senha <ArrowRight size={18} /></button>
    </> : <>
      <TituloForm icon={<KeyRound size={20} />} titulo={<>Bem-vindo{info!.empresa ? <>, <span className="text-brand-600">{info!.empresa}</span></> : ""}!</>} texto="Crie a sua senha de 4 números. Com ela e o código abaixo, você entra no seu mini site sempre que quiser." />
      <CodigoPlaca codigo={info!.codigo} rotulo="Seu código de acesso" grande />
      <form onSubmit={enviar} className="mt-5 space-y-4">
        <label className="block">
          <span className="dds-label">Crie sua senha (4 números)</span>
          <input type="password" inputMode="numeric" maxLength={4} autoComplete="new-password" value={senha} onChange={e => setSenha(somente4Digitos(e.target.value))} placeholder="0000" className="dds-input tracking-[.4em] font-semibold" />
        </label>
        <label className="block">
          <span className="dds-label">Repita a senha</span>
          <input type="password" inputMode="numeric" maxLength={4} autoComplete="new-password" value={senha2} onChange={e => setSenha2(somente4Digitos(e.target.value))} placeholder="0000" className="dds-input tracking-[.4em] font-semibold" />
        </label>
        {senha2.length === 4 && <p className={`text-sm font-semibold ${senha === senha2 ? "text-emerald-600" : "text-rose-600"}`}>{senha === senha2 ? "As senhas conferem." : "As senhas não são iguais."}</p>}
        {erro && <Erro>{erro}</Erro>}
        <BotaoEnviar carregando={carregando}>Criar senha e entrar <ArrowRight size={18} /></BotaoEnviar>
      </form>
      <p className="mt-5 rounded-2xl bg-[#f3f7ff] border border-[#dbe5f4] px-4 py-3 text-[13.5px] leading-relaxed text-ink-muted">Guarde o código <strong className="text-ink">{info!.codigo}</strong> e a sua senha. Para entrar depois: <strong className="text-ink">www.ddsinovacao.com.br/meusite</strong></p>
    </>}
  </Moldura>;
}

function AguardandoLiberacao({ codigo, empresa, onSair }: { codigo: string; empresa: string; onSair: () => void }) {
  const msg = `Olá! ${empresa ? `Sou da ${empresa} ` : ""}(${isSiteAccess(codigo) ? "acesso" : "placa"} ${codigo}) e quero liberar o meu mini site.`;
  return <>
    <TituloForm icon={<LayoutTemplate size={20} />} titulo="Seu mini site ainda não foi liberado" texto={`${isSiteAccess(codigo) ? "O acesso" : "A placa"} ${codigo}${empresa ? ` (${empresa})` : ""} entrou, mas o mini site ainda não está liberado. Chame a DDS no WhatsApp para liberar.`} />
    <a className="dds-btn dds-btn-whats dds-btn-lg dds-btn-block" href={`https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /> Chamar no WhatsApp</a>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13.5px]">
      <Link to="/exemplos" className="font-semibold text-brand-600 hover:underline">Ver os modelos</Link>
      <button type="button" onClick={onSair} className="text-ink-muted hover:text-ink">Entrar com outro código</button>
    </div>
  </>;
}
