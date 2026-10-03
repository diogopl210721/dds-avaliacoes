import { useEffect, useState } from "react";
import { supabase, callFunction } from "../../lib/supabaseClient";
import { publicStorageUrl } from "../../lib/storage";
import { scanLink } from "../../lib/scanLink";

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

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("plates")
      .select(
        "id, codigo, pin, status, apelido, company_id, ultimo_acesso_em, companies(nome), dds_links:dynamic_link_id(id, slug, destino_atual, status, qr_png_path, qr_svg_path, historico_limpo_em)"
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
    return (
      p.codigo.toLowerCase().includes(alvo) ||
      p.dds_links?.slug?.toLowerCase().includes(alvo) ||
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Placas</h1>

      <div className="bg-white rounded-xl shadow p-4 flex items-end gap-3">
        <label className="block">
          <span className="text-sm text-gray-600">Quantidade</span>
          <input
            type="number"
            min={1}
            max={100}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="mt-1 w-28 rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <button
          onClick={criarLote}
          disabled={criando}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          {criando ? "Gerando..." : "Gerar placas"}
        </button>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {loteCriado && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="font-medium mb-2">
            {loteCriado.length} placa(s) criada(s). Baixe agora — o PIN em texto só fica fácil de
            copiar aqui e na lista abaixo.
          </p>
          <div className="flex gap-3">
            <button onClick={baixarCsv} className="px-3 py-1.5 rounded-lg border hover:bg-gray-100 text-sm">
              Baixar CSV (código + PIN + URLs)
            </button>
            <button onClick={baixarPngsIndividualmente} className="px-3 py-1.5 rounded-lg border hover:bg-gray-100 text-sm">
              Baixar QR Codes (PNG)
            </button>
          </div>
        </div>
      )}

      <input
        value={busca}
        onChange={(e) => aoBuscar(e.target.value)}
        placeholder="Pesquisar por código, empresa..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {carregando ? (
            <p className="p-4 text-gray-500">Carregando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">PIN</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => abrirDetalhe(p)}
                    className={`border-t cursor-pointer hover:bg-brand-50 ${
                      selecionada?.id === p.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <td className="p-3 font-mono">{p.codigo}</td>
                    <td className="p-3 font-mono">
                      {p.pin ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copiarTexto(p.pin!, "pin");
                          }}
                          title="Copiar PIN"
                          className="hover:underline"
                        >
                          {p.pin}
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3">{p.companies?.nome ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 space-x-2" onClick={(e) => e.stopPropagation()}>
                      {p.status !== "BLOQUEADA" ? (
                        <AcaoLink onClick={() => alterarStatus(p.id, "BLOQUEADA")}>Bloquear</AcaoLink>
                      ) : (
                        <AcaoLink onClick={() => alterarStatus(p.id, "ATIVA")}>Desbloquear</AcaoLink>
                      )}
                      <AcaoLink onClick={() => transferirPlaca(p.id)}>Transferir</AcaoLink>
                      <AcaoLink onClick={() => novoPin(p.codigo, p.id)}>Novo PIN</AcaoLink>
                      <AcaoLink onClick={() => resetarPlaca(p.codigo, p.id)}>Resetar</AcaoLink>
                      <AcaoLink onClick={() => excluirPlaca(p.codigo, p.id)}>Excluir</AcaoLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!carregando && filtradas.length > 0 && (
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t bg-gray-50 text-sm">
              <button
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={paginaAtual === 0}
                className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-gray-500">
                Página {paginaAtual + 1} de {totalPaginas} · {filtradas.length} placa(s)
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={paginaAtual >= totalPaginas - 1}
                className="px-3 py-1 rounded-lg border bg-white hover:bg-gray-100 disabled:opacity-40"
              >
                Próximo →
              </button>
            </div>
          )}
        </div>

        {selecionada && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono font-semibold">{selecionada.codigo}</p>
                <p className="text-sm text-gray-500">
                  PIN:{" "}
                  {selecionada.pin ? (
                    <button
                      onClick={() => copiarTexto(selecionada.pin!, "pin")}
                      className="font-mono hover:underline"
                    >
                      {selecionada.pin}
                      {copiado === "pin" ? " ✓ copiado" : ""}
                    </button>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              {selecionada.dds_links?.qr_png_path && (
                <img
                  src={publicStorageUrl("qr-codes", selecionada.dds_links.qr_png_path)}
                  alt="QR Code"
                  className="w-20 h-20 border rounded"
                />
              )}
            </div>

            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Empresa:</span> {selecionada.companies?.nome ?? "—"}</p>
              <p><span className="text-gray-500">Status da placa:</span> <StatusBadge status={selecionada.status} /></p>
              {selecionada.dds_links && (
                <p><span className="text-gray-500">Status do link:</span> {selecionada.dds_links.status}</p>
              )}
              {scansTotal && (
                <p>
                  <span className="text-gray-500">Acessos:</span> {scansTotal.total} (QR {scansTotal.qr} / NFC {scansTotal.nfc})
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">Telefones deixados antes de avaliar ({leads.length})</p>
                {leads.length > 0 && (
                  <button
                    onClick={() => copiarTexto(leads.map((l) => l.telefone).join(", "), "pin")}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Copiar todos
                  </button>
                )}
              </div>
              {leads.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum telefone deixado ainda.</p>
              ) : (
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {leads.map((l, i) => (
                    <li key={i} className="text-gray-600 flex justify-between gap-2">
                      <span className="font-mono">{l.telefone}</span>
                      <span className="text-gray-400">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selecionada.dds_links ? (
              <>
                <div className="text-sm space-y-2 bg-gray-50 rounded-lg p-3">
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
                  <p className="text-xs text-gray-400">
                    Grave este link do NFC (com o app NFC Tools, por exemplo) na etiqueta física — é o
                    mesmo QR, só muda o final (?src=nfc), pra separar os acessos nas estatísticas.
                  </p>
                </div>

                <div className="flex gap-2">
                  {selecionada.dds_links.qr_png_path && (
                    <a
                      href={publicStorageUrl("qr-codes", selecionada.dds_links.qr_png_path)}
                      download
                      className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100"
                    >
                      Baixar PNG
                    </a>
                  )}
                  {selecionada.dds_links.qr_svg_path && (
                    <a
                      href={publicStorageUrl("qr-codes", selecionada.dds_links.qr_svg_path)}
                      download
                      className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100"
                    >
                      Baixar SVG
                    </a>
                  )}
                  <button onClick={alternarPausaLink} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100">
                    {selecionada.dds_links.status === "PAUSADO" ? "Reativar link" : "Pausar link"}
                  </button>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Alterar destino (link de avaliação)</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      value={novoDestino}
                      onChange={(e) => setNovoDestino(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={salvarNovoDestino}
                      disabled={salvando}
                      className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    A imagem do QR não muda — só o destino do redirecionamento.
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Histórico de alterações</p>
                  {historico.length === 0 ? (
                    <p className="text-xs text-gray-400">Nenhuma alteração registrada ainda.</p>
                  ) : (
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {historico.map((h, i) => (
                        <li key={i} className="text-gray-500">
                          {new Date(h.created_at).toLocaleString("pt-BR")} — {h.destino_anterior ?? "(nenhum)"} → {h.destino_novo}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Esta placa não tem link dinâmico associado.</p>
            )}
          </div>
        )}
      </div>
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
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={valor}
          onFocus={(e) => e.target.select()}
          className="flex-1 min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-mono"
        />
        <button
          onClick={onCopiar}
          className="shrink-0 text-xs px-3 py-1 rounded-lg border hover:bg-gray-100 whitespace-nowrap"
        >
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function AcaoLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-brand-600 hover:underline text-xs">
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
  ATIVA: "bg-green-100 text-green-700",
  AGUARDANDO_ATIVACAO: "bg-yellow-100 text-yellow-700",
  CRIADA: "bg-gray-100 text-gray-700",
  BLOQUEADA: "bg-red-100 text-red-700",
  DESATIVADA: "bg-gray-200 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] ?? ""}`}>
      {status}
    </span>
  );
}
