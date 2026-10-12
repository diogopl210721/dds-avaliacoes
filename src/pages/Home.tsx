import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Cake, Camera, CheckCircle2, Clapperboard, FileSpreadsheet, Handshake, KeyRound, LayoutDashboard, Link2,
  MessageCircle, MonitorSmartphone, Nfc, Palette, QrCode, RefreshCcw, ScanLine, Smartphone, Sparkles, Star, Workflow, Zap,
} from "lucide-react";
import { Aurora, BrandMark, Stars, Tilt, spotMove, useReveal } from "../components/ui/Fx";
import Plaque from "../components/ui/Plaque";

// Baixa a próxima tela assim que a pessoa mostra intenção (passa o dedo/cursor no botão).
const prefetch = {
  ativar: () => import("./Ativar"),
  sistema: () => import("./Analise"),
  demo: () => import("./MiniStudio"),
};
const intent = (load: () => Promise<unknown>) => ({ onPointerEnter: () => { load(); }, onTouchStart: () => { load(); }, onFocus: () => { load(); } });

// Contato comercial da DDS (WhatsApp). Cada botão manda uma mensagem diferente, para saber o interesse.
const WHATS = "5541991542931";
const WHATS_LABEL = "(41) 99154-2931";
const wa = (msg: string) => `https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`;
const MSG_PLACA = "Olá! Vim pelo site da DDS Avaliações e quero um orçamento da plaquinha de avaliação para a minha empresa.";
const msgServico = (servico: string) => `Olá! Vim pelo site da DDS Avaliações e quero um orçamento de ${servico}.`;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const ref = useReveal<HTMLDivElement>();
  const hero = useRef<HTMLElement>(null);
  const offerCta = useRef<HTMLAnchorElement>(null);
  const [pastHero, setPastHero] = useState(false);
  const [ctaInView, setCtaInView] = useState(false);
  const year = new Date().getFullYear();
  // O WhatsApp flutuante só aparece depois da primeira dobra: quem veio ativar não é incomodado.
  useEffect(() => {
    const el = hero.current; if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    // Some enquanto o botão grande da oferta está na tela (não ficam dois iguais).
    const cta = offerCta.current;
    const io2 = cta ? new IntersectionObserver(([e]) => setCtaInView(e.isIntersecting), { threshold: 0 }) : null;
    if (cta && io2) io2.observe(cta);
    return () => { io.disconnect(); io2?.disconnect(); };
  }, []);
  const showFloat = pastHero && !ctaInView;
  return (
    <div ref={ref} className="dds-dark min-h-[100dvh] overflow-x-clip">
      <Aurora />

      <header className="sticky top-0 z-30 border-b border-white/[.06] bg-navy-950/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <BrandMark />
          <nav className="hidden md:flex items-center gap-1 text-sm text-[#b9c8e2]">
            <button onClick={() => scrollToId("como-funciona")} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition">Como funciona</button>
            <button onClick={() => scrollToId("recursos")} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition">Recursos</button>
            <button onClick={() => scrollToId("servicos")} className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/5 transition">Serviços</button>
            <button onClick={() => scrollToId("quero")} className="ml-1 px-3 py-2 rounded-lg font-semibold text-[#66e0ff] hover:text-white hover:bg-white/5 transition">Quero a minha</button>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/sistema" {...intent(prefetch.sistema)} className="dds-btn dds-btn-ghost-dark dds-btn-sm sm:px-4">Meu sistema</Link>
            <Link to="/cadastrar" {...intent(prefetch.ativar)} className="dds-btn dds-btn-glow dds-btn-sm sm:px-4 hidden sm:inline-flex">Ativar placa</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Primeira dobra */}
        <section ref={hero} className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-16 lg:pb-24 grid lg:grid-cols-[1.05fr_.95fr] gap-12 lg:gap-8 items-center">
          <div>
            <button onClick={() => scrollToId("minisite")} className="group dds-eyebrow dds-rise !pl-1.5 hover:!bg-[#399cff24] hover:!border-[#399cff66] transition-colors">
              <span className="rounded-full bg-gradient-to-r from-[#66e0ff] to-[#8fb8ff] px-2 py-0.5 text-[10px] font-extrabold tracking-[.08em] text-navy-950">NOVO</span>
              Seu mini site no ar em minutos
              <ArrowRight size={14} className="text-[#66e0ff] transition-transform group-hover:translate-x-0.5" />
            </button>
            <h1 className="font-display font-extrabold text-[clamp(40px,7vw,76px)] leading-[1.02] tracking-[-.045em] mt-6 dds-rise" style={{ ["--d" as string]: ".08s" }}>
              Um toque.<br />Mais <span className="font-serif italic font-normal tracking-[-.02em] dds-spectrum-text pr-1">avaliações</span><br className="hidden sm:block" /> no Google.
            </h1>
            <p className="mt-6 text-[17px] sm:text-lg leading-relaxed text-[#a7b7d1] max-w-xl dds-rise" style={{ ["--d" as string]: ".16s" }}>
              Seu cliente aproxima o celular ou escaneia o QR Code e cai direto na tela de avaliação da sua empresa. <strong className="text-white font-semibold">Sem aplicativo, sem procurar, em segundos.</strong>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 dds-rise" style={{ ["--d" as string]: ".24s" }}>
              <Link to="/cadastrar" {...intent(prefetch.ativar)} className="dds-btn dds-btn-glow dds-btn-lg">Ativar minha placa <ArrowRight size={18} /></Link>
              <Link to="/sistema" {...intent(prefetch.sistema)} className="dds-btn dds-btn-ghost-dark dds-btn-lg"><LayoutDashboard size={18} /> Acessar meu sistema</Link>
            </div>
            <button onClick={() => scrollToId("quero")} className="group mt-4 inline-flex items-center gap-2 text-[15px] text-[#a7b7d1] hover:text-white transition dds-rise" style={{ ["--d" as string]: ".28s" }}>
              Ainda não tem a sua? <span className="font-semibold text-[#66e0ff] underline decoration-[#66e0ff55] underline-offset-4 group-hover:decoration-[#66e0ff]">Quero uma plaquinha</span>
              <ArrowDown size={16} className="text-[#66e0ff] transition-transform group-hover:translate-y-0.5" />
            </button>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#a7b7d1] dds-rise" style={{ ["--d" as string]: ".32s" }}>
              <li className="flex items-center gap-2"><Zap size={16} className="text-[#66e0ff]" /> Sem baixar nada</li>
              <li className="flex items-center gap-2"><Smartphone size={16} className="text-[#66e0ff]" /> iPhone e Android</li>
              <li className="flex items-center gap-2"><RefreshCcw size={16} className="text-[#66e0ff]" /> Troca o link sem reimprimir</li>
            </ul>
          </div>

          <HeroArt />
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <SectionTitle eyebrow="Como funciona" title={<>Do toque à <span className="font-serif italic font-normal text-brand-300">estrela</span> em três passos.</>} />
          <div className="relative mt-12 grid md:grid-cols-3 gap-5">
            <div className="hidden md:block absolute top-[46px] left-[16%] right-[16%] dds-flow" aria-hidden="true" />
            {[
              { icon: <ScanLine size={22} />, n: "01", t: "Aproxime ou escaneie", d: "O cliente encosta o celular na placa (NFC) ou aponta a câmera para o QR Code." },
              { icon: <Star size={22} />, n: "02", t: "Avalie em segundos", d: "Ele cai direto na avaliação da sua empresa no Google. Antes, pode deixar telefone e aniversário." },
              { icon: <BarChart3 size={22} />, n: "03", t: "Acompanhe tudo", d: "No seu sistema: acessos por dia, QR ou NFC, telefones e aniversariantes do mês." },
            ].map((s, i) => (
              <article key={s.n} data-reveal style={{ ["--d" as string]: `${i * .1}s` }} className="relative dds-card-dark p-6 text-center md:text-left">
                <div className="relative z-10 mx-auto md:mx-0 grid place-items-center w-[60px] h-[60px] rounded-2xl bg-navy-900 border border-white/10 text-[#8fd8ff] shadow-[0_10px_30px_-10px_#399cff88]">{s.icon}</div>
                <p className="mt-5 text-xs font-bold tracking-[.18em] text-brand-300">PASSO {s.n}</p>
                <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-white">{s.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#a7b7d1]">{s.d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Recursos */}
        <section id="recursos" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <SectionTitle eyebrow="Recursos" title={<>Uma placa. <span className="font-serif italic font-normal text-brand-300">Muito mais</span> que um QR Code.</>} />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature className="lg:col-span-2" icon={<BarChart3 size={20} />} title="Estatísticas da placa" text="Veja quantas pessoas acessaram, em que dia e se foi pelo QR Code ou pelo NFC.">
              <MiniChart />
            </Feature>
            <Feature icon={<Cake size={20} />} title="Aniversariantes do mês" text="Quem deixou o telefone recebe seu parabéns pelo WhatsApp, com a mensagem pronta." />
            <Feature icon={<Link2 size={20} />} title="Troque o link quando quiser" text="A placa continua a mesma. Você muda para onde ela leva, sem reimprimir nada." />
            <Feature icon={<FileSpreadsheet size={20} />} title="Contatos em Excel e PDF" text="Exporte a lista de telefones dos seus clientes com um toque." />
            <Feature icon={<QrCode size={20} />} title="QR Code + NFC" text="Funciona com a câmera ou aproximando o celular, em iPhone e Android." />
          </div>
        </section>

        {/* Oferta para quem ainda não tem a placa */}
        <section id="quero" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div data-reveal className="dds-spectrum-border rounded-[32px]">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#10244f] via-navy-900 to-navy-950 p-7 sm:p-10 lg:p-14 grid lg:grid-cols-[1.15fr_.85fr] gap-10 lg:gap-14 items-center">
              <div aria-hidden="true" className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-[radial-gradient(closest-side,#399cff40,transparent)]" />
              <div className="relative min-w-0">
                <span className="dds-eyebrow"><Sparkles size={14} className="text-[#66e0ff]" />Ainda não tem a sua placa?</span>
                <h2 className="mt-5 font-display text-[clamp(30px,4.4vw,50px)] font-extrabold leading-[1.05] tracking-[-.04em] text-white">Transforme clientes satisfeitos em <span className="font-serif italic font-normal dds-spectrum-text">avaliações no Google.</span></h2>
                <p className="mt-4 text-[16px] sm:text-[17px] leading-relaxed text-[#a7b7d1] max-w-xl">A placa fica no balcão, na mesa ou na parede. O cliente aproxima o celular e avalia a sua empresa em segundos. Você acompanha tudo pelo sistema.</p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[15px] text-[#d6e3f8]">
                  {["Placa com QR Code e NFC", "Sistema com acessos e contatos", "Aniversariantes para mandar parabéns", "Troca do link sem reimprimir", "Mini site da empresa (opcional)", "Funciona em iPhone e Android"].map(t => (
                    <li key={t} className="flex items-start gap-2.5"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#66e0ff]" />{t}</li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
                  <a ref={offerCta} href={wa(MSG_PLACA)} target="_blank" rel="noopener noreferrer" className="dds-btn dds-btn-whats dds-btn-lg !whitespace-normal text-center"><MessageCircle size={20} /> Pedir orçamento sem compromisso</a>
                  <span className="text-sm text-[#8b9bb8]">Resposta pelo WhatsApp<br className="hidden sm:block" /> <strong className="font-semibold text-[#cfe0fb]">{WHATS_LABEL}</strong></span>
                </div>
              </div>
              <div className="relative mx-auto w-full max-w-[300px] lg:max-w-[340px]" aria-hidden="true">
                <div className="dds-stage dds-float">
                  <Tilt base={{ x: 8, y: -14 }}><div className="dds-plaque-edge" /><Plaque name="Sua empresa" /></Tilt>
                </div>
                <div className="dds-chip-float -left-3 sm:-left-10 top-[14%]" style={{ animationDelay: "-2s" }}>
                  <span className="grid place-items-center w-8 h-8 rounded-xl bg-emerald-400/15 text-emerald-300"><MessageCircle size={16} /></span>
                  <span>Orçamento<small>sem compromisso</small></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Serviços da DDS Inovação */}
        <section id="servicos" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <SectionTitle eyebrow="Mais da DDS Inovação" title={<>Resolvemos as <span className="font-serif italic font-normal text-brand-300">suas dores.</span></>} />
          <p data-reveal className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#a7b7d1]">Do site ao vídeo para as redes: soluções digitais para a sua empresa aparecer mais e atender melhor.</p>

          <div id="minisite" data-reveal className="scroll-mt-24 mt-10 relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 p-7 sm:p-10 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="dds-eyebrow"><Smartphone size={14} className="text-[#66e0ff]" />Mini site para empresas</span>
              <h3 className="mt-5 font-display text-[clamp(26px,3.6vw,40px)] font-extrabold leading-[1.05] tracking-[-.04em] text-white">Sua empresa. <span className="font-serif italic font-normal dds-spectrum-text">Seu mini site.</span></h3>
              <p className="mt-4 text-[#a7b7d1] text-[16px] leading-relaxed max-w-md">Página pronta com fotos, serviços, WhatsApp e redes sociais, publicada em <strong className="text-white font-semibold">ddsinovacao.com.br/suaempresa</strong>. São 9 modelos com efeitos 3D.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/demo" {...intent(prefetch.demo)} className="dds-btn dds-btn-glow">Ver os 9 modelos <ArrowUpRight size={18} /></Link>
                <a href={wa(msgServico("um mini site para a minha empresa"))} target="_blank" rel="noopener noreferrer" className="dds-btn dds-btn-ghost-dark"><MessageCircle size={17} /> Pedir orçamento</a>
              </div>
            </div>
            <MiniPhones />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Service icon={<MonitorSmartphone size={20} />} title="Sites e landing pages" text="Páginas rápidas e bonitas, feitas para transformar visitas em contatos no WhatsApp." msg={msgServico("um site ou landing page")} />
            <Service icon={<Workflow size={20} />} title="Sistemas sob medida" text="Controles, painéis e automações do jeito que a sua empresa trabalha." msg={msgServico("um sistema sob medida")} />
            <Service icon={<Palette size={20} />} title="Identidade visual e design" text="Logo, cores e peças que deixam a sua marca profissional e lembrada." msg={msgServico("identidade visual e design")} />
            <Service icon={<Camera size={20} />} title="Filmagens com drone" text="Imagens aéreas que mostram o seu espaço de um jeito que impressiona." msg={msgServico("filmagem com drone")} />
            <Service icon={<Clapperboard size={20} />} title="Vídeos curtos com IA" text="Vídeos para as redes, com apresentadores criados por IA divulgando o seu negócio." msg={msgServico("vídeos curtos com IA para divulgar meu negócio")} />
            <Service icon={<Handshake size={20} />} title="E muito mais" text="Tem outro desafio? Conte pra gente e encontramos a solução." msg="Olá! Vim pelo site da DDS Avaliações e quero conversar sobre um projeto." cta="Conversar no WhatsApp" dashed />
          </div>
        </section>

        {/* Já tem a placa */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-16 lg:pb-24">
          <SectionTitle eyebrow="Já tem a sua placa?" title={<>Tudo em um <span className="font-serif italic font-normal text-brand-300">só lugar.</span></>} />
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <QuickTile to="/cadastrar" load={prefetch.ativar} icon={<Zap size={20} />} title="Ativar placa" text="Leva 2 minutos" />
            <QuickTile to="/sistema" load={prefetch.sistema} icon={<LayoutDashboard size={20} />} title="Meu sistema" text="Acessos e contatos" />
            <QuickTile to="/editar" icon={<Link2 size={20} />} title="Trocar link" text="Mude o destino" />
            <QuickTile to="/recuperar" icon={<KeyRound size={20} />} title="Recuperar código" text="Esqueceu? A gente acha" />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between text-sm text-[#8b9bb8]">
          <div className="space-y-2">
            <BrandMark />
            <p>Placas de avaliação com QR Code e NFC.</p>
          </div>
          <div className="flex flex-col sm:items-end gap-1.5">
            <a href={wa(MSG_PLACA)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#cfe0fb] hover:text-white transition"><MessageCircle size={14} className="text-emerald-300" /> WhatsApp {WHATS_LABEL}</a>
            <a href="https://www.ddsinovacao.com.br/" className="inline-flex items-center gap-1.5 text-[#cfe0fb] hover:text-white transition">Uma solução DDS Inovação <ArrowUpRight size={14} /></a>
            <p>© {year} DDS Inovação. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <a
        href={wa(MSG_PLACA)} target="_blank" rel="noopener noreferrer"
        aria-label="Pedir orçamento pelo WhatsApp" aria-hidden={!showFloat} tabIndex={showFloat ? 0 : -1}
        className={`fixed z-40 right-4 bottom-4 sm:right-6 sm:bottom-6 dds-btn dds-btn-whats rounded-full shadow-[0_16px_40px_-12px_#12a150] transition-all duration-500 ${showFloat ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}
      >
        <MessageCircle size={20} /> <span className="hidden sm:inline">Pedir orçamento</span><span className="sm:hidden">Orçamento</span>
      </a>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
  return (
    <div data-reveal className="max-w-2xl">
      <p className="text-xs font-bold tracking-[.2em] uppercase text-[#66e0ff]">{eyebrow}</p>
      <h2 className="mt-3 font-display text-[clamp(30px,4.6vw,50px)] font-extrabold leading-[1.05] tracking-[-.04em] text-white">{title}</h2>
    </div>
  );
}

function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[460px] aspect-[1/1.05] dds-rise" style={{ ["--d" as string]: ".2s" }} aria-hidden="true">
      <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,#399cff55,transparent)]" />
      <div className="absolute inset-[3%] rounded-full border border-white/[.07]" />
      <div className="absolute inset-[16%] rounded-full border border-dashed border-white/[.08] animate-[dds-rot_60s_linear_infinite]" />

      <div className="dds-stage absolute left-[4%] top-[2%] w-[58%] dds-float">
        <Tilt>
          <div className="dds-plaque-edge" />
          <Plaque />
        </Tilt>
      </div>

      <div className="absolute right-[2%] bottom-[2%] w-[44%] dds-float" style={{ animationDelay: "-3s" }}>
        <div className="dds-phone rotate-[6deg]">
          <div className="dds-phone-screen aspect-[9/17] px-[9%] pt-[22%] pb-[10%] flex flex-col">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-bold text-white">SE</span>
              <div className="min-w-0"><p className="text-[10px] font-bold text-ink leading-tight truncate">Sua empresa</p><p className="text-[8px] text-ink-muted leading-tight">Avaliar no Google</p></div>
            </div>
            <p className="mt-[14%] text-[10px] font-semibold text-ink">Como foi sua experiência?</p>
            <Stars size={17} twinkle className="mt-2" />
            <div className="mt-[12%] space-y-1.5">
              <div className="h-1.5 rounded-full bg-[#e8edf5] w-full" /><div className="h-1.5 rounded-full bg-[#e8edf5] w-[85%]" /><div className="h-1.5 rounded-full bg-[#e8edf5] w-[60%]" />
            </div>
            <div className="mt-auto rounded-full bg-brand-500 text-white text-[9px] font-bold text-center py-1.5">Publicar</div>
          </div>
        </div>
      </div>

      <div className="dds-chip-float right-[0%] top-[8%]" style={{ animationDelay: "-1s" }}>
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-amber-400/15 text-amber-300"><Star size={16} fill="currentColor" strokeWidth={0} /></span>
        <span>+1 avaliação<small>5 estrelas · agora</small></span>
      </div>
      <div className="dds-chip-float left-[-2%] bottom-[3%]" style={{ animationDelay: "-4s" }}>
        <span className="grid place-items-center w-8 h-8 rounded-xl bg-brand-400/15 text-[#66e0ff]"><Nfc size={16} /></span>
        <span>Acesso via NFC<small>registrado no seu sistema</small></span>
      </div>
    </div>
  );
}

function Feature({ icon, title, text, children, className = "" }: { icon: ReactNode; title: string; text: string; children?: ReactNode; className?: string }) {
  return (
    <article data-reveal onPointerMove={spotMove} className={`dds-spot dds-card-dark p-6 transition-colors hover:border-white/20 ${className}`}>
      <div className={children ? "grid sm:grid-cols-[1fr_1.1fr] gap-6 items-center" : ""}>
        <div>
          <span className="dds-icon-tile dark">{icon}</span>
          <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-white">{title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[#a7b7d1]">{text}</p>
        </div>
        {children}
      </div>
    </article>
  );
}

function MiniChart() {
  const bars = [38, 54, 46, 72, 60, 88, 66];
  const dias = ["S", "T", "Q", "Q", "S", "S", "D"];
  return (
    <div className="rounded-2xl bg-navy-950/60 border border-white/[.07] p-4" aria-hidden="true">
      <div className="flex items-center justify-between text-[11px] text-[#a7b7d1]">
        <span>Acessos da semana</span>
        <span className="flex items-center gap-3"><span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-brand-400" />QR</span><span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-[#8b7bff]" />NFC</span></span>
      </div>
      <div className="mt-3 h-28 flex items-end gap-2.5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex flex-col justify-end h-24 rounded-md overflow-hidden">
              <div className="dds-bar w-full rounded-t-md bg-gradient-to-t from-[#8b7bff] to-[#a99dff]" style={{ height: `${h * .35}%`, ["--d" as string]: `${i * .06}s` }} />
              <div className="dds-bar w-full bg-gradient-to-t from-brand-500 to-brand-400" style={{ height: `${h * .65}%`, ["--d" as string]: `${i * .06 + .1}s` }} />
            </div>
            <span className="text-[10px] text-[#7d8eac]">{dias[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniPhones() {
  const phones = [
    { name: "Brasa", niche: "Gastronomia", bg: "linear-gradient(160deg,#2a0f08,#7a2410 55%,#e2541c)", ink: "#fff3e6", btn: "#ff7a2f", rot: "-8deg", y: "18px" },
    { name: "Aura", niche: "Beleza e estética", bg: "linear-gradient(160deg,#fff4f7,#f6d9e3 60%,#e9b8c9)", ink: "#4a2333", btn: "#b4577a", rot: "0deg", y: "0px" },
    { name: "Navalha", niche: "Barbearias", bg: "linear-gradient(160deg,#0d1117,#1b2333 60%,#2b3a55)", ink: "#f2f4f8", btn: "#d63b3b", rot: "8deg", y: "18px" },
  ];
  return (
    <div className="flex justify-center items-end gap-3 sm:gap-5" aria-hidden="true">
      {phones.map((p, i) => (
        <div key={p.name} data-reveal style={{ ["--d" as string]: `${i * .12}s` }} className="w-[30%] max-w-[150px]">
          <div className="dds-phone transition-transform duration-500 hover:-translate-y-2" style={{ transform: `rotate(${p.rot}) translateY(${p.y})` }}>
            <div className="dds-phone-screen aspect-[9/18] flex flex-col justify-end p-[12%]" style={{ background: p.bg, color: p.ink }}>
              <p className="text-[7px] font-bold tracking-[.06em] opacity-70 uppercase truncate">{p.niche}</p>
              <p className="font-display font-extrabold text-[clamp(14px,2vw,20px)] leading-none mt-1">{p.name}</p>
              <div className="mt-2 space-y-1"><div className="h-1 rounded-full opacity-30 bg-current" /><div className="h-1 w-2/3 rounded-full opacity-30 bg-current" /></div>
              <div className="mt-3 rounded-full text-[8px] font-bold text-center py-1.5 text-white" style={{ background: p.btn }}>WhatsApp</div>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-[#a7b7d1]">{p.name}</p>
        </div>
      ))}
    </div>
  );
}

function Service({ icon, title, text, msg, cta = "Pedir orçamento", dashed = false }: { icon: ReactNode; title: string; text: string; msg: string; cta?: string; dashed?: boolean }) {
  return (
    <article data-reveal onPointerMove={spotMove} className={`dds-spot dds-card-dark p-6 flex flex-col transition-colors hover:border-white/20 ${dashed ? "!border-dashed !border-white/20 !bg-transparent" : ""}`}>
      <span className="dds-icon-tile dark">{icon}</span>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-white">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[#a7b7d1] flex-1">{text}</p>
      <a href={wa(msg)} target="_blank" rel="noopener noreferrer" className="group mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#66e0ff] hover:text-white transition">
        <MessageCircle size={16} /> {cta} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </a>
    </article>
  );
}

function QuickTile({ to, icon, title, text, load }: { to: string; icon: ReactNode; title: string; text: string; load?: () => Promise<unknown> }) {
  return (
    <Link to={to} {...(load ? intent(load) : {})} data-reveal onPointerMove={spotMove} className="group dds-spot dds-card-dark p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <span className="dds-icon-tile dark">{icon}</span>
      <span>
        <span className="flex items-center justify-between gap-2 font-display font-bold text-white text-[15px] sm:text-base">{title}<ArrowUpRight size={16} className="text-[#66e0ff] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
        <span className="block mt-1 text-[13px] text-[#a7b7d1]">{text}</span>
      </span>
    </Link>
  );
}
