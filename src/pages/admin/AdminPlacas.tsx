import { lazy, ReactNode, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowLeftRight, ChevronLeft, ChevronRight, Copy, Download, History, KeyRound, Layers, Lock,
  Pause, Phone, Play, Plus, RotateCcw, Search, Sparkles, Store, Trash2, Unlock, X, Zap, CheckCircle2, Clock3,
} from "lucide-react";
import { supabase, callFunction } from "../../lib/supabaseClient";
import { linkDaPropriaPlaca, MSG_LINK_DA_PLACA } from "../../lib/linkGuard";
import { publicStorageUrl } from "../../lib/storage";
import { scanLink } from "../../lib/scanLink";
import type { PlateMiniAccess } from "../../components/PlateMiniOffer";
import { Aurora, BrandMark, CountUp, Spinner } from "../../components/ui/Fx";
import { ScreenLoading } from "../../components/ui/Screen";

const MiniStudio = lazy(() => import("../MiniStudio"));

type DdsLinkResumo = {
  id: string;
  slug: string;
  destino_atual: string | null;
  status: string;
  qr_png_path: string | null;
  qr_svg_path: string | null;
  historico_limpo_em: string | null;
};

type Plate = {
  id: string;
  codigo: string;
  pin: string | null;
  status: string;
  apelido: string | null;
  mini_site_enabled: boolean;
  company_id: string | null;
  companies: { nome: string } | null;
  ultimo_acesso_em: string | null;
  dds_links: DdsLinkResumo | null;
};

type PlacaCriada = {
  codigo: string;
  slug: string;
  pin: string;
  urlQr: string;
  urlNfc: string;
  qrPngDataUrl: string;
};

type Historico = { destino_anterior: string | null; destino_novo: string; created_at: string };

