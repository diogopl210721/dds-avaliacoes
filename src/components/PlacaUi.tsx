import { ReactNode, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, Copy, Lock } from "lucide-react";
import { Aurora, BrandMark, Spinner, Tilt } from "./ui/Fx";
import Plaque from "./ui/Plaque";

// Peças compartilhadas pelas telas públicas da placa (ativar, trocar link,
// recuperar código, meu sistema): moldura, menu de abas, campo e botão.

const ABAS = [
  { to: "/ativar", rotulo: "Ativar" },
  { to: "/editar", rotulo: "Trocar link" },
  { to: "/recuperar", rotulo: "Recuperar" },
  { to: "/sistema", rotulo: "Meu sistema" },
];

export function AuthShell({ eyebrow, title, text, points = [], children }: {
  eyebrow: string; title: ReactNode; text?: string; points?: string[]; children: ReactNode;
}) {
  return (
    <div className="dds-dark min-h-[100dvh] overflow-x-clip">
      <Aurora calm />
      <header className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <BrandMark />
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#a7b7d1] hover:text-white transition"><ArrowLeft size={16} /> Início</Link>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-12 lg:pt-10 grid lg:grid-cols-[1fr_minmax(0,500px)] gap-10 xl:gap-20 items-start">
        <aside className="hidden lg:block pt-6">
          <p className="dds-eyebrow dds-rise"><span className="dds-pulse-dot" />{eyebrow}</p>
          <h1 className="mt-6 font-display text-[clamp(38px,4.2vw,54px)] font-extrabold leading-[1.04] tracking-[-.045em] text-white dds-rise" style={{ ["--d" as string]: ".06s" }}>{title}</h1>
          {text && <p className="mt-5 text-[17px] leading-relaxed text-[#a7b7d1] max-w-md dds-rise" style={{ ["--d" as string]: ".12s" }}>{text}</p>}
          {points.length > 0 && <ul className="mt-7 space-y-3 dds-rise" style={{ ["--d" as string]: ".18s" }}>
            {points.map(p => <li key={p} className="flex items-center gap-3 text-[15px] text-[#d6e3f8]"><CheckCircle2 size={18} className="text-[#66e0ff] shrink-0" />{p}</li>)}
          </ul>}
          <div className="mt-12 w-[210px] dds-stage dds-float dds-rise" style={{ ["--d" as string]: ".24s" }} aria-hidden="true">
            <Tilt base={{ x: 10, y: 18 }}><div className="dds-plaque-edge" /><Plaque /></Tilt>
          </div>
        </aside>
        <div className="w-full max-w-[500px] mx-auto lg:mx-0 dds-rise" style={{ ["--d" as string]: ".08s" }}>
          <div className="dds-card p-5 sm:p-7 text-ink shadow-[0_40px_80px_-40px_#000]">{children}</div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#7d8eac]"><Lock size={12} /> Conexão segura · DDS Inovação</p>
        </div>
      </main>
    </div>
  );
}

export function MenuPlaca() {
  return (
    <nav className="dds-tabs mb-6" aria-label="Opções da placa">
      {ABAS.map((a) => (
        <NavLink key={a.to} to={a.to} className={({ isActive }) => (isActive ? "active" : "")}>{a.rotulo}</NavLink>
      ))}
    </nav>
  );
}

export function TituloForm({ icon, titulo, texto }: { icon?: ReactNode; titulo: ReactNode; texto?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start gap-3.5">
      {icon && <span className="dds-icon-tile shrink-0">{icon}</span>}
      <div>
        <h1 className="font-display text-[22px] sm:text-2xl font-extrabold tracking-[-.03em] leading-tight">{titulo}</h1>
        {texto && <p className="mt-1 text-sm text-ink-muted leading-relaxed">{texto}</p>}
      </div>
    </div>
  );
}

export function Campo({
  label,
  value,
  onChange,
  placeholder,
  ajuda,
  readOnly = false,
  inputMode,
  maxLength,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  ajuda?: string;
  readOnly?: boolean;
  inputMode?: "numeric" | "text" | "url";
  maxLength?: number;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="dds-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`dds-input ${readOnly ? "font-mono" : ""} ${maxLength === 4 && inputMode === "numeric" ? "tracking-[.4em] font-semibold" : ""}`}
      />
      {ajuda && <span className="dds-help">{ajuda}</span>}
    </label>
  );
}

export function BotaoEnviar({
  children,
  carregando,
}: {
  children: React.ReactNode;
  carregando: boolean;
}) {
  return (
    <button type="submit" disabled={carregando} className="dds-btn dds-btn-primary dds-btn-lg dds-btn-block mt-2">
      {carregando ? <><Spinner /> Aguarde...</> : children}
    </button>
  );
}

export function Erro({ children }: { children: ReactNode }) {
  return <p className="dds-error dds-fade" role="alert">{children}</p>;
}

// Só aceita números, até 4 (a senha da placa).
export function somente4Digitos(v: string): string {
  return v.replace(/\D/g, "").slice(0, 4);
}

export function CopiarBotao({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }).catch(() => {})}
      className="dds-btn dds-btn-outline dds-btn-sm"
    >
      {ok ? <><Check size={14} className="text-emerald-600" /> Copiado</> : <><Copy size={14} /> {rotulo.replace(/^📋\s*/, "")}</>}
    </button>
  );
}

// Caixa destacada com o código da placa.
export function CodigoPlaca({ codigo, rotulo = "Código da placa", grande = false }: { codigo: string; rotulo?: string; grande?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe5f4] bg-gradient-to-br from-[#f7faff] to-[#eef5ff] px-4 py-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink-muted">{rotulo}</div>
        <div className={`font-mono font-bold tracking-wide text-ink ${grande ? "text-2xl" : "text-lg"}`}>{codigo}</div>
      </div>
      <CopiarBotao texto={codigo} rotulo="Copiar" />
    </div>
  );
}
