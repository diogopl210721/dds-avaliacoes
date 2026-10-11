import { useEffect, useState } from "react";
import { callFunction } from "../lib/supabaseClient";
import { MiniContent, MiniRecord, demoContent } from "../lib/miniPage";
import MiniLanding from "./MiniLanding";
import "../mini.css";

export type PlateMiniAccess = {
  codigo: string; senha: string; page: MiniRecord | null;
  company: { nome?: string; write_a_review_uri?: string } | null;
};
const examples = [
  { theme: "elegance", name: "Elegance", text: "Sofisticação para valorizar sua marca.", color: "#c9a969" },
  { theme: "viva", name: "Viva", text: "Um estilo acolhedor, cheio de personalidade.", color: "#ef7655" },
  { theme: "essencial", name: "Essencial", text: "Leve e direto, com sua empresa em destaque.", color: "#2460ad" },
] as const;
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
      {busy ? "Consultando liberação…" : enabled ? access?.page ? "Editar meu mini site" : "Criar meu mini site" : "Criar meu mini site · ver 3 exemplos"}
    </button>
    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    {show && <><p className="text-sm text-gray-600">Escolha um exemplo para explorar. Sua página terá as informações e fotos da sua empresa.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {examples.map(t => <button key={t.theme} className="text-left rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-700" onClick={() => setPreview({ ...demoContent, theme: t.theme })}>
          <div className={"studio-theme-thumb theme-" + t.theme}>
            <div className="studio-theme-photo" style={{ backgroundImage: 'url("' + demoContent.cover + '")' }} />
            <span className="studio-theme-monogram">A</span><strong>Aurora Café</strong>
            <small>Uma pausa especial no seu dia.</small><span className="studio-theme-cta" style={{ background: t.color }}>Conheça nossa empresa →</span>
          </div><div className="p-3"><strong>{t.name}</strong><p className="text-xs text-gray-600 mt-1">{t.text}</p><span className="text-xs text-emerald-700 block mt-2">Ver exemplo completo →</span></div>
        </button>)}
      </div>
      <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-950 space-y-2">
        <strong>Gostou? Sua empresa pode ter uma página assim.</strong>
        <p>Combine a contratação com quem forneceu sua plaquinha. Após a confirmação do pagamento, o administrador libera a criação aqui no seu sistema.</p>
        <p>As funções da sua placa continuam disponíveis enquanto você decide.</p>
      </div>
    </>}
    {!enabled && <button onClick={check} disabled={busy} className="text-sm text-emerald-700 underline">Já paguei · verificar liberação</button>}
    {preview && <div className="studio-preview-modal" role="dialog" aria-modal="true" aria-label="Exemplo de mini site">
      <button className="studio-modal-close" autoFocus onClick={() => setPreview(null)} onKeyDown={e => { if (e.key === "Escape") setPreview(null); }}>Fechar exemplo</button>
      <MiniLanding content={preview} demo />
    </div>}
  </section>;
}