export default function AdminPlacas() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 10;
  const [carregando, setCarregando] = useState(true);
  const [quantidade, setQuantidade] = useState(10);
  const [criando, setCriando] = useState(false);
  const [loteCriado, setLoteCriado] = useState<PlacaCriada[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [selecionada, setSelecionada] = useState<Plate | null>(null);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [novoDestino, setNovoDestino] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [scansTotal, setScansTotal] = useState<{ total: number; qr: number; nfc: number } | null>(null);
  const [copiado, setCopiado] = useState<"qr" | "nfc" | "pin" | null>(null);
  const [leads, setLeads] = useState<{ telefone: string; created_at: string }[]>([]);
  const [miniEditor, setMiniEditor] = useState<PlateMiniAccess | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("plates")
      .select(
        "id, codigo, pin, status, apelido, mini_site_enabled, company_id, ultimo_acesso_em, companies(nome), dds_links:dynamic_link_id(id, slug, destino_atual, status, qr_png_path, qr_svg_path, historico_limpo_em)"
      )
      .eq("oculta", false)
      .order("created_at", { ascending: false });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Erro ao carregar placas:", error.message);
    }
    const lista = (data as any) ?? [];
    setPlates(lista);
    setCarregando(false);
    // mantém o painel de detalhe em dia se a placa selecionada mudou de status
    if (selecionada) {
      const atualizada = lista.find((p: Plate) => p.id === selecionada.id);
      if (atualizada) setSelecionada(atualizada);
    }
  }

  const filtradas = plates.filter((p) => {
    if (!busca) return true;
    const alvo = busca.toLowerCase();
    // Só busca nos campos que aparecem na própria tabela (código, PIN,
    // empresa) — o "slug" do link é um código interno que nunca é mostrado
    // aqui, e buscar nele trazia resultados sem nenhuma relação aparente.
    return (
      p.codigo.toLowerCase().includes(alvo) ||
      p.pin?.toLowerCase().includes(alvo) ||
      p.companies?.nome?.toLowerCase().includes(alvo)
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const paginadas = filtradas.slice(paginaAtual * POR_PAGINA, paginaAtual * POR_PAGINA + POR_PAGINA);

  function aoBuscar(valor: string) {
    setBusca(valor);
    setPagina(0); // toda busca nova volta pra primeira página
  }

  async function liberarMiniSite() {
    if (!selecionada) return;
    if (!window.confirm(`Confirmou o pagamento de ${selecionada.codigo}? A criação do mini site será liberada para este cliente.`)) return;
    setSalvando(true); setErro(null);
    try {
      const { error } = await supabase.from('plates').update({ mini_site_enabled: true }).eq('id', selecionada.id);
      if (error) throw error;
      await carregar();
      setSelecionada(old => old ? { ...old, mini_site_enabled: true } : old);
    } catch (e: any) { setErro(e.message || 'Não foi possível liberar o mini site.'); }
    finally { setSalvando(false); }
  }

  async function criarLote() {
    setCriando(true);
    setErro(null);
    setLoteCriado(null);
    try {
      const data = await callFunction<{ criadas?: PlacaCriada[]; error?: string }>(
        "admin-create-plates",
        { quantidade }
      );
      if (data.error) throw new Error(data.error);
      setLoteCriado(data.criadas ?? []);
      setPagina(0);
      carregar();
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível criar o lote.");
    } finally {
      setCriando(false);
    }
  }

  function baixarCsv() {
    if (!loteCriado) return;
    const linhas = [
      "codigo,pin,url_qr,url_nfc",
      ...loteCriado.map((p) => `${p.codigo},${p.pin},${p.urlQr},${p.urlNfc}`),
    ];
    baixarArquivo(linhas.join("\n"), "placas-dds.csv", "text/csv");
  }

  async function baixarPngsIndividualmente() {
    if (!loteCriado) return;
    for (const p of loteCriado) {
      const a = document.createElement("a");
      a.href = p.qrPngDataUrl;
      a.download = `${p.codigo}.png`;
      a.click();
      await new Promise((r) => setTimeout(r, 150)); // evita bloqueio de pop-up do navegador
    }
  }

  async function alterarStatus(plateId: string, novoStatus: "BLOQUEADA" | "ATIVA" | "DESATIVADA") {
    await supabase.from("plates").update({ status: novoStatus }).eq("id", plateId);
    carregar();
  }

  async function transferirPlaca(plateId: string) {
    const novoCompanyId = window.prompt("Digite o ID (UUID) da empresa de destino:");
    if (!novoCompanyId) return;
    const { error } = await supabase
      .from("plates")
      .update({ company_id: novoCompanyId })
      .eq("id", plateId);
    if (error) return alert("Não foi possível transferir: " + error.message);
    carregar();
  }

  // Gera um novo PIN pra placa (ex.: cliente perdeu o PIN) sem mexer no
  // cadastro/empresa já vinculados.
  async function novoPin(codigo: string, plateId: string) {
    if (!window.confirm(`Gerar um novo PIN para ${codigo}? O PIN antigo deixa de funcionar.`)) return;
    const { data, error } = await supabase.rpc("admin_reset_plate_pin", {
      p_plate_id: plateId,
      p_full: false,
    });
    if (error) return alert("Não foi possível gerar novo PIN: " + error.message);
    window.prompt(`Novo PIN de ${codigo}:`, data as string);
    carregar();
  }

  // Reseta a placa por completo: desvincula da empresa e volta pro estado
  // "de fábrica", com um PIN novo — para reaproveitar uma plaquinha física.
  async function resetarPlaca(codigo: string, plateId: string) {
    if (
      !window.confirm(
        `Resetar ${codigo} por completo? Isso desvincula a empresa cadastrada e a placa volta a ficar disponível para um novo cadastro. Essa ação não pode ser desfeita.`
      )
    )
      return;
    const { data, error } = await supabase.rpc("admin_reset_plate_pin", {
      p_plate_id: plateId,
      p_full: true,
    });
    if (error) return alert("Não foi possível resetar a placa: " + error.message);
    window.prompt(`${codigo} resetada. Novo PIN:`, data as string);
    carregar();
  }

  // "Exclui" a placa da lista — na prática só oculta (nunca apaga do banco),
  // pra servir de lixeira segura pra placas de teste/engano.
  async function excluirPlaca(codigo: string, plateId: string) {
    if (!window.confirm(`Remover ${codigo} da lista? Ela some do painel, mas os dados continuam guardados.`))
      return;
    const { error } = await supabase.from("plates").update({ oculta: true }).eq("id", plateId);
    if (error) return alert("Não foi possível remover: " + error.message);
    if (selecionada?.id === plateId) setSelecionada(null);
    carregar();
  }

  function copiarTexto(valor: string, marca: "qr" | "nfc" | "pin") {
    navigator.clipboard
      ?.writeText(valor)
      .then(() => {
        setCopiado(marca);
        setTimeout(() => setCopiado(null), 2000);
      })
      .catch(() => window.prompt("Copie o valor:", valor));
  }

  async function abrirDetalhe(plate: Plate) {
    setSelecionada(plate);
    setNovoDestino(plate.dds_links?.destino_atual ?? "");
    setHistorico([]);
    setScansTotal(null);
    setLeads([]);

    // Depois de um reset completo, tudo do cliente anterior (telefones,
    // acessos e histórico) fica marcado como "limpo" (sem apagar as linhas
    // do banco) — só mostramos o que aconteceu depois desse marco.
    const marco = plate.dds_links?.historico_limpo_em ?? null;

    let leadsQuery = supabase
      .from("review_leads")
      .select("telefone, created_at")
      .eq("plate_id", plate.id)
      .order("created_at", { ascending: false });
    if (marco) leadsQuery = leadsQuery.gt("created_at", marco);
    const { data: leadsData } = await leadsQuery;
    setLeads(leadsData ?? []);

    const linkId = plate.dds_links?.id;
    if (!linkId) return;

    let histQuery = supabase
      .from("link_destination_history")
      .select("destino_anterior, destino_novo, created_at")
      .eq("link_id", linkId)
      .order("created_at", { ascending: false });
    if (marco) histQuery = histQuery.gt("created_at", marco);
    const { data: hist } = await histQuery;
    setHistorico(hist ?? []);

    let totalQuery = supabase.from("link_scan_events").select("id", { count: "exact", head: true }).eq("link_id", linkId);
    let qrQuery = supabase
      .from("link_scan_events")
      .select("id", { count: "exact", head: true })
      .eq("link_id", linkId)
      .eq("source", "QR");
    let nfcQuery = supabase
      .from("link_scan_events")
      .select("id", { count: "exact", head: true })
      .eq("link_id", linkId)
      .eq("source", "NFC");
    if (marco) {
      totalQuery = totalQuery.gt("created_at", marco);
      qrQuery = qrQuery.gt("created_at", marco);
      nfcQuery = nfcQuery.gt("created_at", marco);
    }
    const [{ count: total }, { count: qr }, { count: nfc }] = await Promise.all([totalQuery, qrQuery, nfcQuery]);
    setScansTotal({ total: total ?? 0, qr: qr ?? 0, nfc: nfc ?? 0 });
  }

  async function salvarNovoDestino() {
    if (!selecionada?.dds_links || !novoDestino) return;
    if (linkDaPropriaPlaca(novoDestino)) return alert(MSG_LINK_DA_PLACA);
    setSalvando(true);
    const { error } = await supabase.rpc("alter_link_destino", {
      p_link_id: selecionada.dds_links.id,
      p_novo_destino: novoDestino,
    });
    setSalvando(false);
    if (error) return alert("Não foi possível alterar o destino: " + error.message);
    await carregar();
  }

  async function alternarPausaLink() {
    if (!selecionada?.dds_links) return;
    const novoStatus = selecionada.dds_links.status === "PAUSADO" ? "ATIVO" : "PAUSADO";
    await supabase.from("dds_links").update({ status: novoStatus }).eq("id", selecionada.dds_links.id);
    await carregar();
  }

  // O administrador monta o mini site pelo cliente, com o mesmo código e senha da placa.
  async function montarMiniSite() {
    if (!selecionada?.pin) { setErro('Esta placa não tem senha cadastrada.'); return; }
    setSalvando(true); setErro(null);
    try {
      const data = await callFunction<{ enabled: boolean; page: PlateMiniAccess['page']; company: PlateMiniAccess['company'] }>('plate-mini', { action: 'get', codigo: selecionada.codigo, senha: selecionada.pin });
      if (!data.enabled) throw new Error('Libere o mini site desta placa antes de montar a página.');
      setMiniEditor({ codigo: selecionada.codigo, senha: selecionada.pin, page: data.page, company: data.company });
    } catch (e: any) { setErro(e.message || 'Não foi possível abrir o mini site.'); }
    finally { setSalvando(false); }
  }

  if (miniEditor) return <>
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 bg-navy-950 text-white border-b border-white/10">
      <button className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-[#8fd8ff] hover:text-white" onClick={() => { setMiniEditor(null); carregar(); }}><ArrowLeft size={16} /> Voltar às placas</button>
      <span className="hidden sm:block text-xs text-[#a7b7d1]">Montando o mini site da placa {miniEditor.codigo}</span>
    </div>
    <Suspense fallback={<ScreenLoading light label="Abrindo o estúdio…" />}><MiniStudio plateAccess={miniEditor} /></Suspense>
  </>;

  const ativas = plates.filter(p => p.status === "ATIVA").length;
  const aguardando = plates.filter(p => p.status === "AGUARDANDO_ATIVACAO" || p.status === "CRIADA").length;
  const miniLiberados = plates.filter(p => p.mini_site_enabled).length;

  return (
    <div className="min-h-[100dvh] bg-[#f4f6fb] pb-16">
      <header className="dds-dark overflow-hidden">
        <Aurora calm />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <BrandMark />
          <nav className="flex items-center gap-2">
            <Link to="/minisite" className="dds-btn dds-btn-ghost-dark dds-btn-sm"><Sparkles size={15} /><span className="hidden sm:inline">Estúdio de mini páginas</span><span className="sm:hidden">Estúdio</span></Link>
            <Link to="/" className="dds-btn dds-btn-ghost-dark dds-btn-sm hidden sm:inline-flex">Início</Link>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 sm:pb-28 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="dds-rise">
            <p className="text-xs font-bold tracking-[.2em] uppercase text-[#66e0ff]">Painel administrativo</p>
            <h1 className="mt-2 font-display text-[clamp(32px,4.5vw,48px)] font-extrabold tracking-[-.045em] leading-none text-white">Placas</h1>
            <p className="mt-3 text-[15px] text-[#a7b7d1] max-w-lg">Gere lotes, acompanhe o status e gerencie o link de cada placa.</p>
          </div>
          <div className="dds-glass rounded-2xl p-2 flex items-end gap-2 self-start lg:self-auto dds-rise" style={{ ["--d" as string]: ".1s" }}>
            <label className="block">
              <span className="block px-1 pb-1 text-[11px] font-semibold text-[#a7b7d1]">Quantidade</span>
              <input
                type="number"
                min={1}
                max={100}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-24 rounded-xl border border-white/15 bg-navy-950/60 px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20"
              />
            </label>
            <button onClick={criarLote} disabled={criando} className="dds-btn dds-btn-glow">
              {criando ? <><Spinner /> Gerando...</> : <><Plus size={18} /> Gerar placas</>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 space-y-5 relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Kpi icon={<Layers size={19} />} label="Placas no painel" value={plates.length} loading={carregando} d={0} />
          <Kpi icon={<CheckCircle2 size={19} />} label="Ativas" value={ativas} loading={carregando} d={.05} tone="green" />
          <Kpi icon={<Clock3 size={19} />} label="Aguardando ativação" value={aguardando} loading={carregando} d={.1} tone="amber" />
          <Kpi icon={<Sparkles size={19} />} label="Mini sites liberados" value={miniLiberados} loading={carregando} d={.15} tone="violet" />
        </div>

        {erro && <p className="dds-error" role="alert">{erro}</p>}

        {loteCriado && (
          <div className="dds-rise rounded-[22px] border border-amber-200 bg-gradient-to-br from-amber-50 to-[#fff8e8] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="flex items-start gap-3 font-medium text-amber-950">
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-amber-400/20 text-amber-700"><Zap size={18} /></span>
              <span>{loteCriado.length} placa(s) criada(s). Baixe agora — o PIN em texto só fica fácil de copiar aqui e na lista abaixo.</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={baixarCsv} className="dds-btn dds-btn-outline dds-btn-sm"><Download size={15} /> Baixar CSV (código + PIN + URLs)</button>
              <button onClick={baixarPngsIndividualmente} className="dds-btn dds-btn-outline dds-btn-sm"><Download size={15} /> Baixar QR Codes (PNG)</button>
            </div>
          </div>
        )}

        <div className={`grid gap-5 items-start ${selecionada ? "lg:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
          <section className="dds-card overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-[#eef2f8] flex items-center gap-3">
              <label className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d9bb5]" aria-hidden="true" />
                <input
                  value={busca}
                  onChange={(e) => aoBuscar(e.target.value)}
                  placeholder="Pesquisar por código, empresa..."
                  className="dds-input pl-11 !py-2.5"
                  aria-label="Pesquisar placas"
                />
              </label>
              <span className="hidden sm:block text-sm text-ink-muted whitespace-nowrap">{filtradas.length} placa(s)</span>
            </div>

            {carregando ? (
              <div className="p-4 space-y-3" aria-busy="true">{[0, 1, 2, 3, 4].map(i => <div key={i} className="dds-skel h-11" />)}</div>
            ) : filtradas.length === 0 ? (
              <p className="p-8 text-center text-ink-muted text-sm">Nenhuma placa encontrada.</p>
            ) : (
              <>
                {/* Celular: uma linha por placa (sem tabela), pra caber inteira na
                    tela — toca pra abrir os detalhes e as ações no painel. */}
                <ul className="divide-y divide-[#eef2f8] md:hidden">
                  {paginadas.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => abrirDetalhe(p)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#f5f9ff] ${selecionada?.id === p.id ? "bg-[#eef6ff]" : ""}`}
                    >
                      <span className="font-mono font-bold text-sm shrink-0">{p.codigo}</span>
                      <span className="text-sm text-ink-muted truncate flex-1 min-w-0">{p.companies?.nome ?? "—"}</span>
                      <StatusBadge status={p.status} />
                      <ChevronRight size={16} className="text-[#b9c6dc] shrink-0" />
                    </li>
                  ))}
                </ul>

                {/* Desktop: tabela, com as ações na própria linha. */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-[.1em] text-ink-muted bg-[#f9fbfe]">
                        <th className="px-4 py-3 font-semibold">Código</th>
                        <th className="px-4 py-3 font-semibold">PIN</th>
                        <th className="px-4 py-3 font-semibold">Empresa</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginadas.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => abrirDetalhe(p)}
                          className={`group border-t border-[#eef2f8] cursor-pointer transition-colors hover:bg-[#f5f9ff] ${selecionada?.id === p.id ? "bg-[#eef6ff] shadow-[inset_3px_0_0_#1a6fe0]" : ""}`}
                        >
                          <td className="px-4 py-3 font-mono font-bold">{p.codigo}</td>
                          <td className="px-4 py-3 font-mono">
                            {p.pin ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copiarTexto(p.pin!, "pin");
                                }}
                                title="Copiar PIN"
                                className="rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-[#e3efff] hover:text-brand-700"
                              >
                                {p.pin}
                              </button>
                            ) : (
                              <span className="text-[#b9c6dc]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[220px] truncate">{p.companies?.nome ?? <span className="text-[#b9c6dc]">—</span>}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={p.status} />
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              {p.status !== "BLOQUEADA" ? (
                                <AcaoIcone rotulo="Bloquear" onClick={() => alterarStatus(p.id, "BLOQUEADA")}><Lock size={15} /></AcaoIcone>
                              ) : (
                                <AcaoIcone rotulo="Desbloquear" onClick={() => alterarStatus(p.id, "ATIVA")}><Unlock size={15} /></AcaoIcone>
                              )}
                              <AcaoIcone rotulo="Transferir" onClick={() => transferirPlaca(p.id)}><ArrowLeftRight size={15} /></AcaoIcone>
                              <AcaoIcone rotulo="Novo PIN" onClick={() => novoPin(p.codigo, p.id)}><KeyRound size={15} /></AcaoIcone>
                              <AcaoIcone rotulo="Resetar" onClick={() => resetarPlaca(p.codigo, p.id)}><RotateCcw size={15} /></AcaoIcone>
                              <AcaoIcone rotulo="Excluir" perigo onClick={() => excluirPlaca(p.codigo, p.id)}><Trash2 size={15} /></AcaoIcone>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {!carregando && filtradas.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t border-[#eef2f8] bg-[#f9fbfe] text-sm">
                <button onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={paginaAtual === 0} className="dds-btn dds-btn-outline dds-btn-sm">
                  <ChevronLeft size={15} /> Anterior
                </button>
                <span className="text-ink-muted text-center">
                  Página {paginaAtual + 1} de {totalPaginas}<span className="hidden sm:inline"> · {filtradas.length} placa(s)</span>
                </span>
                <button onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))} disabled={paginaAtual >= totalPaginas - 1} className="dds-btn dds-btn-outline dds-btn-sm">
                  Próximo <ChevronRight size={15} />
                </button>
              </div>
            )}
          </section>

          {selecionada && (
            // No celular o painel abre como uma folha por cima da lista; no computador fica ao lado.
            <div className="fixed inset-0 z-50 flex items-end bg-navy-950/50 backdrop-blur-[2px] lg:contents" onClick={() => setSelecionada(null)}>
              <aside
                onClick={(e) => e.stopPropagation()}
                className="w-full max-h-[90dvh] overflow-y-auto dds-scroll rounded-t-[28px] bg-white shadow-lift lg:rounded-[22px] lg:border lg:border-[#e3e8f2] lg:max-h-[calc(100dvh-2rem)] lg:sticky lg:top-4 dds-rise"
                aria-label={`Detalhes da placa ${selecionada.codigo}`}
              >
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-5 pt-4 pb-3 border-b border-[#eef2f8]">
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d6deec] lg:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xl font-extrabold tracking-wide">{selecionada.codigo}</p>
                      <p className="text-sm text-ink-muted">
                        PIN:{" "}
                        {selecionada.pin ? (
                          <button onClick={() => copiarTexto(selecionada.pin!, "pin")} className="font-mono font-semibold text-ink hover:text-brand-700">
                            {selecionada.pin}
                            {copiado === "pin" ? " ✓ copiado" : ""}
                          </button>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      {selecionada.dds_links?.qr_png_path && (
                        <img
                          src={publicStorageUrl("qr-codes", selecionada.dds_links.qr_png_path)}
                          alt="QR Code"
                          className="w-16 h-16 rounded-xl border border-[#e3e8f2] bg-white p-1"
                        />
                      )}
                      <button onClick={() => setSelecionada(null)} className="grid place-items-center w-9 h-9 rounded-xl text-ink-muted hover:bg-[#f1f4f9] hover:text-ink" aria-label="Fechar detalhes"><X size={18} /></button>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <dl className="grid grid-cols-2 gap-2.5 text-sm">
                    <Info rotulo="Empresa" className="col-span-2"><span className="flex items-center gap-2"><Store size={15} className="text-ink-muted" />{selecionada.companies?.nome ?? "—"}</span></Info>
                    <Info rotulo="Status da placa"><StatusBadge status={selecionada.status} /></Info>
                    <Info rotulo="Status do link">{selecionada.dds_links ? <LinkBadge status={selecionada.dds_links.status} /> : "—"}</Info>
                    <Info rotulo="Acessos" className="col-span-2">
                      {scansTotal ? (
                        <span className="flex items-baseline gap-3"><strong className="font-display text-2xl font-extrabold">{scansTotal.total}</strong><span className="text-ink-muted">QR {scansTotal.qr} · NFC {scansTotal.nfc}</span></span>
                      ) : selecionada.dds_links ? <span className="dds-skel block h-7 w-32" /> : "—"}
                    </Info>
                  </dl>

                  <div className="relative overflow-hidden rounded-2xl p-4 text-white bg-gradient-to-br from-navy-800 to-navy-950">
                    <div aria-hidden="true" className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-[radial-gradient(closest-side,#399cff66,transparent)]" />
                    <h3 className="relative flex items-center gap-2 font-display font-bold"><Sparkles size={16} className="text-[#66e0ff]" /> Mini site do cliente</h3>
                    <p className="relative mt-1 text-sm text-[#a7b7d1]">{selecionada.mini_site_enabled ? 'Liberado: o cliente já pode criar e publicar no próprio sistema, ou você monta por ele aqui.' : 'Aguardando contratação e confirmação do pagamento.'}</p>
                    <div className="relative mt-3">
                      {!selecionada.mini_site_enabled && <button onClick={liberarMiniSite} disabled={salvando || selecionada.status !== 'ATIVA'} className="dds-btn dds-btn-glow dds-btn-sm">{salvando ? 'Liberando…' : 'Pagamento confirmado · liberar mini site'}</button>}
                      {selecionada.mini_site_enabled && <button onClick={montarMiniSite} disabled={salvando || selecionada.status !== 'ATIVA'} className="dds-btn dds-btn-glow dds-btn-sm">{salvando ? 'Abrindo…' : 'Montar mini site'}</button>}
                      {selecionada.status !== 'ATIVA' && <p className="mt-2 text-xs text-[#a7b7d1]">A placa precisa estar ativa para a liberação.</p>}
                    </div>
                  </div>

                  <div>
                    <p className="dds-label">Ações da placa</p>
                    <div className="flex flex-wrap gap-2">
                      {selecionada.status !== "BLOQUEADA" ? (
                        <AcaoBotao onClick={() => alterarStatus(selecionada.id, "BLOQUEADA")}><Lock size={14} /> Bloquear</AcaoBotao>
                      ) : (
                        <AcaoBotao onClick={() => alterarStatus(selecionada.id, "ATIVA")}><Unlock size={14} /> Desbloquear</AcaoBotao>
                      )}
                      <AcaoBotao onClick={() => transferirPlaca(selecionada.id)}><ArrowLeftRight size={14} /> Transferir</AcaoBotao>
                      <AcaoBotao onClick={() => novoPin(selecionada.codigo, selecionada.id)}><KeyRound size={14} /> Novo PIN</AcaoBotao>
                      <AcaoBotao onClick={() => resetarPlaca(selecionada.codigo, selecionada.id)}><RotateCcw size={14} /> Resetar</AcaoBotao>
                      <AcaoBotao perigo onClick={() => excluirPlaca(selecionada.codigo, selecionada.id)}><Trash2 size={14} /> Excluir</AcaoBotao>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Phone size={15} className="text-brand-600" /> Telefones deixados antes de avaliar ({leads.length})</p>
                      {leads.length > 0 && (
                        <button onClick={() => copiarTexto(leads.map((l) => l.telefone).join(", "), "pin")} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                          Copiar todos
                        </button>
                      )}
                    </div>
                    {leads.length === 0 ? (
                      <p className="text-xs text-ink-muted">Nenhum telefone deixado ainda.</p>
                    ) : (
                      <ul className="text-xs space-y-1.5 max-h-36 overflow-y-auto dds-scroll pr-1">
                        {leads.map((l, i) => (
                          <li key={i} className="flex justify-between gap-2 rounded-lg bg-[#f7f9fd] px-2.5 py-1.5">
                            <span className="font-mono text-ink">{l.telefone}</span>
                            <span className="text-ink-muted">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selecionada.dds_links ? (
                    <>
                      <div className="space-y-3 rounded-2xl bg-[#f7f9fd] border border-[#e8edf5] p-3.5">
                        <LinkParaCopiar
                          label="Link do QR Code"
                          valor={scanLink(selecionada.dds_links.slug, "qr")}
                          copiado={copiado === "qr"}
                          onCopiar={() => copiarTexto(scanLink(selecionada.dds_links!.slug, "qr"), "qr")}
                        />
                        <LinkParaCopiar
                          label="Link do NFC"
                          valor={scanLink(selecionada.dds_links.slug, "nfc")}
                          copiado={copiado === "nfc"}
                          onCopiar={() => copiarTexto(scanLink(selecionada.dds_links!.slug, "nfc"), "nfc")}
                        />
                        <p className="text-xs text-ink-muted leading-relaxed">
                          Grave este link do NFC (com o app NFC Tools, por exemplo) na etiqueta física — é o
                          mesmo QR, só muda o final (?src=nfc), pra separar os acessos nas estatísticas.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selecionada.dds_links.qr_png_path && (
                          <a href={publicStorageUrl("qr-codes", selecionada.dds_links.qr_png_path)} download className="dds-btn dds-btn-outline dds-btn-sm">
                            <Download size={14} /> Baixar PNG
                          </a>
                        )}
                        {selecionada.dds_links.qr_svg_path && (
                          <a href={publicStorageUrl("qr-codes", selecionada.dds_links.qr_svg_path)} download className="dds-btn dds-btn-outline dds-btn-sm">
                            <Download size={14} /> Baixar SVG
                          </a>
                        )}
                        <button onClick={alternarPausaLink} className="dds-btn dds-btn-outline dds-btn-sm">
                          {selecionada.dds_links.status === "PAUSADO" ? <><Play size={14} /> Reativar link</> : <><Pause size={14} /> Pausar link</>}
                        </button>
                      </div>

                      <div>
                        <label className="dds-label" htmlFor="novo-destino">Alterar destino (link de avaliação)</label>
                        <div className="flex gap-2">
                          <input id="novo-destino" value={novoDestino} onChange={(e) => setNovoDestino(e.target.value)} className="dds-input !py-2.5 text-sm" />
                          <button onClick={salvarNovoDestino} disabled={salvando} className="dds-btn dds-btn-primary">
                            Salvar
                          </button>
                        </div>
                        <p className="dds-help">A imagem do QR não muda — só o destino do redirecionamento.</p>
                      </div>

                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink mb-2"><History size={15} className="text-brand-600" /> Histórico de alterações</p>
                        {historico.length === 0 ? (
                          <p className="text-xs text-ink-muted">Nenhuma alteração registrada ainda.</p>
                        ) : (
                          <ol className="relative text-xs space-y-3 max-h-40 overflow-y-auto dds-scroll pl-4 border-l-2 border-[#e3e8f2]">
                            {historico.map((h, i) => (
                              <li key={i} className="relative text-ink-muted break-all">
                                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-400 ring-4 ring-white" />
                                <span className="block font-semibold text-ink">{new Date(h.created_at).toLocaleString("pt-BR")}</span>
                                {h.destino_anterior ?? "(nenhum)"} → {h.destino_novo}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-ink-muted">Esta placa não tem link dinâmico associado.</p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Kpi({ icon, label, value, loading, d, tone = "blue" }: { icon: ReactNode; label: string; value: number; loading: boolean; d: number; tone?: "blue" | "green" | "amber" | "violet" }) {
  const tones = {
    blue: "",
    green: "!bg-gradient-to-br !from-emerald-50 !to-emerald-100 !text-emerald-700 !shadow-[inset_0_0_0_1px_#a7f3d0]",
    amber: "!bg-gradient-to-br !from-amber-50 !to-amber-100 !text-amber-700 !shadow-[inset_0_0_0_1px_#fde68a]",
    violet: "!bg-gradient-to-br !from-[#f3f0ff] !to-[#e6e0ff] !text-[#6d5ae6] !shadow-[inset_0_0_0_1px_#d9d1ff]",
  };
  return (
    <div className="dds-card dds-lift p-4 sm:p-5 dds-rise" style={{ ["--d" as string]: `${d}s` }}>
      <span className={`dds-icon-tile !w-10 !h-10 ${tones[tone]}`}>{icon}</span>
      <p className="mt-3 font-display text-[28px] sm:text-[32px] leading-none font-extrabold tracking-[-.04em]">{loading ? <span className="dds-skel inline-block h-7 w-12 align-middle" /> : <CountUp value={value} />}</p>
      <p className="mt-1 text-[13px] text-ink-muted">{label}</p>
    </div>
  );
}

function Info({ rotulo, children, className = "" }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[#eef2f8] bg-[#f9fbfe] px-3 py-2.5 ${className}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-[.08em] text-ink-muted">{rotulo}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}

function LinkParaCopiar({
  label,
  valor,
  copiado,
  onCopiar,
}: {
  label: string;
  valor: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-soft mb-1">{label}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={valor}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 rounded-xl border border-[#dbe3f0] bg-white px-2.5 py-2 text-xs font-mono text-ink-soft"
        />
        <button onClick={onCopiar} className="dds-btn dds-btn-outline dds-btn-sm shrink-0">
          {copiado ? <><CheckCircle2 size={14} className="text-emerald-600" /> Copiado!</> : <><Copy size={14} /> Copiar</>}
        </button>
      </div>
    </div>
  );
}

function AcaoIcone({ children, onClick, rotulo, perigo = false }: { children: ReactNode; onClick: () => void; rotulo: string; perigo?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={rotulo}
      aria-label={rotulo}
      className={`grid place-items-center w-8 h-8 rounded-lg text-ink-muted transition-colors ${perigo ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-[#e3efff] hover:text-brand-700"}`}
    >
      {children}
    </button>
  );
}

function AcaoBotao({ children, onClick, perigo = false }: { children: ReactNode; onClick: () => void; perigo?: boolean }) {
  return (
    <button onClick={onClick} className={`dds-btn dds-btn-outline dds-btn-sm ${perigo ? "!text-rose-600 hover:!bg-rose-50 hover:!border-rose-200" : ""}`}>
      {children}
    </button>
  );
}

function baixarArquivo(conteudo: string, nome: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

const statusStyles: Record<string, string> = {
  ATIVA: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  AGUARDANDO_ATIVACAO: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  CRIADA: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  BLOQUEADA: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  DESATIVADA: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};
const statusLabel: Record<string, string> = {
  ATIVA: "Ativa",
  AGUARDANDO_ATIVACAO: "Aguardando",
  CRIADA: "Criada",
  BLOQUEADA: "Bloqueada",
  DESATIVADA: "Desativada",
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`dds-status ${statusStyles[status] ?? "bg-slate-100 text-slate-600"}`} title={status}>{statusLabel[status] ?? status}</span>;
}

function LinkBadge({ status }: { status: string }) {
  const ativo = status !== "PAUSADO";
  return <span className={`dds-status ${ativo ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}>{ativo ? "Ativo" : "Pausado"}</span>;
}
