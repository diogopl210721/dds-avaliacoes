import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, MessageCircle, RefreshCcw, Sparkles } from "lucide-react";
import { callFunction } from "../lib/supabaseClient";
import { MINI_THEMES, MiniRecord } from "../lib/miniPage";
import { NICHES, NicheId, nicheById } from "../lib/miniNicheCore";
import { loadFonts } from "../lib/miniFonts";
import { GroupFilter, NicheCard, NicheChips, NicheViewer, nichesOf } from "./NicheShowcase";
import { Aurora, Spinner } from "./ui/Fx";
import "../mini.css";

export type PlateMiniAccess = {
  codigo: string; senha: string; page: MiniRecord | null;
  company: { nome?: string; write_a_review_uri?: string } | null;
};

const WHATS = "5541991542931";

// Oferta do mini site no painel do cliente. Enquanto não foi liberado, mostra os mesmos
// exemplos por ramo da vitrine (/exemplos), já com o nome da empresa da placa.
// Só os celulares que estão na tela ficam animando (ver NicheShowcase), senão o iPhone trava ao rolar.
export default function PlateMiniOffer({ codigo, senha, empresa, onOpen }: {
  codigo: string; senha: string; empresa?: string | null; onOpen: (access: PlateMiniAccess) => void;
}) {
  const [show, setShow] = useState(false);
  const [access, setAccess] = useState<PlateMiniAccess | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<GroupFilter>("todos");
  const name = (empresa || access?.company?.nome || "").trim().slice(0, 60);

  // O exemplo aberto fica no endereço (?exemplo=pizzaria): o botão "voltar" do celular fecha o
  // exemplo em vez de sair do painel.
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const opened = useRef(false);
  const fromUrl = nicheById(params.get("exemplo"))?.id ?? null;
  const open = opened.current ? fromUrl : null;
  useEffect(() => {
    if (!opened.current && params.has("exemplo")) {
      const next = new URLSearchParams(params); next.delete("exemplo"); setParams(next, { replace: true });
    }
  }, []);
  const list = useMemo(() => nichesOf(group).map(n => n.id), [group]);
  const viewerIds = open && !list.includes(open) ? nichesOf("todos").map(n => n.id) : list;
  function showNiche(id: NicheId) {
    const replace = !!open;
    opened.current = true;
    const next = new URLSearchParams(params); next.set("exemplo", id);
    setParams(next, { replace });
  }
  const close = () => navigate(-1);

  async function check() {
    setBusy(true); setError("");
    try {
      const data = await callFunction<{ enabled: boolean; page: MiniRecord | null; company: PlateMiniAccess["company"] }>("plate-mini", { action: "get", codigo, senha });
      setEnabled(data.enabled);
      setAccess({ codigo, senha, page: data.page, company: data.company });
    } catch (e: any) { setError(e.message || "Não foi possível consultar a liberação."); }
    finally { setBusy(false); }
  }
  useEffect(() => { check(); }, [codigo, senha]);
  useEffect(() => { if (show) loadFonts(MINI_THEMES); }, [show]);

  const wa = (id: NicheId) => {
    const n = nicheById(id)!;
    const msg = `Olá! ${name ? `Sou da ${name} (placa ${codigo})` : `Minha placa é a ${codigo}`}. Vi no meu painel o exemplo de mini site de ${n.label} e quero um assim.`;
    return `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
  };

  return <section className="dds-card overflow-hidden">
    <div className="dds-dark p-6 sm:p-8">
      <Aurora calm />
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <p className="dds-eyebrow"><Sparkles size={14} className="text-[#66e0ff]" />SEU NEGÓCIO PODE IR ALÉM</p>
          <h2 className="mt-4 font-display text-[clamp(26px,3.6vw,38px)] font-extrabold tracking-[-.04em] leading-[1.05] text-white">Sua empresa. <span className="font-serif italic font-normal dds-spectrum-text">Seu mini site.</span></h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#a7b7d1] max-w-xl">Fotos, produtos, WhatsApp e redes sociais em uma página pronta para compartilhar na bio e com seus clientes.</p>
          {enabled && <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300"><BadgeCheck size={16} /> Liberado para a sua placa</p>}
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <button onClick={() => { if (enabled && access) onOpen(access); else setShow(!show); }}
            className="dds-btn dds-btn-glow dds-btn-lg w-full md:w-auto" disabled={busy}>
            {busy ? <><Spinner /> Consultando liberação…</> : enabled ? access?.page ? <>Editar meu mini site <ArrowRight size={18} /></> : <>Criar meu mini site <ArrowRight size={18} /></> : <>Criar meu mini site · ver exemplos</>}
          </button>
          {!enabled && <button onClick={check} disabled={busy} className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#8fd8ff] hover:text-white disabled:opacity-50"><RefreshCcw size={14} /> Já paguei · verificar liberação</button>}
        </div>
      </div>
      {error && <p className="mt-4 dds-error" role="alert">{error}</p>}
    </div>
    {show && <div className="nc-light p-5 sm:p-6 space-y-4 dds-fade">
      <div>
        <p className="font-display text-lg font-extrabold tracking-[-.02em] text-ink">Exemplos para {NICHES.length} ramos{name ? <>, com o nome da <span className="text-brand-600">{name}</span></> : null}</p>
        <p className="mt-1 text-sm text-ink-soft leading-relaxed">Cada ramo tem cores, fotos e um efeito animado próprio. Toque em um para ver a página inteira e use as setas para passar para o próximo. O seu terá as fotos e as informações da sua empresa.</p>
      </div>
      <div>
        <NicheChips value={group} onChange={setGroup} />
        <div className="nc-grid">
          {list.map((id, i) => <NicheCard key={id} id={id} name={name} index={i} paused={!!open} onOpen={showNiche} />)}
        </div>
        <p className="mt-3 text-xs text-ink-muted">Empresas, depoimentos e números dos exemplos são fictícios. Fotos ilustrativas.</p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-[#eef6ff] to-[#f3f0ff] border border-[#d9e6fb] p-4 text-sm text-ink-soft space-y-2">
        <strong className="block font-display text-ink">Gostou? Sua empresa pode ter uma página assim.</strong>
        <p>Combine a contratação com quem forneceu sua plaquinha. Após a confirmação do pagamento, o administrador libera a criação aqui no seu sistema.</p>
        <p>As funções da sua placa continuam disponíveis enquanto você decide.</p>
      </div>
    </div>}
    {open && <NicheViewer id={open} ids={viewerIds} name={name} onClose={close} onNav={showNiche}
      actions={<a className="nv-cta is-whats" href={wa(open)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Quero este <ArrowRight size={15} className="nv-cta-arrow" /></a>} />}
  </section>;
}
