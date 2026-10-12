import { ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

// Peças visuais compartilhadas: fundo aurora, marca, estrelas, números animados,
// entrada ao rolar e inclinação 3D que segue o dedo/cursor.

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Aurora({ calm = false }: { calm?: boolean }) {
  return <div className={`dds-aurora ${calm ? "calm" : ""}`} aria-hidden="true"><i /><i /><i /></div>;
}

export function BrandMark({ dark = true, to = "/", compact = false }: { dark?: boolean; to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="DDS Avaliações · início">
      <span className="relative grid place-items-center w-9 h-9 rounded-xl bg-navy-900 shadow-[0_0_0_1px_#ffffff1f_inset,0_8px_20px_-8px_#399cff99] transition-transform duration-500 group-hover:rotate-[-8deg]">
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
          <defs><linearGradient id="dds-mark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#66e0ff" /><stop offset=".6" stopColor="#399cff" /><stop offset="1" stopColor="#8b7bff" /></linearGradient></defs>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="url(#dds-mark)" />
        </svg>
      </span>
      {!compact && (
        <span className={`font-display font-extrabold text-[17px] tracking-tight leading-none whitespace-nowrap ${dark ? "text-white" : "text-ink"}`}>
          DDS <span className={`font-serif italic font-normal text-[19px] ${dark ? "text-brand-300" : "text-brand-600"}`}>Avaliações</span>
        </span>
      )}
    </Link>
  );
}

export function Stars({ size = 16, twinkle = false, className = "" }: { size?: number; twinkle?: boolean; className?: string }) {
  return (
    <span className={`dds-stars ${twinkle ? "twinkle" : ""} ${className}`} aria-label="5 estrelas">
      {[0, 1, 2, 3, 4].map(i => <Star key={i} size={size} fill="currentColor" strokeWidth={0} />)}
    </span>
  );
}

// Número que conta até o valor quando aparece.
export function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(reduceMotion() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduceMotion()) { setShown(value); return; }
    let raf = 0; const start = performance.now(); const a = from.current;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration); const e = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(a + (value - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="tabular">{shown.toLocaleString("pt-BR")}</span>;
}

// Marca [data-reveal] dentro do container como visíveis ao entrarem na tela.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window) || reduceMotion()) { items.forEach(el => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

// Inclinação 3D suave seguindo o cursor (no celular, segue o toque).
export function Tilt({ children, className = "", max = 14, base = { x: 8, y: -16 } }: { children: ReactNode; className?: string; max?: number; base?: { x: number; y: number } }) {
  const ref = useRef<HTMLDivElement>(null);
  function move(e: React.PointerEvent) {
    const el = ref.current; if (!el || reduceMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
    el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * max).toFixed(2)}deg`);
    el.style.setProperty("--shine", `${(px * 120).toFixed(0)}%`);
  }
  function leave() {
    const el = ref.current; if (!el) return;
    el.style.setProperty("--ry", `${base.y}deg`); el.style.setProperty("--rx", `${base.x}deg`); el.style.setProperty("--shine", "-60%");
  }
  return <div ref={ref} className={`dds-tilt ${className}`} onPointerMove={move} onPointerLeave={leave} style={{ ["--rx" as string]: `${base.x}deg`, ["--ry" as string]: `${base.y}deg` }}>{children}</div>;
}

// Brilho que acompanha o cursor dentro do cartão.
export function spotMove(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget; const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function Spinner() { return <span className="dds-spinner" aria-hidden="true" />; }
