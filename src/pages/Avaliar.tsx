import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Cake, Gift, Phone, Star } from "lucide-react";
import { linkDaPropriaPlaca } from "../lib/linkGuard";
import { Stars } from "../components/ui/Fx";

// Tela intermediária entre o escaneamento (QR/NFC) e o link real do Google.
// O acesso já foi contabilizado pelo scan-redirect antes de chegar aqui —
// esta tela só existe pra, opcionalmente, pedir telefone e aniversário da
// pessoa antes de mandar ela pra avaliação, com um "presente" como incentivo.
// Nunca trava: o botão principal e "Pular" levam os dois pro mesmo lugar,
// então ninguém deixa de avaliar por causa disso.
// Visual só em CSS (sem banco nem bibliotecas pesadas): abre rápido no celular.

// Destino é uma página do Google (avaliação, Maps ou link curto do perfil)?
function destinoGoogle(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(^|\.)google\.[a-z.]+$/.test(host) || host === "g.page" || host === "maps.app.goo.gl" || host === "g.co";
  } catch {
    return false;
  }
}

// Formata enquanto digita: só números, no formato DD/MM/AAAA.
// Texto simples em vez de <input type="date"> de propósito — abrir o
// calendário nativo é um passo a mais que faz gente desistir no meio.
function formatarDigitandoData(valorAtual: string, novoValor: string): string {
  const digitos = novoValor.replace(/\D/g, "").slice(0, 8);
  let formatado = digitos;
  if (digitos.length > 4) {
    formatado = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
  } else if (digitos.length > 2) {
    formatado = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }
  return formatado;
}

// Converte "DD/MM/AAAA" digitado pelo usuário em "AAAA-MM-DD" (ISO) pro
// backend. Retorna null se a data estiver incompleta ou inválida.
function dataBrParaIso(valor: string): string | null {
  const m = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const d = Number(dia);
  const mo = Number(mes);
  const y = Number(ano);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const data = new Date(Date.UTC(y, mo - 1, d));
  if (data.getUTCFullYear() !== y || data.getUTCMonth() !== mo - 1 || data.getUTCDate() !== d) {
    return null;
  }
  if (data.getTime() > Date.now()) return null;
  return `${ano}-${mes}-${dia}`;
}

const CONFETES = [
  { l: "8%", c: "#399cff", d: "0s", s: "7s" }, { l: "22%", c: "#fbbf24", d: "-2s", s: "9s" }, { l: "38%", c: "#8b7bff", d: "-5s", s: "8s" },
  { l: "61%", c: "#66e0ff", d: "-1s", s: "10s" }, { l: "76%", c: "#ff7ab6", d: "-4s", s: "7.5s" }, { l: "90%", c: "#fbbf24", d: "-6s", s: "9.5s" },
];

