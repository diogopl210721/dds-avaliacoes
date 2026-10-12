import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  LayoutTemplate, Palette, PanelsTopLeft, Rocket, Tags, Eye, Copy, ArrowUpRight, Check, Save, Upload, Menu, LogIn, X, Smartphone, ChevronRight,
  ChevronLeft, Sparkles, ThumbsUp, Building2, ShoppingBag, Star, Images, CalendarCheck, HelpCircle, Megaphone, MapPin, Share2,
  QrCode, ExternalLink, EyeOff, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase, callFunction } from '../lib/supabaseClient';
import {
  MiniContent, MiniRecord, blankContent, demoContent, normalizeContent, slugify, safeUrl, validEmail, siteLink, themeOptions,
  LIMITS, BENEFIT_ICONS, LIST_TITLE_DEFAULT, LIST_TITLE_SUGGESTIONS, uid, demoFor, youtubeId, Product, Benefit, Stat, Testimonial, Faq,
} from '../lib/miniPage';
import { PALETTES } from '../lib/miniPalettes';
import { compressImage, ImageKind } from '../lib/miniImage';
import { loadFonts } from '../lib/miniFonts';
import MiniLanding, { ICONS } from '../components/MiniLanding';
import { MiniPreviewModal, ThemePhone } from '../components/MiniThemes';
import type { MiniTheme, PaletteId } from '../lib/miniPage';

// WhatsApp comercial da DDS (botão "Quero o meu" da demonstração).
const WHATS_DEMO = `https://wa.me/5541991542931?text=${encodeURIComponent('Olá! Vi a demonstração do mini site da DDS Avaliações e quero o meu.')}`;
import { Field, Area, PhotoBox, Section, ListEditor, useOpen } from '../components/StudioFields';
import StudioAutofill from '../components/StudioAutofill';
import Analise from './Analise';
import type { PlateMiniAccess } from '../components/PlateMiniOffer';
import TrocarLink from './TrocarLink';
import Recuperar from './Recuperar';
import '../mini.css';

type Step = 'modelo' | 'cores' | 'conteudo' | 'publicar' | 'placa';
type Vars = CSSProperties & Record<`--${string}`, string | number>;
const STEPS: { id: Step; label: string; short: string; icon: typeof Eye }[] = [
  { id: 'modelo', label: 'Modelo', short: '1', icon: LayoutTemplate },
  { id: 'cores', label: 'Cores', short: '2', icon: Palette },
  { id: 'conteudo', label: 'Conteúdo', short: '3', icon: PanelsTopLeft },
  { id: 'publicar', label: 'Publicar', short: '4', icon: Rocket },
];
const ICON_NAMES: Record<string, string> = { shield: 'Escudo', clock: 'Relógio', star: 'Estrela', heart: 'Coração', truck: 'Entrega', award: 'Prêmio', leaf: 'Folha', sparkles: 'Brilho', thumbs: 'Positivo', wrench: 'Ferramenta', smile: 'Sorriso', zap: 'Raio', calendar: 'Agenda', users: 'Pessoas', wallet: 'Preço', pin: 'Local' };
const URL_FIELDS: { key: keyof MiniContent; label: string }[] = [
  { key: 'maps', label: 'Localização no Google' }, { key: 'review', label: 'Avaliar no Google' }, { key: 'facebook', label: 'Facebook' }, { key: 'youtube', label: 'YouTube' },
  { key: 'website', label: 'Site' }, { key: 'video', label: 'Vídeo' }, { key: 'booking', label: 'Agendamento' }, { key: 'delivery', label: 'Delivery' }, { key: 'menu', label: 'Cardápio' },
];

