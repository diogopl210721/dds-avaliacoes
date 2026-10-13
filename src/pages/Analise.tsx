import { lazy, ReactNode, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BarChart3, Cake, ChevronDown, FileSpreadsheet, FileText, LayoutDashboard, Link2, LogOut,
  MessageCircle, Nfc, Phone, QrCode, TrendingUp, Users,
} from "lucide-react";
import PlateMiniOffer, { PlateMiniAccess } from "../components/PlateMiniOffer";
import { callFunction } from "../lib/supabaseClient";
import { AuthShell, MenuPlaca, Campo, BotaoEnviar, Erro, TituloForm } from "../components/PlacaUi";
import { Aurora, BrandMark, CountUp, Spinner, spotMove } from "../components/ui/Fx";
import { ScreenLoading } from "../components/ui/Screen";
// ExcelJS e jsPDF são pesados — importados só na hora do clique (ver
// exportarExcel/exportarPdf) pra não engordar o carregamento das outras
// telas (Home, Ativar, Avaliar), que precisam ser rápidas no celular.
const MiniStudio = lazy(() => import("./MiniStudio"));

const COR_MARCA = "1A6FE0"; // brand-500, sem o # (formato ARGB do ExcelJS)
const COR_MARCA_RGB: [number, number, number] = [26, 111, 224];
const COR_FAIXA_RGB: [number, number, number] = [238, 246, 255]; // brand-50, pro zebrado

type Lead = { telefone: string; created_at: string; data_nascimento: string | null };

type Resultado = {
  codigo: string;
  empresa: string | null;
  status: string;
  totalAcessos: number;
  porDia: Record<string, number>;
  porMes: Record<string, number>;
  porAno: Record<string, number>;
  porOrigem: Record<string, number>;
  telefones: Lead[];
};