export default function Avaliar() {
  const [params] = useSearchParams();
  const slug = params.get("slug") ?? "";
  const dest = params.get("dest") ?? "";
  const empresa = params.get("empresa") ?? "";
  // modo=toque: o dono da placa escolheu não pedir telefone e aniversário. Só no iPhone o cliente
  // passa por aqui (nos outros aparelhos vai direto): um toque de verdade no link deixa o iPhone
  // abrir o app do Google Maps, onde ele já está logado.
  const modoToque = params.get("modo") === "toque";

  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [indo, setIndo] = useState(false);

  // Só dispara o envio do lead — a navegação em si fica por conta do próprio
  // <a href={dest}> (um toque de verdade num link). Isso importa no iPhone:
  // um redirecionamento por JavaScript não deixa o sistema entregar o link
  // pro app do Google Maps (onde o cliente já está logado), e o link acaba
  // abrindo no navegador, que pede login no Google.
  function enviarLead() {
    if (indo) return;
    setIndo(true);

    if (telefone.trim() && slug) {
      // Best-effort: dispara e não espera resposta, pra não atrasar a
      // navegação. `keepalive` garante que o pedido continua indo mesmo com
      // a página saindo do ar logo em seguida.
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captar-lead`;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          slug,
          telefone: telefone.trim(),
          dataNascimento: dataBrParaIso(dataNascimento.trim()),
        }),
      }).catch(() => {});
    }
  }

  // Destino apontando para a própria plaquinha: em vez de voltar para esta tela sem fim,
  // avisa que o link precisa ser corrigido.
  const destErrado = linkDaPropriaPlaca(dest);
  if (!dest || destErrado) {
    return (
      <div className="min-h-[100dvh] grid place-items-center px-4 bg-gradient-to-b from-[#eef5ff] to-white">
        <div className="dds-card dds-card-pad max-w-sm w-full text-center">
          <span className="dds-icon-tile mx-auto"><Star size={20} /></span>
          <p className="mt-3 font-display font-bold text-lg">{destErrado ? "Esta plaquinha está sendo configurada." : "Link inválido ou expirado."}</p>
          <p className="mt-1 text-sm text-ink-muted">{destErrado ? "O link de avaliação dela precisa ser corrigido. Avise a empresa, por favor." : "Tente escanear a placa de novo."}</p>
        </div>
      </div>
    );
  }

  const fundo = (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-[radial-gradient(closest-side,#399cff40,transparent)]" />
      <div className="absolute -top-20 -right-28 w-[380px] h-[380px] rounded-full bg-[radial-gradient(closest-side,#8b7bff30,transparent)]" />
      <div className="absolute bottom-[-180px] left-1/2 -translate-x-1/2 w-[520px] h-[360px] rounded-full bg-[radial-gradient(closest-side,#fbbf2426,transparent)]" />
      <div className="dds-confetti absolute inset-0">
        {CONFETES.map((c, i) => <i key={i} style={{ left: c.l, top: "-20px", background: c.c, animationDelay: c.d, animationDuration: c.s }} />)}
      </div>
    </div>
  );
  const pagina = "relative min-h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#eaf3ff_0%,#f7faff_42%,#ffffff_100%)] flex items-center justify-center px-4 py-8";

  if (modoToque) {
    const google = destinoGoogle(dest);
    return (
      <div className={pagina}>
        {fundo}
        <main className="relative w-full max-w-[400px] dds-rise">
          <div className="dds-card overflow-hidden shadow-[0_30px_70px_-30px_#1a6fe066]">
            <div className="relative px-6 pt-9 pb-7 text-center bg-[radial-gradient(120%_90%_at_50%_0%,#e3efff_0%,#ffffff_70%)]">
              <div className="relative mx-auto w-[84px] h-[84px]">
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#fde68a] via-[#fbbf24] to-[#f59e0b] rotate-6 opacity-35" />
                <div className="relative grid place-items-center w-full h-full rounded-[28px] bg-gradient-to-br from-[#399cff] to-[#1a6fe0] text-white shadow-[0_18px_36px_-14px_#1a6fe0]">
                  <Star size={38} fill="currentColor" strokeWidth={0} className="text-amber-300" />
                </div>
              </div>
              <Stars size={18} twinkle className="mt-5" />
              <h1 className="mt-3 font-display text-[24px] leading-tight font-extrabold tracking-[-.03em] text-ink">
                {empresa ? <>Como foi na {empresa}?</> : "Como foi a sua experiência?"}
              </h1>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">Sua avaliação ajuda muito. Leva menos de um minuto.</p>
              <a href={dest} className="dds-btn dds-btn-primary dds-btn-lg dds-btn-block !mt-6 text-[17px]">
                <Star size={19} fill="currentColor" strokeWidth={0} className="text-amber-300" /> {google ? "Avaliar no Google" : "Continuar"} <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={pagina}>
      {fundo}

      <main className="relative w-full max-w-[400px] dds-rise">
        <div className="dds-card overflow-hidden shadow-[0_30px_70px_-30px_#1a6fe066]">
          <div className="relative px-6 pt-8 pb-6 text-center bg-[radial-gradient(120%_90%_at_50%_0%,#e3efff_0%,#ffffff_70%)]">
            <div className="relative mx-auto w-[84px] h-[84px]">
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#66e0ff] via-[#399cff] to-[#8b7bff] rotate-6 opacity-30" />
              <div className="relative grid place-items-center w-full h-full rounded-[28px] bg-gradient-to-br from-[#399cff] to-[#1a6fe0] text-white shadow-[0_18px_36px_-14px_#1a6fe0]">
                <Gift size={38} className="dds-gift" />
              </div>
            </div>
            <Stars size={18} twinkle className="mt-5" />
            <h1 className="mt-3 font-display text-[23px] leading-tight font-extrabold tracking-[-.03em] text-ink">
              {empresa ? `A ${empresa} quer lembrar de você!` : "Quer ser lembrado no seu aniversário?"}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
              Deixe seu telefone e a data do seu aniversário e a gente te manda um parabéns no seu
              mês — quem sabe até com uma surpresa 🎁
            </p>
          </div>

          <div className="px-6 pb-7 space-y-3.5">
            <label className="block">
              <span className="dds-label">Seu telefone</span>
              <span className="relative block">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d9bb5]" aria-hidden="true" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="dds-input pl-11 text-[17px]"
                />
              </span>
            </label>
            <label className="block">
              <span className="dds-label">Sua data de aniversário (DD/MM/AAAA)</span>
              <span className="relative block">
                <Cake size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d9bb5]" aria-hidden="true" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(formatarDigitandoData(dataNascimento, e.target.value))}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className="dds-input pl-11 text-[17px]"
                />
              </span>
            </label>

            <a
              href={dest}
              onClick={enviarLead}
              className="dds-btn dds-btn-primary dds-btn-lg dds-btn-block !mt-5 text-[17px]"
            >
              <Star size={19} fill="currentColor" strokeWidth={0} className="text-amber-300" /> Avaliar a empresa
            </a>

            {/* Botão discreto (cinza, menor que o principal), mas fácil de tocar: ninguém fica preso nesta tela. */}
            <a href={dest} className="!mt-3 mx-auto flex w-fit items-center gap-1.5 rounded-full border border-[#e3e9f2] bg-[#f3f6fb] whitespace-nowrap px-4 py-2.5 text-[13.5px] font-medium text-[#6b7891] transition hover:bg-[#e9eef6] hover:text-ink active:scale-[.98]">
              Pular e avaliar direto <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
