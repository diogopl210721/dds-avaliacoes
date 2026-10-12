import { useRef, useState } from 'react';
import { ArrowUpRight, Check, RefreshCcw, Sparkles, Wand2 } from 'lucide-react';
import { callFunction } from '../lib/supabaseClient';
import type { MiniContent, MiniTheme } from '../lib/miniPage';
import { GooglePlace, SEGMENTS, SegmentId, detectSegment, generateTexts, googleData, infoFrom, instagramHandle } from '../lib/miniAutofill';
import type { PlateMiniAccess } from './PlateMiniOffer';
import { Field } from './StudioFields';

// Cartão "Preencher automaticamente" do passo Conteúdo: puxa os dados do Google e escreve os
// textos do segmento. Nunca apaga o que a pessoa já escreveu: só preenche campos vazios ou
// campos que ele mesmo preencheu antes (e que ninguém editou depois).

const THEME_SEGMENT: Partial<Record<MiniTheme, SegmentId>> = { brasa: 'gastronomia', aura: 'beleza', navalha: 'barbearia', vital: 'saude', impulso: 'fitness', refugio: 'hospedagem' };
type Candidate = { id: string; name: string; address: string };
type Lookup = { place?: GooglePlace; candidates?: Candidate[]; error?: string };
const sig = (v: unknown) => JSON.stringify(Array.isArray(v) ? v.map(x => (x && typeof x === 'object' ? { ...x, id: undefined } : x)) : v);
const isEmpty = (v: unknown) => v === '' || v == null || (Array.isArray(v) && v.length === 0);

