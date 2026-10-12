import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, RefreshCcw, Sparkles } from "lucide-react";
import { callFunction } from "../lib/supabaseClient";
import { MiniContent, MiniRecord, demoFor, themeOptions } from "../lib/miniPage";
import { MiniPreviewModal, ThemePhone } from "./MiniThemes";
import { Aurora, Spinner } from "./ui/Fx";
import "../mini.css";

export type PlateMiniAccess = {
  codigo: string; senha: string; page: MiniRecord | null;
  company: { nome?: string; write_a_review_uri?: string } | null;
};
export default function PlateMiniOffer({ codigo, senha, onOpen }: {
  codigo: string; senha: string; onOpen: (access: PlateMiniAccess) => void;
}) {
  const [show, setShow] = useState(false);
  const [preview, setPreview] = useState<MiniContent | null>(null);
  const [access, setAccess] = useState<PlateMiniAccess | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
            {busy ? <><Spinner /> Consultando liberação…</> : enabled ? access?.page ? <>Editar meu mini site <ArrowRight size={18} /></> : <>Criar meu mini site <ArrowRight size={18} /></> : <>Criar meu mini site · ver 9 modelos</>}
          </button>
          {!enabled && <button onClick={check} disabled={busy} className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#8fd8ff] hover:text-white disabled:opacity-50"><RefreshCcw size={14} /> Já paguei · verificar liberação</button>}
        </div>
      </div>
      {error && <p className="mt-4 dds-error" role="alert">{error}</p>}
    </div>
    {show && <div className="p-5 sm:p-6 space-y-4 dds-fade">
      <p className="text-sm text-ink-soft leading-relaxed">Seis modelos feitos para segmentos e três para qualquer negócio, cada um com 4 combinações de cores ou a cor da sua marca. Toque em um para ver a página completa. A sua terá as informações e fotos da sua empresa.</p>
      <div className="theme-showcase">
        {themeOptions.map((t, i) => <button key={t.id} className="theme-card" onClick={() => setPreview(demoFor(t.id))}>
          <ThemePhone content={demoFor(t.id)} theme={t.id} index={i} />
          <span className="theme-card-text"><small>{t.niche}</small><strong>{t.name}</strong><span>{t.description}</span><em>Ver modelo completo</em></span>
        </button>)}
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-[#eef6ff] to-[#f3f0ff] border border-[#d9e6fb] p-4 text-sm text-ink-soft space-y-2">
        <strong className="block font-display text-ink">Gostou? Sua empresa pode ter uma página assim.</strong>
        <p>Combine a contratação com quem forneceu sua plaquinha. Após a confirmação do pagamento, o administrador libera a criação aqui no seu sistema.</p>
        <p>As funções da sua placa continuam disponíveis enquanto você decide.</p>
      </div>
    </div>}
    {preview && <MiniPreviewModal content={preview} demo label="Exemplo de mini site" onClose={() => setPreview(null)} onTheme={theme => setPreview({ ...demoFor(theme), palette: preview.palette === "brand" ? "p1" : preview.palette })} onPalette={palette => setPreview({ ...preview, palette })} />}
  </section>;
}