export default function MiniStudio({ demo = false, plateAccess }: { demo?: boolean; plateAccess?: PlateMiniAccess }) {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>('modelo');
  const [c, setC] = useState<MiniContent>(demo ? structuredClone(demoContent) : structuredClone(blankContent));
  const [records, setRecords] = useState<MiniRecord[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [slug, setSlug] = useState(demo ? 'aurora-cafe' : '');
  const [slugState, setSlugState] = useState<{ status: 'idle' | 'checking' | 'ok' | 'taken'; message?: string }>({ status: 'idle' });
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(demo);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [preview, setPreview] = useState(false);
  // Prévia em tela cheia de um modelo com dados fictícios do segmento (passo 1).
  const [modelPreview, setModelPreview] = useState<{ theme: MiniTheme; palette: PaletteId } | null>(null);
  const [plateTab, setPlateTab] = useState('inicio');
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountChecked, setAccountChecked] = useState(false);
  const { open, toggle } = useOpen('inicio');
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();
  const top = useRef<HTMLDivElement>(null);

  function notify(message: string) { setNotice(message); clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setNotice(''), 7000); }
  function field<K extends keyof MiniContent>(key: K, value: MiniContent[K]) { setC(old => ({ ...old, [key]: value })); setDirty(true); }
  function select(record: MiniRecord) { setId(record.id); setSlug(record.slug); setC(normalizeContent(record.content)); setPublished(record.published); setDirty(false); }
  useEffect(() => { loadFonts(themeOptions.map(t => t.id)); }, []);
  useEffect(() => {
    if (!plateAccess) return;
    if (plateAccess.page) { select(plateAccess.page); setStep('conteudo'); }
    else { setC({ ...structuredClone(blankContent), name: plateAccess.company?.nome ?? '', review: plateAccess.company?.write_a_review_uri ?? '' }); setSlug(slugify(plateAccess.company?.nome ?? '')); setStep('modelo'); }
    setLoaded(true);
  }, [plateAccess]);
  useEffect(() => {
    if (demo || plateAccess || !user) return; let active = true;
    (async () => {
      const { data, error } = await supabase.from('mini_pages').select('id,slug,published,content').eq('owner_id', user.id).order('updated_at', { ascending: false });
      if (!active) return;
      if (error) setError('Não foi possível carregar suas páginas. Tente atualizar.'); else { setRecords((data ?? []) as MiniRecord[]); if (data?.length) { select(data[0] as MiniRecord); setStep('conteudo'); } }
      setLoaded(true);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (active) { setIsAdmin(profile?.role === 'admin'); setAccountChecked(true); }
    })();
    return () => { active = false; clearTimeout(noticeTimer.current); };
  }, [user?.id, demo, plateAccess]);
  useEffect(() => { if (!dirty) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);

  function go(next: Step) { setStep(next); setMobileMenu(false); setError(''); top.current?.scrollIntoView({ block: 'start' }); window.scrollTo({ top: 0 }); }
  function newPage() { if (dirty && !confirm('Descartar as alterações não salvas e criar uma nova página?')) return; setId(null); setC(structuredClone(blankContent)); setSlug(''); setPublished(false); setDirty(false); go('modelo'); }

  function validate(): string {
    if (!c.name.trim()) return 'Preencha o nome da empresa em Conteúdo → Primeira impressão.';
    const validSlug = slugify(slug || c.name);
    if (validSlug.length < 3) return 'O endereço da página deve ter pelo menos 3 letras ou números.';
    for (const f of URL_FIELDS) { const v = c[f.key] as string; if (v && !safeUrl(v)) return `O link de ${f.label} precisa ser completo, começando com https://.`; }
    if (c.instagram && !c.instagram.startsWith('@') && !safeUrl(c.instagram)) return 'Use @usuario ou o link completo do Instagram.';
    if (c.tiktok && !c.tiktok.startsWith('@') && !safeUrl(c.tiktok)) return 'Use @usuario ou o link completo do TikTok.';
    if (c.email && !validEmail(c.email)) return 'Confira o e-mail: ele precisa ter @ e domínio, como contato@empresa.com.br.';
    if (c.palette === 'brand' && !/^#[0-9a-f]{6}$/i.test(c.brandColor)) return 'Escolha a cor da sua marca em Cores, ou selecione uma das 4 combinações.';
    return '';
  }

  async function checkSlug(value: string) {
    const s = slugify(value);
    if (s.length < 3) { setSlugState({ status: 'taken', message: 'Use pelo menos 3 letras ou números.' }); return false; }
    if (!plateAccess) { setSlugState({ status: 'idle' }); return true; }
    setSlugState({ status: 'checking' });
    try {
      const r = await callFunction<{ available: boolean; message?: string }>('plate-mini', { action: 'check-slug', codigo: plateAccess.codigo, senha: plateAccess.senha, slug: s });
      setSlugState(r.available ? { status: 'ok' } : { status: 'taken', message: r.message || 'Esse endereço já está em uso. Escolha outro.' });
      return r.available;
    } catch { setSlugState({ status: 'idle' }); return true; }
  }

  async function save(makePublic: boolean) {
    setError('');
    const problem = validate(); if (problem) { setError(problem); return; }
    const validSlug = slugify(slug || c.name);
    if (demo) { setSlug(validSlug); setDirty(false); notify('Prévia atualizada. A demonstração não publica nem salva dados reais.'); return; }
    if (plateAccess) {
      setBusy(true);
      try {
        const { page } = await callFunction<{ page: MiniRecord }>('plate-mini', { action: 'save', codigo: plateAccess.codigo, senha: plateAccess.senha, slug: validSlug, content: c, published: makePublic });
        setId(page.id); setSlug(page.slug); setPublished(page.published); setDirty(false); setSlugState({ status: 'ok' });
        notify(makePublic ? 'Página publicada! O link já funciona. A prévia com foto no WhatsApp fica pronta em alguns minutos.' : 'Alterações salvas. A página não está publicada.');
        if (makePublic) go('publicar');
      } catch (e: any) { setError(e.message || 'Não foi possível salvar.'); }
      finally { setBusy(false); }
      return;
    }
    if (!user) { setError('Entre na sua conta para salvar.'); return; }
    setBusy(true);
    try {
      const payload = { owner_id: user.id, slug: validSlug, content: c, published: makePublic, updated_at: new Date().toISOString() };
      const request = id ? supabase.from('mini_pages').update(payload).eq('id', id).eq('owner_id', user.id) : supabase.from('mini_pages').insert(payload);
      const { data, error } = await request.select('id,slug,published,content').single(); if (error) throw error;
      setId(data.id); setSlug(data.slug); setPublished(data.published); setDirty(false); setRecords(old => [data as MiniRecord, ...old.filter(r => r.id !== data.id)]);
      notify(makePublic ? 'Página publicada! O link já funciona.' : 'Rascunho salvo.');
      if (makePublic) go('publicar');
    } catch (e: any) { setError(e.code === '23505' ? 'Esse endereço já está em uso. Escolha outro nome para o link.' : e.message || 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }

  async function upload(original: File, kind: ImageKind, apply: (url: string) => void) {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(original.type)) { setError('Escolha uma foto JPG, PNG ou WebP.'); return; }
    setBusy(true);
    const file = await compressImage(original, kind);
    if (file.size > 5 * 1024 * 1024) { setBusy(false); setError('A foto deve ter no máximo 5 MB.'); return; }
    try {
      if (demo) { const url = await new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); }); apply(url); setDirty(true); notify('Foto adicionada à prévia.'); return; }
      if (plateAccess) {
        const ticket = await callFunction<{ path: string; token: string; url: string }>('plate-mini', { action: 'upload', codigo: plateAccess.codigo, senha: plateAccess.senha, mime: file.type, size: file.size });
        const { error } = await supabase.storage.from('mini-page-images').uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
        if (error) throw error;
        apply(ticket.url); setDirty(true); notify('Foto enviada. Publique ou salve para aplicar.'); return;
      }
      if (!user) return;
      const path = `${user.id}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
      const { error } = await supabase.storage.from('mini-page-images').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      apply(supabase.storage.from('mini-page-images').getPublicUrl(path).data.publicUrl); setDirty(true); notify('Foto enviada. Publique ou salve para aplicar.');
    } catch (e: any) { setError(e.message || 'Não foi possível enviar a foto.'); }
    finally { setBusy(false); }
  }

  const link = slug ? siteLink(slug) : '';
  async function copyLink() {
    if (demo) { notify('Este é um exemplo. Na página real, este botão copia o seu link.'); return; }
    if (!published || dirty) { setError('Publique as alterações antes de copiar o link.'); return; }
    try { await navigator.clipboard.writeText(link); notify('Link copiado!'); } catch { setError(`Copie este link: ${link}`); }
  }
  async function downloadQr() {
    if (!link) return;
    try {
      const url = await QRCode.toDataURL(link, { width: 1024, margin: 2, errorCorrectionLevel: 'M' });
      const a = document.createElement('a'); a.href = url; a.download = `qr-${slug}.png`; a.click();
    } catch { setError('Não foi possível gerar o QR Code.'); }
  }
  async function unpublish() {
    if (!confirm('Tirar a página do ar? O link vai mostrar que a página não está disponível. Você pode publicar de novo quando quiser.')) return;
    await save(false);
  }

  const filled = useMemo(() => ({
    inicio: !!(c.name && c.phone && c.headline), porque: c.benefits.length > 0, sobre: !!(c.description || c.mission || c.vision || c.values), servicos: c.products.length > 0,
    prova: c.stats.length + c.testimonials.length + c.brands.length > 0, fotos: c.gallery.length > 0 || !!c.video, acoes: !!(c.booking || c.delivery || c.menu),
    faq: c.faq.length > 0, final: !!c.finalTitle, contato: !!(c.address || c.email || c.hours), redes: !!(c.instagram || c.facebook || c.tiktok || c.youtube || c.website),
  }), [c]);

  if (!demo && !plateAccess && !authLoading && !user) return <div className="studio-empty"><span className="studio-brand">DDS <em>Avaliações</em></span><h1>Sua empresa, com uma presença que impressiona.</h1><p>Entre com sua conta para criar e publicar mini páginas.</p><Link className="studio-primary" to="/login?next=minisite"><LogIn size={18} /> Entrar na minha conta</Link><Link to="/demo">Explorar demonstração</Link></div>;
  if (!demo && !plateAccess && user && !accountChecked) return <div className="studio-empty">Verificando acesso…</div>;
  if (!demo && !plateAccess && user && accountChecked && !isAdmin) return <Navigate to="/sistema" replace />;
  if (!loaded) return <div className="studio-empty">Carregando suas páginas…</div>;

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const nav = (back?: Step, next?: Step, nextLabel?: string) => <div className="sw-nav">
    {back ? <button className="studio-secondary" onClick={() => go(back)}><ChevronLeft size={17} /> Voltar</button> : <span />}
    {next && <button className="studio-primary" onClick={() => go(next)}>{nextLabel} <ChevronRight size={17} /></button>}
  </div>;

  const sections = <>
    <Section id="inicio" icon={<Sparkles size={19} />} title="Primeira impressão" hint="Nome, promessa, botão do WhatsApp e foto de capa" filled={filled.inicio} open={open === 'inicio'} onToggle={toggle}>
      <div className="sf-grid">
        <Field label="Nome da empresa *" value={c.name} onChange={v => { field('name', v); if (!id && !published) setSlug(slugify(v)); }} placeholder="Nome do seu negócio" max={100} />
        <Field label="WhatsApp com DDD *" value={c.phone} onChange={v => field('phone', v)} placeholder="41 99999-9999" type="tel" max={30} />
        <div className="sf-wide"><Area label="Título forte (sua promessa)" value={c.headline} onChange={v => field('headline', v)} rows={2} max={140} placeholder="Ex.: Instalação de gás com segurança e agilidade para o seu negócio" hint="O que você resolve para o cliente, em uma frase. Aparece grande no topo." /></div>
        <div className="sf-wide"><Area label="Subtítulo" value={c.tagline} onChange={v => field('tagline', v)} rows={2} max={200} placeholder="Ex.: Atendimento 24h, técnicos certificados e orçamento em 10 minutos." /></div>
        <Field label="Texto do botão principal" value={c.ctaText} onChange={v => field('ctaText', v)} max={40} placeholder="Ex.: Solicite um orçamento rápido" hint="Leva para o seu WhatsApp." />
        <Field label="Mensagem pronta do WhatsApp" value={c.ctaMessage} onChange={v => field('ctaMessage', v)} max={300} placeholder="Ex.: Olá! Quero um orçamento." />
      </div>
      <div className="studio-photo-grid"><PhotoBox title="Foto de capa (imagem de impacto)" url={c.cover} disabled={busy} onFile={f => upload(f, 'cover', url => field('cover', url))} onRemove={() => field('cover', '')} /><PhotoBox title="Logo" url={c.logo} contain disabled={busy} onFile={f => upload(f, 'logo', url => field('logo', url))} onRemove={() => field('logo', '')} /></div>
      <p className="studio-hint">Prefira uma foto real do seu serviço, equipe ou produto. JPG, PNG ou WebP; fotos grandes são reduzidas automaticamente.</p>
    </Section>

    <Section id="porque" icon={<ThumbsUp size={19} />} title="Por que escolher você" hint="Benefícios com ícones, até 6" filled={filled.porque} open={open === 'porque'} onToggle={toggle}>
      <p className="sf-help">Fale do ganho para o cliente, não só da característica. Ex.: "Atendimento 24h", "Instalação sem sujeira", "Garantia estendida".</p>
      <ListEditor<Benefit> items={c.benefits} max={LIMITS.benefits} addLabel="Adicionar benefício" empty="Nenhum benefício ainda." onChange={v => field('benefits', v)} make={() => ({ id: uid(), icon: 'star', title: '', text: '' })}
        render={(b, set) => <>
          <div className="sf-icons" role="radiogroup" aria-label="Ícone">{BENEFIT_ICONS.map(k => { const I = ICONS[k]; return <button key={k} role="radio" aria-checked={b.icon === k} title={ICON_NAMES[k]} aria-label={ICON_NAMES[k]} onClick={() => set({ icon: k })}><I size={17} /></button>; })}</div>
          <Field label="Título" value={b.title} onChange={v => set({ title: v })} max={60} placeholder="Atendimento 24h" />
          <Field label="Texto curto" value={b.text} onChange={v => set({ text: v })} max={160} placeholder="Estamos prontos quando você precisar." />
        </>} />
    </Section>

    <Section id="sobre" icon={<Building2 size={19} />} title="Sobre a empresa" hint="Quem somos, missão, visão e valores" filled={filled.sobre} open={open === 'sobre'} onToggle={toggle}>
      <Area label="Quem somos" value={c.description} onChange={v => field('description', v)} rows={4} max={1800} placeholder="Conte a história e o que torna sua empresa especial." />
      <div className="sf-grid sf-grid-3"><Area label="Missão" value={c.mission} onChange={v => field('mission', v)} max={500} /><Area label="Visão" value={c.vision} onChange={v => field('vision', v)} max={500} /><Area label="Valores" value={c.values} onChange={v => field('values', v)} max={500} /></div>
    </Section>

    <Section id="servicos" icon={<ShoppingBag size={19} />} title="Serviços e produtos" hint="Com preço e foto, se quiser" filled={filled.servicos} open={open === 'servicos'} onToggle={toggle}>
      <div className="sf-list-title">
        <Field label="Título da lista na página" value={c.listTitle} onChange={v => field('listTitle', v)} max={40} placeholder={LIST_TITLE_DEFAULT[c.theme]} hint={c.listTitle ? undefined : `Sem escolher, aparece "${LIST_TITLE_DEFAULT[c.theme]}".`} />
        <div className="sf-chips" role="group" aria-label="Sugestões de título">{LIST_TITLE_SUGGESTIONS.map(t => <button key={t} type="button" aria-pressed={(c.listTitle || LIST_TITLE_DEFAULT[c.theme]) === t} onClick={() => field('listTitle', t)}>{t}</button>)}</div>
      </div>
      <ListEditor<Product> items={c.products} max={LIMITS.products} addLabel="Adicionar serviço ou produto" empty="Nenhum item ainda. Sem fotos, os itens aparecem em lista com preço." onChange={v => field('products', v)} make={() => ({ id: uid(), name: '', description: '', price: '', image: '' })}
        render={(p, set) => <div className="sf-product">
          <PhotoBox title="Foto (opcional)" url={p.image} disabled={busy} onFile={f => upload(f, 'photo', url => setC(old => ({ ...old, products: old.products.map(x => x.id === p.id ? { ...x, image: url } : x) })))} onRemove={() => set({ image: '' })} />
          <div><Field label="Nome" value={p.name} onChange={v => set({ name: v })} max={100} /><Field label="Descrição" value={p.description} onChange={v => set({ description: v })} max={300} /><Field label="Preço em R$ (opcional)" value={p.price} onChange={v => set({ price: v })} max={30} placeholder="59,90" /></div>
        </div>} />
    </Section>

    <Section id="prova" icon={<Star size={19} />} title="Prova social" hint="Números, depoimentos e marcas atendidas" filled={filled.prova} open={open === 'prova'} onToggle={toggle}>
      <h4 className="sf-sub">Números de impacto</h4>
      <ListEditor<Stat> items={c.stats} max={LIMITS.stats} addLabel="Adicionar número" empty="Ex.: +500 instalações realizadas, 10 anos no mercado." onChange={v => field('stats', v)} make={() => ({ id: uid(), value: '', label: '' })}
        render={(s, set) => <div className="sf-grid"><Field label="Número" value={s.value} onChange={v => set({ value: v })} max={20} placeholder="+500" /><Field label="Descrição" value={s.label} onChange={v => set({ label: v })} max={60} placeholder="instalações realizadas" /></div>} />
      <h4 className="sf-sub">Depoimentos de clientes</h4>
      <p className="sf-help">Use só depoimentos reais, com autorização de quem escreveu.</p>
      <ListEditor<Testimonial> items={c.testimonials} max={LIMITS.testimonials} addLabel="Adicionar depoimento" empty="Nenhum depoimento ainda." onChange={v => field('testimonials', v)} make={() => ({ id: uid(), name: '', text: '', stars: 5 })}
        render={(t, set) => <><Area label="Depoimento" value={t.text} onChange={v => set({ text: v })} rows={3} max={400} /><div className="sf-grid"><Field label="Nome do cliente" value={t.name} onChange={v => set({ name: v })} max={60} placeholder="Maria S." /><label className="sf-field">Estrelas<select value={t.stars} onChange={e => set({ stars: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}</select></label></div></>} />
      <h4 className="sf-sub">Marcas e clientes atendidos</h4>
      <div className="studio-gallery-editor">{c.brands.map((image, i) => <div key={i}><img src={image} alt={`Marca ${i + 1}`} style={{ objectFit: 'contain', background: '#fff' }} /><button aria-label={`Excluir marca ${i + 1}`} onClick={() => field('brands', c.brands.filter((_, k) => k !== i))}><X size={15} /></button></div>)}
        {c.brands.length < LIMITS.brands && <label className="studio-upload-small"><Upload /><span>Adicionar logo</span><input aria-label="Adicionar logo de cliente" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0], 'logo', url => setC(old => ({ ...old, brands: [...old.brands, url].slice(0, LIMITS.brands) }))); e.target.value = ''; }} /></label>}</div>
    </Section>

    <Section id="fotos" icon={<Images size={19} />} title="Fotos e vídeo" hint="Galeria de até 12 fotos e um vídeo do YouTube" filled={filled.fotos} open={open === 'fotos'} onToggle={toggle}>
      <div className="studio-gallery-editor">{c.gallery.map((image, i) => <div key={i}><img src={image} alt={`Foto ${i + 1}`} /><button aria-label={`Excluir foto ${i + 1}`} onClick={() => field('gallery', c.gallery.filter((_, k) => k !== i))}><X size={15} /></button></div>)}
        {c.gallery.length < LIMITS.gallery && <label className="studio-upload-small"><Upload /><span>Adicionar foto</span><input aria-label="Adicionar foto à galeria" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0], 'photo', url => setC(old => ({ ...old, gallery: [...old.gallery, url].slice(0, LIMITS.gallery) }))); e.target.value = ''; }} /></label>}</div>
      <Field label="Link do vídeo" value={c.video} onChange={v => field('video', v)} max={300} placeholder="https://youtube.com/watch?v=…" hint={c.video && !youtubeId(c.video) ? 'Links do YouTube aparecem com o vídeo na página. Outros links viram um botão.' : 'Cole o link de um vídeo do YouTube.'} />
    </Section>

    <Section id="acoes" icon={<CalendarCheck size={19} />} title="Agendamento e pedidos" hint="Botões para agendar, delivery e cardápio" filled={filled.acoes} open={open === 'acoes'} onToggle={toggle}>
      <Field label="Link de agendamento" value={c.booking} onChange={v => field('booking', v)} max={500} placeholder="https://…" hint="Sistema de agenda, Google Agenda, Booksy, Trinks…" />
      <Field label="Link do delivery" value={c.delivery} onChange={v => field('delivery', v)} max={500} placeholder="https://www.ifood.com.br/…" />
      <Field label="Link do cardápio completo" value={c.menu} onChange={v => field('menu', v)} max={500} placeholder="https://… (PDF ou página)" />
    </Section>

    <Section id="faq" icon={<HelpCircle size={19} />} title="Perguntas frequentes" hint="Tire dúvidas antes do primeiro contato" filled={filled.faq} open={open === 'faq'} onToggle={toggle}>
      <ListEditor<Faq> items={c.faq} max={LIMITS.faq} addLabel="Adicionar pergunta" empty="Nenhuma pergunta ainda." onChange={v => field('faq', v)} make={() => ({ id: uid(), q: '', a: '' })}
        render={(f, set) => <><Field label="Pergunta" value={f.q} onChange={v => set({ q: v })} max={160} /><Area label="Resposta" value={f.a} onChange={v => set({ a: v })} rows={2} max={600} /></>} />
    </Section>

    <Section id="final" icon={<Megaphone size={19} />} title="Chamada final" hint="O fechamento, antes do rodapé" filled={filled.final} open={open === 'final'} onToggle={toggle}>
      <Field label="Título" value={c.finalTitle} onChange={v => field('finalTitle', v)} max={120} placeholder="Ex.: Evite paradas na sua operação" />
      <Area label="Texto" value={c.finalText} onChange={v => field('finalText', v)} rows={2} max={300} placeholder="Ex.: Fale agora com nossa equipe e receba um orçamento em até 10 minutos." hint="Mostra urgência ou facilidade. O botão do WhatsApp aparece embaixo." />
    </Section>

    <Section id="contato" icon={<MapPin size={19} />} title="Contato e endereço" hint="E-mail, endereço, horários e Google" filled={filled.contato} open={open === 'contato'} onToggle={toggle}>
      <div className="sf-grid">
        <Field label="E-mail" value={c.email} onChange={v => field('email', v)} type="email" max={120} placeholder="contato@empresa.com.br" />
        <div className="sf-wide"><Field label="Endereço completo" value={c.address} onChange={v => field('address', v)} max={300} /></div>
        <div className="sf-wide"><Area label="Horários de atendimento" value={c.hours} onChange={v => field('hours', v)} rows={2} max={300} placeholder="Segunda a sexta · 8h às 18h" /></div>
        <Field label="Localização no Google Maps" value={c.maps} onChange={v => field('maps', v)} max={500} placeholder="https://maps.google.com/…" />
        <Field label="Link para avaliar no Google" value={c.review} onChange={v => field('review', v)} max={500} placeholder="https://…" />
      </div>
    </Section>

    <Section id="redes" icon={<Share2 size={19} />} title="Redes sociais" hint="Instagram, Facebook, TikTok, YouTube e site" filled={filled.redes} open={open === 'redes'} onToggle={toggle}>
      <div className="sf-grid">
        <Field label="Instagram" value={c.instagram} onChange={v => field('instagram', v)} max={200} placeholder="@suaempresa" />
        <Field label="TikTok" value={c.tiktok} onChange={v => field('tiktok', v)} max={200} placeholder="@suaempresa" />
        <Field label="Facebook" value={c.facebook} onChange={v => field('facebook', v)} max={300} placeholder="https://facebook.com/…" />
        <Field label="YouTube" value={c.youtube} onChange={v => field('youtube', v)} max={300} placeholder="https://youtube.com/@…" />
        <div className="sf-wide"><Field label="Site (opcional)" value={c.website} onChange={v => field('website', v)} max={300} placeholder="https://…" /></div>
      </div>
    </Section>
  </>;

  const editor = <>
    {step !== 'placa' && <ol className="sw-steps" aria-label="Etapas">{STEPS.map((s, i) => <li key={s.id} className={s.id === step ? 'is-current' : i < stepIndex ? 'is-done' : ''}><button onClick={() => go(s.id)} aria-current={s.id === step ? 'step' : undefined}><b>{i < stepIndex ? <Check size={14} /> : s.short}</b><span>{s.label}</span></button></li>)}</ol>}

    {step === 'modelo' && <>
      <Title kicker="Passo 1 de 4" title="Escolha o modelo" text="Toque em um modelo para ver a página inteira com dados de exemplo. Você pode trocar depois sem perder o conteúdo." />
      <div className="studio-themes sw-themes">{themeOptions.map((t, i) => <button className={`studio-theme ${c.theme === t.id ? 'selected' : ''}`} key={t.id} aria-pressed={c.theme === t.id} aria-label={`Ver o modelo ${t.name}`} onClick={() => setModelPreview({ theme: t.id, palette: c.theme === t.id && c.palette !== 'brand' ? c.palette : demoFor(t.id).palette })}>
        <ThemePhone content={demoFor(t.id)} theme={t.id} index={i} /><span className="studio-theme-tag">{t.niche}</span><span className="studio-theme-choice">{t.name}{c.theme === t.id ? <em className="studio-theme-on"><Check size={14} /> Escolhido</em> : <em className="studio-theme-see"><Eye size={14} /> Ver modelo</em>}</span><p>{t.description}</p>
      </button>)}</div>
      {nav(undefined, 'cores', 'Escolher as cores')}
    </>}

    {step === 'cores' && <>
      <Title kicker="Passo 2 de 4" title="Escolha as cores" text={`Quatro combinações pensadas para o modelo ${themeOptions.find(t => t.id === c.theme)?.name}, ou a cor exata da sua marca.`} />
      <div className="sw-mobile-preview"><ThemePhone content={c} theme={c.theme} /></div>
      <div className="sw-palettes" role="radiogroup" aria-label="Combinações de cores">
        {PALETTES[c.theme].map(p => <button key={p.id} role="radio" aria-checked={c.palette === p.id} className="sw-palette" onClick={() => field('palette', p.id)}>
          <span className="sw-swatch" style={{ '--s1': p.vars['--bg'], '--s2': p.vars['--fx1'], '--s3': p.vars['--accent'], '--s4': p.vars['--accent2'], '--s5': p.vars['--ink'] } as Vars}><i /><i /><i /><i /><i /></span>
          <strong>{p.name}</strong>{c.palette === p.id && <Check size={18} />}
        </button>)}
        <div className={`sw-palette sw-brand${c.palette === 'brand' ? ' is-on' : ''}`}>
          <label className="sw-brand-pick"><input type="color" value={/^#[0-9a-f]{6}$/i.test(c.brandColor) ? c.brandColor : '#1f6fd1'} onChange={e => { setC(old => ({ ...old, brandColor: e.target.value, palette: 'brand' })); setDirty(true); }} aria-label="Escolher a cor da marca" /></label>
          <div><strong>Cor da minha marca</strong><Field label="Código da cor" value={c.brandColor} onChange={v => { const hex = v.startsWith('#') ? v : '#' + v; setC(old => ({ ...old, brandColor: hex.slice(0, 7), palette: /^#[0-9a-f]{6}$/i.test(hex) ? 'brand' : old.palette })); setDirty(true); }} placeholder="#1F6FD1" max={7} hint="Use a cor principal do logo. Ajustamos o tom para o texto ficar legível." /></div>
        </div>
      </div>
      {nav('modelo', 'conteudo', 'Preencher o conteúdo')}
    </>}

    {step === 'conteudo' && <>
      <Title kicker="Passo 3 de 4" title="Preencha o conteúdo" text="Comece pelo preenchimento automático e revise. Seções vazias não aparecem na página." />
      <StudioAutofill content={c} plateAccess={plateAccess} demo={demo} notify={notify}
        onChange={next => { setC(next); setDirty(true); }}
        onName={name => { if (!id && !published) setSlug(slugify(name)); }} />
      <div className="sf-sections">{sections}</div>
      {nav('cores', 'publicar', 'Revisar e publicar')}
    </>}

    {step === 'publicar' && <>
      <Title kicker="Passo 4 de 4" title="Publique sua página" text="Escolha o endereço e coloque no ar. Você pode editar e publicar de novo quando quiser." />
      <div className="studio-card sw-publish">
        <label className="sf-field">Endereço da página
          <div className="sw-address"><span>www.ddsinovacao.com.br/</span><input value={slug} onChange={e => { setSlug(slugify(e.target.value)); setSlugState({ status: 'idle' }); setDirty(true); }} onBlur={() => checkSlug(slug)} placeholder="nome-da-empresa" maxLength={60} aria-label="Nome no endereço" /></div>
        </label>
        {slugState.status === 'checking' && <p className="sw-slug">Verificando…</p>}
        {slugState.status === 'ok' && <p className="sw-slug is-ok"><Check size={15} /> Endereço disponível.</p>}
        {slugState.status === 'taken' && <p className="sw-slug is-bad"><AlertTriangle size={15} /> {slugState.message}</p>}
        <ul className="sw-check">
          <CheckItem ok={!!c.name} label="Nome da empresa" />
          <CheckItem ok={!!c.phone} label="WhatsApp" />
          <CheckItem ok={!!c.headline} label="Título forte" soft />
          <CheckItem ok={!!c.cover} label="Foto de capa" soft />
          <CheckItem ok={c.products.length > 0} label="Serviços ou produtos" soft />
          <CheckItem ok={c.benefits.length > 0} label="Benefícios" soft />
        </ul>
        <div className="studio-actions">
          {demo ? <a className="studio-primary" href={WHATS_DEMO} target="_blank" rel="noopener noreferrer"><Rocket size={17} />Quero o meu mini site</a> : <button className="studio-primary" onClick={() => save(true)} disabled={busy || slugState.status === 'taken'}><Rocket size={17} />{busy ? 'Publicando…' : published ? 'Publicar alterações' : 'Publicar página'}</button>}
          {demo ? <button className="studio-secondary" onClick={() => setPreview(true)}><Eye size={17} />Ver como fica</button> : <button className="studio-secondary" onClick={() => save(published)} disabled={busy}><Save size={17} />Salvar sem publicar</button>}
        </div>
      </div>
      {(published || demo) && <div className="studio-card sw-live">
        <span className={`sw-badge${published && !dirty ? ' is-live' : ''}`}>{demo ? 'Demonstração' : dirty ? 'Alterações não publicadas' : 'No ar'}</span>
        <h2>{link || siteLink('nome-da-empresa')}</h2>
        <p>O link funciona assim que você publica. A prévia com foto e nome no WhatsApp e no Instagram fica pronta em alguns minutos.</p>
        <div className="studio-actions">
          <button className="studio-primary" onClick={copyLink}><Copy size={17} /> Copiar link</button>
          {!demo && <a className="studio-secondary" href={link} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Abrir página</a>}
          <button className="studio-secondary" onClick={downloadQr} disabled={!link}><QrCode size={17} /> Baixar QR Code</button>
          {!demo && published && <button className="studio-secondary" onClick={unpublish} disabled={busy}><EyeOff size={17} /> Tirar do ar</button>}
        </div>
        {plateAccess && <p className="studio-hint">Quer que a sua plaquinha abra este mini site? Use "Trocar o link da minha placa" no seu sistema e cole o link acima.</p>}
      </div>}
      {nav('conteudo')}
    </>}

    {step === 'placa' && <><Title kicker="Sua plaquinha · seu controle" title="Um toque. Muitas possibilidades." text="Os recursos do DDS Avaliações continuam disponíveis aqui." />{demo ? <div className="studio-card"><Tags size={36} /><h2>Seu sistema de placas, integrado</h2><p>A demonstração protege suas placas: nenhuma configuração real será alterada.</p><div className="studio-feature-list"><span>Cadastro e ativação</span><span>Troca de destino do QR e NFC</span><span>Recuperação de código e senha</span><span>Análise por dia, mês, ano e origem</span><span>Contatos e aniversariantes</span><span>Exportação Excel e PDF</span></div><Link className="studio-primary" to="/minisite">Entrar no meu painel <ArrowUpRight size={17} /></Link></div> : <><div className="studio-plate-tabs">{[{ id: 'inicio', label: 'Visão geral' }, { id: 'analise', label: 'Análise e contatos' }, { id: 'editar', label: 'Alterar destino' }, { id: 'recuperar', label: 'Recuperar acesso' }].map(t => <button key={t.id} className={plateTab === t.id ? 'active' : ''} onClick={() => setPlateTab(t.id)}>{t.label}</button>)}</div>{plateTab === 'inicio' ? <div className="studio-card"><div className="studio-plate-art"><Tags size={42} /><span>DDS AVALIAÇÕES</span><h2>Sua conexão começa<br />com um toque.</h2><Smartphone size={30} /></div><div className="studio-actions"><Link className="studio-primary" to="/cadastrar">Cadastrar / ativar placa</Link><button className="studio-secondary" onClick={() => setPlateTab('analise')}>Acessos, contatos e relatórios</button>{isAdmin && <Link className="studio-secondary" to="/admin">Administrar placas e QR Codes</Link>}</div></div> : <div className="studio-legacy">{plateTab === 'analise' ? <Analise /> : plateTab === 'editar' ? <TrocarLink /> : <Recuperar />}</div>}</>}</>}
  </>;

  const sideItems = [...STEPS.map(s => ({ id: s.id, label: `${s.short}. ${s.label}`, icon: s.icon })), ...(plateAccess ? [] : [{ id: 'placa' as Step, label: 'Minha plaquinha', icon: Tags }])];
  return <div className="studio" ref={top}>
    <aside className={`studio-sidebar ${mobileMenu ? 'open' : ''}`}><Link className="studio-brand" to="/">DDS <em>Avaliações</em></Link><div className="studio-sidebar-caption">SEU NEGÓCIO, EM DESTAQUE</div>
      <nav>{sideItems.map(({ id: next, label, icon: Icon }) => <button key={next} className={step === next ? 'active' : ''} onClick={() => go(next)}><Icon size={19} />{label}</button>)}</nav>
      <div className="studio-sidebar-bottom"><div className="studio-sidebar-tip"><Sparkles size={22} /><strong>Uma presença que encanta.</strong><p>Sua página pronta para a bio, o WhatsApp e a plaquinha NFC.</p></div><Link to={demo ? '/minisite' : '/'}>{demo ? 'Entrar na minha conta' : 'Voltar ao DDS Avaliações'} <ArrowUpRight size={15} /></Link></div></aside>
    {mobileMenu && <button className="studio-scrim" aria-label="Fechar menu" onClick={() => setMobileMenu(false)} />}
    <div className="studio-workspace">
      <header className="studio-topbar"><button className="studio-mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu"><Menu /></button><span><span className="studio-top-dot" />{demo ? 'Demonstração interativa' : published ? (dirty ? 'Alterações não publicadas' : 'Página no ar') : 'Rascunho'}</span>
        {demo
          ? <div><button className="studio-secondary" onClick={() => setPreview(true)}><Eye size={16} /> <span className="sm:hidden">Prévia</span><span className="hidden sm:inline">Ver como fica</span></button><a className="studio-primary whitespace-nowrap" href={WHATS_DEMO} target="_blank" rel="noopener noreferrer"><Rocket size={16} /> Quero o meu</a></div>
          : <div><button className="studio-secondary" onClick={() => setPreview(true)}><Eye size={16} /> Prévia</button><button className="studio-primary" onClick={() => save(true)} disabled={busy}><Upload size={16} />{busy ? 'Aguarde…' : 'Publicar'}</button></div>}</header>
      {demo && <div className="studio-demo-banner"><Sparkles size={15} /><span>Demonstração com uma empresa fictícia: mexa à vontade, nada é publicado nem salvo. Gostou? Toque em <strong>Quero o meu</strong>.</span></div>}
      <div className="studio-content"><main>
        {!demo && !plateAccess && <div className="studio-records"><select aria-label="Selecionar mini página" value={id ?? ''} onChange={e => { const r = records.find(r => r.id === e.target.value); if (r && (!dirty || confirm('Descartar alterações não salvas?'))) select(r); }}><option value="">Nova mini página</option>{records.map(r => <option key={r.id} value={r.id}>{normalizeContent(r.content).name}</option>)}</select><button className="studio-secondary" onClick={newPage}>Nova página</button></div>}
        {error && <div className="studio-error" role="alert">{error}</div>}
        {editor}
      </main>
        {step !== 'placa' && <aside className="studio-preview"><div className="studio-preview-heading"><Smartphone size={17} /><strong>Assim seu cliente vai ver</strong><span>AO VIVO</span></div><div className="studio-phone"><div className="studio-phone-notch" /><div className="studio-phone-scroll"><MiniLanding content={c} demo={demo} /></div></div><button className="studio-preview-expand" onClick={() => setPreview(true)}>Abrir prévia completa <ArrowUpRight size={15} /></button></aside>}
      </div></div>
    {notice && <div className="studio-toast" role="status"><Check size={18} />{notice}</div>}
    {preview && <MiniPreviewModal content={c} demo={demo} label="Prévia da página" onClose={() => setPreview(false)} />}
    {modelPreview && <MiniPreviewModal content={{ ...demoFor(modelPreview.theme), palette: modelPreview.palette }} demo label="Modelo com dados de exemplo"
      onClose={() => setModelPreview(null)}
      onTheme={theme => setModelPreview({ theme, palette: demoFor(theme).palette })}
      onPalette={palette => setModelPreview({ ...modelPreview, palette })}
      action={{ label: 'Usar este modelo', onClick: () => { setC(old => ({ ...old, theme: modelPreview.theme, palette: modelPreview.palette })); setDirty(true); setModelPreview(null); go('cores'); notify(`Modelo ${themeOptions.find(t => t.id === modelPreview.theme)?.name} escolhido. Confira as cores.`); } }} />}
  </div>;
}

function Title({ kicker, title, text }: { kicker: string; title: string; text: string }) { return <div className="studio-heading"><span className="studio-kicker">{kicker}</span><h1>{title}</h1><p>{text}</p></div>; }
function CheckItem({ ok, label, soft = false }: { ok: boolean; label: string; soft?: boolean }) {
  return <li className={ok ? 'is-ok' : soft ? 'is-soft' : 'is-bad'}>{ok ? <Check size={15} /> : <AlertTriangle size={15} />}{label}{!ok && <small>{soft ? 'recomendado' : 'obrigatório'}</small>}</li>;
}
