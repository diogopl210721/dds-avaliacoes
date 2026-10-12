import { CSSProperties, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MiniContent, normalizeContent } from '../lib/miniPage';
import { paletteVars } from '../lib/miniPalettes';
import MiniLanding from '../components/MiniLanding';
import '../mini.css';

// Link antigo (#/loja/nome). O endereço principal agora é www.ddsinovacao.com.br/nome.
export default function MiniPublic() {
  const { slug } = useParams();
  const [content, setContent] = useState<MiniContent | null>(null);
  const [status, setStatus] = useState('Carregando página…');
  useEffect(() => {
    let active = true; setContent(null); setStatus('Carregando página…');
    supabase.from('mini_pages').select('content').eq('slug', slug).eq('published', true).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) setStatus('Não foi possível carregar. Tente novamente.');
      else if (!data) setStatus('Esta página ainda não está disponível.');
      else { const c = normalizeContent(data.content as MiniContent); setContent(c); document.title = `${c.name} · ${c.headline || c.tagline || 'Conheça nosso negócio'}`; }
    });
    return () => { active = false; };
  }, [slug]);
  const vars = content ? paletteVars(content.theme, content.palette, content.brandColor) : {};
  return <div className="mini-public" style={vars as CSSProperties}>{content ? <MiniLanding content={content} floating /> : <div className="studio-empty"><h1>{status}</h1><Link to="/">Voltar</Link></div>}</div>;
}
