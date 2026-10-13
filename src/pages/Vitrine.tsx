import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, MessageCircle, PenLine, Share2, Sparkles, X } from 'lucide-react';
import { Aurora, BrandMark } from '../components/ui/Fx';
import { NicheCard, NicheChips, NicheViewer, GroupFilter, nichesOf } from '../components/NicheShowcase';
import { NicheId, nicheById } from '../lib/miniNicheCore';
import { loadFonts } from '../lib/miniFonts';
import '../mini.css';

// Vitrine de mini sites por ramo (/exemplos). Feita para mostrar na visita ao cliente:
// digita o nome da empresa dele, toca no ramo e a página inteira abre com o nome dele.
// /exemplos/<ramo>?nome=... abre direto o exemplo (link para mandar depois da visita).

const WHATS = '5541991542931';
const wa = (msg: string) => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;

export default function Vitrine() {
  const { niche } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const name = (params.get('nome') ?? '').slice(0, 60);
  const [draft, setDraft] = useState(name);
  const [group, setGroup] = useState<GroupFilter>('todos');
  const [copied, setCopied] = useState(false);
  const open = nicheById(niche)?.id ?? null;
  const list = useMemo(() => nichesOf(group).map(n => n.id), [group]);
  const viewerIds = open && !list.includes(open) ? nichesOf('todos').map(n => n.id) : list;
  const typing = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { document.title = 'Vitrine de mini sites · DDS Inovação'; loadFonts(['brasa', 'aura', 'navalha', 'vital', 'impulso', 'refugio', 'elegance', 'viva', 'essencial']); }, []);
  useEffect(() => { setDraft(name); }, [name]);

  const query = name ? `?nome=${encodeURIComponent(name)}` : '';
  function setName(value: string) {
    setDraft(value);
    clearTimeout(typing.current);
    typing.current = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set('nome', value.trim()); else next.delete('nome');
      setParams(next, { replace: true });
    }, 350);
  }
  const show = (id: NicheId) => navigate(`/exemplos/${id}${query}`, { replace: !!open });
  const close = () => navigate(`/exemplos${query}`, { replace: true });

  async function share(id: NicheId) {
    const n = nicheById(id)!;
    const url = new URL(`#/exemplos/${id}${query}`, new URL(import.meta.env.BASE_URL, document.baseURI)).href;
    const text = `Veja como fica o mini site de ${n.short.toLowerCase()}${name ? ` da ${name}` : ''}:`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Exemplo de mini site', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true); setTimeout(() => setCopied(false), 2200);
    } catch { /* compartilhamento cancelado */ }
  }

  return <div className="dds-dark min-h-[100dvh] overflow-x-clip vt">
    <Aurora calm />
    <header className="sticky top-0 z-30 border-b border-white/[.06] bg-navy-950/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <BrandMark />
        <a className="dds-btn dds-btn-whats dds-btn-sm sm:px-4" href={wa(`Olá! Vi a vitrine de mini sites da DDS e quero o meu${name ? ` para a ${name}` : ''}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> Quero o meu</a>
      </div>
    </header>

    <main className="max-w-6xl mx-auto px-4 sm:px-6">
      <section className="pt-10 sm:pt-14 pb-6 sm:pb-8">
        <span className="dds-eyebrow"><Sparkles size={14} className="text-[#66e0ff]" />Vitrine de mini sites · 20 ramos</span>
        <h1 className="mt-5 font-display font-extrabold text-[clamp(34px,6.4vw,64px)] leading-[1.02] tracking-[-.045em] text-white max-w-3xl">
          Veja o site do <span className="font-serif italic font-normal dds-spectrum-text">seu negócio</span> antes de fechar.
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] sm:text-lg leading-relaxed text-[#a7b7d1]">Cada ramo tem cores, fotos e um efeito animado próprio. Toque em um exemplo para abrir a página inteira e mexa na capa: o efeito reage ao toque.</p>
        <label className="vt-name mt-7">
          <PenLine size={18} aria-hidden="true" />
          <span className="sr-only">Nome da empresa do cliente</span>
          <input value={draft} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Digite o nome da empresa do cliente" autoComplete="off" enterKeyHint="done" />
          {draft && <button type="button" onClick={() => setName('')} aria-label="Apagar o nome"><X size={17} /></button>}
        </label>
        <p className="mt-2 text-[13px] text-[#7f93b5]">{name ? <>Todos os exemplos estão mostrando <strong className="text-white font-semibold">{name}</strong>.</> : 'O nome aparece em todos os exemplos na hora.'}</p>
      </section>

      <div className="vt-filter sticky top-16 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3"><NicheChips value={group} onChange={setGroup} /></div>

      <section className="nc-grid pt-4 pb-16" aria-label="Exemplos por ramo">
        {list.map((id, i) => <NicheCard key={id} id={id} name={name} index={i} onOpen={show} />)}
      </section>

      <section className="pb-20">
        <div className="dds-spectrum-border rounded-[28px]">
          <div className="rounded-[28px] bg-gradient-to-br from-[#10244f] via-navy-900 to-navy-950 p-7 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
            <div>
              <h2 className="font-display text-[clamp(24px,3.6vw,36px)] font-extrabold leading-[1.08] tracking-[-.04em] text-white">Gostou de algum? <span className="font-serif italic font-normal text-brand-300">A gente monta o seu.</span></h2>
              <p className="mt-2 text-[15px] text-[#a7b7d1] max-w-xl">Com as suas fotos, os seus serviços e o seu WhatsApp. Pronto para a bio do Instagram, o Google e a plaquinha NFC.</p>
            </div>
            <a className="dds-btn dds-btn-whats dds-btn-lg shrink-0" href={wa(`Olá! Vi a vitrine de mini sites da DDS e quero o meu${name ? ` para a ${name}` : ''}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /> Quero o meu mini site</a>
          </div>
        </div>
        <p className="mt-6 text-center text-[13px] text-[#7f93b5]">Empresas, depoimentos e números dos exemplos são fictícios. Fotos ilustrativas do Unsplash. <Link to="/" className="underline underline-offset-4 hover:text-white">Voltar ao início</Link></p>
      </section>
    </main>

    {open && <NicheViewer id={open} ids={viewerIds} name={name} onClose={close} onNav={show}
      actions={<>
        <button type="button" className="nv-ghost" onClick={() => share(open)} aria-label="Compartilhar este exemplo">{copied ? <Check size={17} /> : <Share2 size={17} />}<span>{copied ? 'Link copiado' : 'Enviar'}</span></button>
        <a className="nv-cta is-whats" href={wa(`Olá! Vi o exemplo de mini site de ${nicheById(open)!.label} na vitrine da DDS e quero um assim${name ? ` para a ${name}` : ''}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Quero um assim <ArrowRight size={15} className="nv-cta-arrow" /></a>
      </>} />}
  </div>;
}
