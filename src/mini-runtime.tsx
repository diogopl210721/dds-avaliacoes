// Página pública do mini site em www.ddsinovacao.com.br/<nome>.
// Carregada pela página gerada (/nome/index.html, com o conteúdo embutido) ou pela 404 do site
// (link recém-publicado, antes da página gerada ficar pronta). Sempre confere no banco se a
// página continua publicada e se há uma versão mais nova.
import { CSSProperties, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MiniLanding from './components/MiniLanding';
import { MiniContent, normalizeContent } from './lib/miniPage';
import { paletteVars } from './lib/miniPalettes';

type Embedded = { id?: string; slug: string; updated_at?: string; content: MiniContent };
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string)?.trim();
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim();

function readEmbedded(): Embedded | null {
  try { const el = document.getElementById('mini-data'); return el ? JSON.parse(el.textContent || 'null') : null; } catch { return null; }
}
function slugFromPath() {
  const first = decodeURIComponent(location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
  return /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(first) ? first : '';
}
async function fetchLive(slug: string): Promise<Embedded | null | 'error'> {
  if (!SUPABASE_URL || !ANON) return 'error';
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/mini_pages?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=id,slug,updated_at,content&limit=1`, { headers: { apikey: ANON } });
    if (!r.ok) return 'error';
    const rows = await r.json();
    return rows[0] ?? null;
  } catch { return 'error'; }
}

function App() {
  const embedded = readEmbedded();
  const slug = embedded?.slug || slugFromPath();
  const [page, setPage] = useState<Embedded | null>(embedded);
  const [state, setState] = useState<'ready' | 'loading' | 'missing'>(embedded ? 'ready' : slug ? 'loading' : 'missing');
  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetchLive(slug).then(live => {
      if (!active) return;
      if (live === 'error') { if (!embedded) setState('missing'); return; }
      if (!live) { setPage(null); setState('missing'); return; }
      if (!embedded || live.updated_at !== embedded.updated_at) setPage(live);
      setState('ready');
    });
    return () => { active = false; };
  }, [slug]);
  const content = page ? normalizeContent(page.content) : null;
  useEffect(() => {
    if (!content) { document.title = state === 'loading' ? 'Carregando…' : 'Página não encontrada · DDS Inovação'; return; }
    document.title = `${content.name}${content.headline || content.tagline ? ' · ' + (content.headline || content.tagline) : ''}`;
    const bg = paletteVars(content.theme, content.palette, content.brandColor)['--bg'];
    document.body.style.background = bg;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = bg;
  }, [content?.name, content?.theme, content?.palette, content?.brandColor, state]);

  if (state === 'loading') return <div className="mini-wait" aria-busy="true"><span /></div>;
  if (!content) return <main className="mini-missing">
    <h1>Página não encontrada</h1>
    <p>{slug ? 'Esta página não existe ou não está disponível no momento.' : 'O endereço que você abriu não existe.'}</p>
    <a href="https://www.ddsinovacao.com.br/">Ir para a DDS Inovação</a>
  </main>;
  const vars = paletteVars(content.theme, content.palette, content.brandColor) as CSSProperties;
  return <div className="mini-public" style={vars}><MiniLanding content={content} floating /></div>;
}

const root = document.getElementById('mini-root');
if (root) createRoot(root).render(<StrictMode><App /></StrictMode>);