export default function StudioAutofill({ content, onChange, onName, notify, plateAccess, demo }: {
  content: MiniContent; onChange: (next: MiniContent) => void; onName: (name: string) => void; notify: (msg: string) => void;
  plateAccess?: PlateMiniAccess; demo: boolean;
}) {
  const [query, setQuery] = useState('');
  const [insta, setInsta] = useState('');
  const [segment, setSegment] = useState<SegmentId>(THEME_SEGMENT[content.theme] ?? 'servicos');
  const [place, setPlace] = useState<GooglePlace | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [variant, setVariant] = useState(0);
  const lastGen = useRef<Record<string, string>>({});

  // Aplica um pacote de campos respeitando o que a pessoa já escreveu.
  function merge(base: MiniContent, patch: Partial<MiniContent>, always: (keyof MiniContent)[] = []) {
    const next = { ...base } as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const cur = next[key];
      const untouched = lastGen.current[key] !== undefined && lastGen.current[key] === sig(cur);
      if (always.includes(key as keyof MiniContent) || isEmpty(cur) || untouched) { next[key] = value; lastGen.current[key] = sig(value); }
    }
    return next as MiniContent;
  }

  function fill(p: GooglePlace | null, seg: SegmentId, v: number, base = content) {
    let next = base;
    if (p) next = merge(next, googleData(p), ['name', 'address', 'maps', 'review']);
    const handle = instagramHandle(insta);
    if (handle) next = { ...next, instagram: handle };
    next = merge(next, generateTexts(seg, infoFrom(next, p), v));
    onChange(next);
    if (p?.name) onName(p.name);
  }

  async function lookup(placeId?: string): Promise<Lookup> {
    if (plateAccess) return callFunction<Lookup>('plate-mini', { action: 'google', codigo: plateAccess.codigo, senha: plateAccess.senha, query: query.trim(), placeId });
    // Painel do administrador sem placa: busca simples (nome, endereço e links do Google).
    if (!placeId) {
      const data = await callFunction<{ places?: any[] }>('search-company', { action: 'search', query: query.trim() });
      const list = (data.places ?? []).slice(0, 5).map(p => ({ id: p.id, name: p.displayName?.text ?? '', address: p.formattedAddress ?? '' }));
      if (list.length === 1) return lookup(list[0].id);
      return list.length ? { candidates: list } : { error: 'Nenhuma empresa encontrada. Tente nome e cidade.' };
    }
    const p = await callFunction<any>('search-company', { action: 'select', placeId });
    return { place: { placeId, name: p.nome ?? '', address: p.endereco ?? '', phone: '', website: '', hours: [], primaryType: '', types: [], category: '', rating: p.rating ?? null, ratingCount: p.review_count ?? null, reviews: [], summary: '', mapsUri: p.google_maps_uri ?? '', reviewUri: p.write_a_review_uri ?? '' } };
  }

  function applyResult(r: Lookup) {
    if (r.error) { fallback(r.error); return; }
    if (r.candidates?.length) { setCandidates(r.candidates); return; }
    if (!r.place) return;
    const seg = r.place.types.length ? detectSegment([r.place.primaryType, ...r.place.types]) : segment;
    setPlace(r.place); setCandidates([]); setSegment(seg); setVariant(0);
    fill(r.place, seg, 0);
    const extra = r.place.phone ? ' Confira se o telefone do Google é o WhatsApp.' : ' Informe o WhatsApp.';
    notify(`Pronto! Dados de ${r.place.name} preenchidos.${extra} Revise os textos antes de publicar.`);
  }

  async function run(placeId?: string) {
    setError('');
    if (!placeId && !query.trim()) { setCandidates([]); fill(place, segment, variant); notify('Textos preenchidos. Revise e ajuste o que quiser.'); return; }
    if (demo) { fill(null, segment, variant); notify('Na demonstração a busca no Google fica desligada. Os textos prontos foram aplicados.'); return; }
    setBusy(true);
    try { applyResult(await lookup(placeId)); }
    catch (e: any) { fallback(e.message || 'A busca no Google não respondeu agora.'); }
    finally { setBusy(false); }
  }

  // Sem os dados do Google, os textos prontos entram mesmo assim: ninguém fica parado esperando.
  function fallback(message: string) {
    fill(place, segment, variant);
    setError(`${message.replace(/\s*Tente de novo ou preencha manualmente\.?$/, '')} Os textos prontos foram aplicados; complete telefone, endereço e horários.`);
    notify('Textos prontos aplicados. Revise e complete os dados de contato.');
  }

  function another() { const v = variant + 1; setVariant(v); fill(place, segment, v); notify('Nova versão dos textos aplicada.'); }
  function changeSegment(seg: SegmentId) { setSegment(seg); if (Object.keys(lastGen.current).length) fill(place, seg, variant); }

  const generated = Object.keys(lastGen.current).length > 0;
  return <div className="sf-autofill">
    <div className="sf-autofill-head">
      <span className="sf-autofill-icon"><Wand2 size={20} /></span>
      <div><strong>Preencher automaticamente</strong><p>Cole o link da empresa no Google Maps ou digite o nome e a cidade. Puxamos telefone, endereço, horários e avaliações e escrevemos os textos. Depois é só revisar.</p></div>
    </div>
    <label className="sf-field">Link do Google ou nome e cidade
      <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); run(); } }} placeholder="https://maps.app.goo.gl/…  ou  Padaria Aurora, Campo Largo" autoComplete="off" />
    </label>
    <div className="sf-grid">
      <label className="sf-field">Segmento<select value={segment} onChange={e => changeSegment(e.target.value as SegmentId)}>{SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <Field label="Instagram (opcional)" value={insta} onChange={setInsta} placeholder="@empresa ou link do perfil" max={200} />
    </div>
    {candidates.length > 0 && <div className="sf-autofill-pick"><p>Qual destas é a empresa?</p>{candidates.map(p => <button className="studio-search-result" key={p.id} onClick={() => run(p.id)} disabled={busy}><strong>{p.name}</strong><span>{p.address}</span><ArrowUpRight size={17} /></button>)}</div>}
    {error && <p className="sf-autofill-error" role="alert">{error}</p>}
    {place && <p className="sf-autofill-done"><Check size={15} /> Dados do Google: {place.name}{place.rating != null ? ` · ${place.rating.toFixed(1).replace('.', ',')} ★ (${place.ratingCount ?? 0})` : ''}</p>}
    <div className="studio-actions">
      <button className="studio-primary" onClick={() => run()} disabled={busy}><Sparkles size={17} />{busy ? 'Buscando no Google…' : query.trim() ? 'Buscar e preencher tudo' : 'Preencher os textos'}</button>
      {generated && <button className="studio-secondary" onClick={another} disabled={busy}><RefreshCcw size={16} /> Gerar outra versão</button>}
    </div>
    <small className="sf-autofill-note">Só preenchemos campos vazios ou que ainda não foram editados. Fotos, produtos e preços ficam com você.</small>
  </div>;
}
