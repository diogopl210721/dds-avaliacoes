import { useEffect, useState } from "react";
import { callFunction } from "../lib/supabaseClient";
import { MiniContent, MiniRecord, demoFor, themeOptions } from "../lib/miniPage";
import { MiniPreviewModal, ThemePhone } from "./MiniThemes";
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
  return <section className="bg-white rounded-xl shadow p-5 space-y-4">
    <div><p className="text-xs font-semibold tracking-widest text-emerald-700">SEU NEGÓCIO PODE IR ALÉM</p>
      <h2 className="text-xl font-semibold mt-1">Sua empresa. Seu mini site.</h2>
      <p className="text-sm text-gray-600 mt-2">Fotos, produtos, WhatsApp e redes sociais em uma página pronta para compartilhar na bio e com seus clientes.</p></div>
    <button onClick={() => { if (enabled && access) onOpen(access); else setShow(!show); }}
      className="w-full rounded-lg bg-emerald-800 text-white px-4 py-3 font-medium" disabled={busy}>
      {busy ? "Consultando liberação…" : enabled ? access?.page ? "Editar meu mini site" : "Criar meu mini site" : "Criar meu mini site · ver 9 modelos"}
    </button>
    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    {show && <><p className="text-sm text-gray-600">Seis modelos feitos para segmentos e três para qualquer negócio, cada um com 4 combinações de cores ou a cor da sua marca. Toque em um para ver a página completa. A sua terá as informações e fotos da sua empresa.</p>
      <div className="theme-showcase">
        {themeOptions.map((t, i) => <button key={t.id} className="theme-card" onClick={() => setPreview(demoFor(t.id))}>
          <ThemePhone content={demoFor(t.id)} theme={t.id} index={i} />
          <span className="theme-card-text"><small>{t.niche}</small><strong>{t.name}</strong><span>{t.description}</span><em>Ver modelo completo</em></span>
        </button>)}
      </div>
      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-950 space-y-2">
        <strong>Gostou? Sua empresa pode ter uma página assim.</strong>
        <p>Combine a contratação com quem forneceu sua plaquinha. Após a confirmação do pagamento, o administrador libera a criação aqui no seu sistema.</p>
        <p>As funções da sua placa continuam disponíveis enquanto você decide.</p>
      </div>
    </>}
    {!enabled && <button onClick={check} disabled={busy} className="text-sm text-emerald-700 underline">Já paguei · verificar liberação</button>}
    {preview && <MiniPreviewModal content={preview} demo label="Exemplo de mini site" onClose={() => setPreview(null)} onTheme={theme => setPreview({ ...demoFor(theme), palette: preview.palette === "brand" ? "p1" : preview.palette })} onPalette={palette => setPreview({ ...preview, palette })} />}
  </section>;
}
