import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MiniContent } from '../lib/miniPage';
import MiniLanding from '../components/MiniLanding';
import '../mini.css';
export default function MiniPublic() {
  const { slug } = useParams();
  const [content, setContent] = useState<MiniContent | null>(null);
  const [status, setStatus] = useState('Carregando página…');
  useEffect(() => { let active = true; setContent(null); setStatus('Carregando página…'); supabase.from('mini_pages').select('content').eq('slug', slug).eq('published', true).maybeSingle().then(({data,error}) => { if (!active) return; if (error) setStatus('Não foi possível carregar. Tente novamente.'); else if (!data) setStatus('Esta página ainda não está disponível.'); else { setContent(data.content as MiniContent); document.title = `${data.content.name} · Conheça nosso negócio`; } }); return () => { active = false; }; }, [slug]);
  return <div className="mini-public">{content ? <MiniLanding content={content} /> : <div className="studio-empty"><h1>{status}</h1><Link to="/">Voltar</Link></div>}</div>;
}