// Converte um telefone digitado de qualquer jeito num link wa.me válido,
// assumindo Brasil quando não vier o código do país. Com `mensagem`, o
// WhatsApp já abre com o texto pronto (a pessoa ainda pode editar antes de
// enviar).
function linkWhatsapp(telefoneBruto: string, mensagem?: string): string {
  let digitos = telefoneBruto.replace(/\D/g, "");
  digitos = digitos.replace(/^0+/, "");
  if (!digitos.startsWith("55") && (digitos.length === 10 || digitos.length === 11)) {
    digitos = "55" + digitos;
  }
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${digitos}${texto}`;
}

// "YYYY-MM-DD" -> "DD/MM", sem depender de fuso (new Date() com só a data
// interpreta como UTC e pode voltar um dia, então parseamos na mão).
function formatarDiaMes(dataIso: string): string {
  const [, mes, dia] = dataIso.split("-");
  return `${dia}/${mes}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
// "YYYY-MM" -> "out/2026"
function formatarMes(chave: string): string {
  const [ano, mes] = chave.split("-");
  const i = Number(mes) - 1;
  return MESES[i] ? `${MESES[i]}/${ano}` : chave;
}

function ehAniversarianteDoMes(dataIso: string | null, mesAtual: number): boolean {
  if (!dataIso) return false;
  const mes = Number(dataIso.split("-")[1]);
  return mes === mesAtual;
}

function mensagemAniversario(empresa: string | null): string {
  const nome = empresa ?? "a gente";
  return `Olá! 🎉 Esse é seu mês de aniversário e a ${nome} não podia deixar de lembrar de você. Feliz aniversário, tudo de bom! Passa aqui pra gente te dar um abraço. 🎂`;
}

const STATUS_LABEL: Record<string, string> = { ATIVA: "Ativa", AGUARDANDO_ATIVACAO: "Aguardando ativação", CRIADA: "Criada", BLOQUEADA: "Bloqueada", DESATIVADA: "Desativada" };

export default function Analise() {
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [telefonesAbertos, setTelefonesAbertos] = useState(false);
  const [exportando, setExportando] = useState<"excel" | "pdf" | null>(null);

  const [miniEditor, setMiniEditor] = useState<PlateMiniAccess | null>(null);

  const mesAtual = new Date().getMonth() + 1;

  async function consultar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const data = await callFunction<Resultado & { error?: string }>(
        "estatisticas-placa",
        { codigo: codigo.trim(), pin: pin.trim() }
      );
      if ((data as any).error) throw new Error((data as any).error);
      setResultado(data);
      setTelefonesAbertos(false);
    } catch (e: any) {
      setErro(e.message ?? "Código ou senha inválidos.");
    } finally {
      setCarregando(false);
    }
  }

  async function exportarExcel() {
    if (!resultado) return;
    setExportando("excel");
    try {
    const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
      import("exceljs"),
      import("file-saver"),
    ]);
    const empresa = resultado.empresa ?? "Sua placa";

    const livro = new ExcelJS.Workbook();
    livro.creator = "DDS Avaliações";
    livro.created = new Date();
    const planilha = livro.addWorksheet("Telefones", {
      views: [{ state: "frozen", ySplit: 6 }],
    });
    planilha.columns = [{ width: 24 }, { width: 16 }, { width: 22 }];

    // Cabeçalho: nome do cliente em destaque, depois o código da placa.
    const linhaTitulo = planilha.addRow([empresa]);
    planilha.mergeCells(`A${linhaTitulo.number}:C${linhaTitulo.number}`);
    linhaTitulo.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    linhaTitulo.height = 26;
    linhaTitulo.alignment = { vertical: "middle" };
    linhaTitulo.eachCell((cel) => {
      cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COR_MARCA}` } };
    });

    const linhaCodigo = planilha.addRow(["Código da placa", resultado.codigo]);
    linhaCodigo.getCell(1).font = { bold: true, color: { argb: "FF6B7280" } };

    planilha.addRow([]);

    const linhaCabecalhoTabela = planilha.addRow(["Telefone", "Aniversário", "Deixado em"]);
    linhaCabecalhoTabela.font = { bold: true, color: { argb: "FFFFFFFF" } };
    linhaCabecalhoTabela.eachCell((cel) => {
      cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COR_MARCA}` } };
      cel.border = { bottom: { style: "thin", color: { argb: "FFD1D5DB" } } };
    });

    resultado.telefones.forEach((l, i) => {
      const linha = planilha.addRow([
        l.telefone,
        l.data_nascimento ? formatarDiaMes(l.data_nascimento) : "—",
        new Date(l.created_at).toLocaleString("pt-BR"),
      ]);
      if (i % 2 === 1) {
        linha.eachCell((cel) => {
          cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF6FF" } };
        });
      }
      linha.eachCell((cel) => {
        cel.border = { bottom: { style: "thin", color: { argb: "FFE5E7EB" } } };
      });
    });

    if (resultado.telefones.length === 0) {
      planilha.addRow(["Nenhum telefone deixado ainda."]).font = { italic: true, color: { argb: "FF9CA3AF" } };
    }

    const buffer = await livro.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `telefones-${resultado.codigo}.xlsx`
    );
    } finally {
      setExportando(null);
    }
  }

  async function exportarPdf() {
    if (!resultado) return;
    setExportando("pdf");
    try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const empresa = resultado.empresa ?? "Sua placa";
    const larguraPagina = 210; // A4 em mm (retrato)

    const doc = new jsPDF();

    // Faixa colorida de cabeçalho com o nome do cliente.
    doc.setFillColor(...COR_MARCA_RGB);
    doc.rect(0, 0, larguraPagina, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(empresa, 14, 18);

    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Código da placa: ${resultado.codigo}`, 14, 38);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 44);

    autoTable(doc, {
      startY: 50,
      head: [["Telefone", "Aniversário", "Deixado em"]],
      body: resultado.telefones.length
        ? resultado.telefones.map((l) => [
            l.telefone,
            l.data_nascimento ? formatarDiaMes(l.data_nascimento) : "—",
            new Date(l.created_at).toLocaleString("pt-BR"),
          ])
        : [["Nenhum telefone deixado ainda.", "", ""]],
      theme: "striped",
      headStyles: { fillColor: COR_MARCA_RGB, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: COR_FAIXA_RGB },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        const paginas = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `DDS Avaliações · página ${paginas}`,
          larguraPagina - 14,
          doc.internal.pageSize.getHeight() - 8,
          { align: "right" }
        );
      },
    });

    doc.save(`telefones-${resultado.codigo}.pdf`);
    } finally {
      setExportando(null);
    }
  }

  if (miniEditor) return <>
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 bg-navy-950 text-white border-b border-white/10">
      <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8fd8ff] hover:text-white" onClick={() => setMiniEditor(null)}><ArrowLeft size={16} /> Voltar ao meu sistema</button>
      <span className="hidden sm:block text-xs text-[#a7b7d1]">Mini site da placa {miniEditor.codigo}</span>
    </div>
    <Suspense fallback={<ScreenLoading light label="Abrindo o estúdio…" />}><MiniStudio plateAccess={miniEditor} /></Suspense>
  </>;

  if (resultado) {
    const ultimosDias = Object.entries(resultado.porDia)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 30);
    const ultimosMeses = Object.entries(resultado.porMes)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 12);
    const anos = Object.entries(resultado.porAno).sort((a, b) => (a[0] < b[0] ? 1 : -1));
    const aniversariantes = resultado.telefones
      .filter((l) => ehAniversarianteDoMes(l.data_nascimento, mesAtual))
      .sort((a, b) => (a.data_nascimento ?? "").localeCompare(b.data_nascimento ?? ""));
    const qr = resultado.porOrigem.QR ?? 0;
    const nfc = resultado.porOrigem.NFC ?? 0;
    const pctQr = qr + nfc > 0 ? Math.round((qr / (qr + nfc)) * 100) : 0;
    const status = STATUS_LABEL[resultado.status] ?? resultado.status;
    const ativa = resultado.status === "ATIVA";

    return (
      <div className="min-h-[100dvh] bg-[#f4f6fb] pb-16">
        <header className="dds-dark overflow-hidden">
          <Aurora calm />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <BrandMark />
            <button onClick={() => setResultado(null)} className="dds-btn dds-btn-ghost-dark dds-btn-sm"><LogOut size={15} /> Sair</button>
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 sm:pb-28 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="dds-rise">
              <p className="text-xs font-bold tracking-[.2em] uppercase text-[#66e0ff] flex items-center gap-2"><LayoutDashboard size={14} /> Meu sistema</p>
              <h1 className="mt-2 font-display text-[clamp(28px,4.5vw,44px)] font-extrabold tracking-[-.04em] leading-[1.05] text-white">{resultado.empresa ?? "Meu sistema"}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="dds-chip bg-white/10 text-[#d6e3f8] font-mono">Código {resultado.codigo}</span>
                <span className={`dds-chip ${ativa ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}><span className={`w-1.5 h-1.5 rounded-full ${ativa ? "bg-emerald-300" : "bg-amber-300"}`} />Status: {status}</span>
              </div>
            </div>
            <Link to={`/editar?codigo=${encodeURIComponent(resultado.codigo)}`} className="dds-btn dds-btn-ghost-dark self-start sm:self-auto dds-rise" style={{ ["--d" as string]: ".1s" }}><Link2 size={16} /> Trocar o link da minha placa</Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 space-y-5 relative">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Kpi icon={<Users size={20} />} label="Total de acessos" value={resultado.totalAcessos} d={0}>
              <div className="mt-4">
                <div className="flex h-2 rounded-full overflow-hidden bg-[#eef2f8]">
                  <div className="dds-hbar bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${pctQr}%` }} />
                  <div className="dds-hbar bg-gradient-to-r from-[#8b7bff] to-[#a99dff]" style={{ width: `${qr + nfc > 0 ? 100 - pctQr : 0}%`, ["--d" as string]: ".15s" }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-muted"><span>QR {pctQr}%</span><span>NFC {qr + nfc > 0 ? 100 - pctQr : 0}%</span></div>
              </div>
            </Kpi>
            <Kpi icon={<QrCode size={20} />} label="Pelo QR Code" value={qr} d={.06} />
            <Kpi icon={<Nfc size={20} />} label="Pelo NFC (aproximação)" value={nfc} d={.12} tint="violet" />
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2" icon={<BarChart3 size={18} />} title="Acessos por dia" subtitle="Últimos 30 dias com registro">
              {ultimosDias.length === 0 ? <SemDados /> : <GraficoDias linhas={[...ultimosDias].reverse()} />}
            </Card>
            <Card icon={<TrendingUp size={18} />} title="Acessos por mês">
              {ultimosMeses.length === 0 ? <SemDados /> : <BarrasLista linhas={ultimosMeses.map(([k, v]) => [formatarMes(k), v])} />}
            </Card>
          </div>

          <PlateMiniOffer codigo={resultado.codigo} senha={pin.trim()} empresa={resultado.empresa} onOpen={setMiniEditor} />

          <div className={`grid gap-5 ${aniversariantes.length > 0 ? "lg:grid-cols-2" : ""}`}>
            {aniversariantes.length > 0 && (
              <section className="relative overflow-hidden rounded-[22px] p-5 sm:p-6 text-white bg-gradient-to-br from-[#1a6fe0] via-[#3b5be0] to-[#7b5cf0] shadow-[0_24px_48px_-24px_#1a6fe0]">
                <div aria-hidden="true" className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
                <div aria-hidden="true" className="absolute right-10 -bottom-16 w-40 h-40 rounded-full bg-white/[.07]" />
                <div className="relative flex items-center gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-2xl bg-white/15"><Cake size={22} className="dds-gift" /></span>
                  <div>
                    <h2 className="font-display text-lg font-extrabold tracking-tight">Aniversariantes do mês ({aniversariantes.length})</h2>
                    <p className="text-[13px] text-white/80">Mande parabéns e aproveite pra divulgar uma promoção. A mensagem já vai pronta, só conferir e enviar.</p>
                  </div>
                </div>
                <ul className="relative mt-4 space-y-2">
                  {aniversariantes.map((l, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5 backdrop-blur-sm">
                      <div>
                        <p className="font-semibold">{l.telefone}</p>
                        <p className="text-xs text-white/75">{l.data_nascimento ? formatarDiaMes(l.data_nascimento) : "—"}</p>
                      </div>
                      <a href={linkWhatsapp(l.telefone, mensagemAniversario(resultado.empresa))} target="_blank" rel="noopener noreferrer" className="dds-btn dds-btn-sm bg-white text-[#1252b0] hover:bg-[#eef6ff]">
                        <MessageCircle size={14} /> Mandar parabéns
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="dds-card dds-card-pad">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  onClick={() => setTelefonesAbertos((v) => !v)}
                  disabled={resultado.telefones.length === 0}
                  className="flex items-center gap-3 text-left disabled:cursor-default"
                  aria-expanded={telefonesAbertos}
                >
                  <span className="dds-icon-tile"><Phone size={18} /></span>
                  <span>
                    <span className="block font-display font-bold text-ink">Telefones de clientes ({resultado.telefones.length})</span>
                    {resultado.telefones.length > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">{telefonesAbertos ? "Ocultar lista" : "Ver lista"}<ChevronDown size={14} className={`transition-transform ${telefonesAbertos ? "rotate-180" : ""}`} /></span>
                    )}
                  </span>
                </button>
                <div className="flex gap-2">
                  <button onClick={exportarExcel} disabled={resultado.telefones.length === 0 || exportando !== null} className="dds-btn dds-btn-outline dds-btn-sm">
                    {exportando === "excel" ? <><Spinner /> Gerando...</> : <><FileSpreadsheet size={15} className="text-emerald-600" /> Exportar Excel</>}
                  </button>
                  <button onClick={exportarPdf} disabled={resultado.telefones.length === 0 || exportando !== null} className="dds-btn dds-btn-outline dds-btn-sm">
                    {exportando === "pdf" ? <><Spinner /> Gerando...</> : <><FileText size={15} className="text-rose-600" /> Exportar PDF</>}
                  </button>
                </div>
              </div>

              {resultado.telefones.length === 0 ? (
                <div className="mt-4"><SemDados texto="Nenhum telefone deixado ainda. Eles aparecem aqui quando um cliente preenche antes de avaliar." /></div>
              ) : (
                telefonesAbertos && (
                  <ul className="mt-4 space-y-2 max-h-[420px] overflow-y-auto dds-scroll pr-1 dds-fade">
                    {resultado.telefones.map((l, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e8edf5] px-3.5 py-2.5 hover:border-[#cddcf2] transition-colors">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{l.telefone}</p>
                          <p className="text-xs text-ink-muted">
                            {l.data_nascimento && <span className="mr-2">🎂 {formatarDiaMes(l.data_nascimento)}</span>}
                            {new Date(l.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <a href={linkWhatsapp(l.telefone)} target="_blank" rel="noopener noreferrer" className="dds-btn dds-btn-whats dds-btn-sm">
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          </div>

          <Card icon={<TrendingUp size={18} />} title="Acessos por ano">
            {anos.length === 0 ? <SemDados /> : <BarrasLista linhas={anos} />}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <AuthShell
      eyebrow="Meu sistema"
      title={<>Tudo o que sua placa gerou, <span className="font-serif italic font-normal dds-spectrum-text">num só lugar.</span></>}
      text="Use o código e a senha da sua placa para acessar estatísticas, contatos e a criação do seu mini site."
      points={["Acessos por dia, mês e ano", "QR Code ou NFC: veja qual seus clientes usam", "Telefones e aniversariantes do mês"]}
    >
      <MenuPlaca />
      <TituloForm icon={<LayoutDashboard size={20} />} titulo="Acesse meu sistema" texto="Use o código e a senha da sua placa para acessar estatísticas, contatos e a criação do seu mini site." />
      <form onSubmit={consultar} className="space-y-4">
        <label className="block">
          <span className="dds-label">Código da placa</span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ex: DDS215"
            required
            autoComplete="username"
            className="dds-input"
          />
        </label>
        <label className="block">
          <span className="dds-label">Senha (4 números)</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="0000"
            required
            className="dds-input tracking-[.4em] font-semibold"
          />
        </label>
        {erro && <Erro>{erro}</Erro>}
        <BotaoEnviar carregando={carregando}>Entrar no meu sistema</BotaoEnviar>
      </form>
    </AuthShell>
  );
}

function Kpi({ icon, label, value, d, tint = "blue", children }: { icon: ReactNode; label: string; value: number; d: number; tint?: "blue" | "violet"; children?: ReactNode }) {
  return (
    <div onPointerMove={spotMove} className="dds-card dds-spot dds-lift p-5 dds-rise" style={{ ["--d" as string]: `${d}s` }}>
      <div className="flex items-center justify-between">
        <span className={`dds-icon-tile ${tint === "violet" ? "!bg-gradient-to-br !from-[#f3f0ff] !to-[#e6e0ff] !text-[#6d5ae6] !shadow-[inset_0_0_0_1px_#d9d1ff]" : ""}`}>{icon}</span>
      </div>
      <p className="mt-4 font-display text-[34px] leading-none font-extrabold tracking-[-.04em] text-ink"><CountUp value={value} /></p>
      <p className="mt-1.5 text-sm text-ink-muted">{label}</p>
      {children}
    </div>
  );
}

function Card({ icon, title, subtitle, children, className = "" }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`dds-card dds-card-pad ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <span className="dds-icon-tile !w-9 !h-9 !rounded-xl">{icon}</span>
        <div>
          <h2 className="font-display font-bold text-ink leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// Gráfico de barras dos dias (do mais antigo ao mais recente).
function GraficoDias({ linhas }: { linhas: [string, number][] }) {
  const max = Math.max(1, ...linhas.map(([, v]) => v));
  const passo = Math.max(1, Math.ceil(linhas.length / 7));
  return (
    <div>
      <div className="relative h-48 flex items-end gap-[3px] sm:gap-1.5 border-b border-[#e8edf5]" role="list" aria-label="Acessos por dia">
        <div aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(0deg,#eef2f8_0_1px,transparent_1px_48px)]" />
        {linhas.map(([dia, v], i) => (
          <div key={dia} role="listitem" aria-label={`${formatarDiaMes(dia)}: ${v} acesso(s)`} className="group relative flex-1 h-full flex items-end">
            <div className="dds-bar w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-400 group-hover:from-[#6d5ae6] group-hover:to-[#8b7bff] transition-colors" style={{ height: `${Math.max(4, (v / max) * 100)}%`, ["--d" as string]: `${i * .02}s` }} />
            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">{formatarDiaMes(dia)} · {v}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1.5 text-[10px] text-ink-muted">
        {linhas.map(([dia], i) => <span key={dia} className="flex-1 text-center overflow-visible whitespace-nowrap">{i % passo === 0 ? formatarDiaMes(dia) : ""}</span>)}
      </div>
    </div>
  );
}

function BarrasLista({ linhas }: { linhas: [string, number][] }) {
  const max = Math.max(1, ...linhas.map(([, v]) => v));
  return (
    <ul className="space-y-3">
      {linhas.map(([chave, valor], i) => (
        <li key={chave}>
          <div className="flex items-center justify-between text-sm"><span className="text-ink-soft">{chave}</span><span className="font-semibold text-ink tabular">{valor.toLocaleString("pt-BR")}</span></div>
          <div className="mt-1.5 h-1.5 rounded-full bg-[#eef2f8] overflow-hidden"><div className="dds-hbar h-full rounded-full bg-gradient-to-r from-brand-500 to-[#66e0ff]" style={{ width: `${(valor / max) * 100}%`, ["--d" as string]: `${i * .05}s` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function SemDados({ texto = "Ainda não há acessos registrados." }: { texto?: string }) {
  return <p className="rounded-2xl border border-dashed border-[#d6deec] bg-[#f9fbfe] px-4 py-5 text-sm text-ink-muted text-center">{texto}</p>;
}
