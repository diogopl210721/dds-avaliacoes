import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { publicStorageUrl } from "../../lib/storage";

type DdsLink = {
  id: string;
  codigo: string;
  slug: string;
  produto: string;
  destino_atual: string | null;
  status: string;
  qr_png_path: string | null;
  qr_svg_path: string | null;
  created_at: string;
  companies: { nome: string } | null;
  plates: { codigo: string; ultimo_acesso_em: string | null }[];
};

type Historico = { destino_anterior: string | null; destino_novo: string; created_at: string };

export default function AdminQrCodes() {
  const [links, setLinks] = useState<DdsLink[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<DdsLink | null>(null);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [novoDestino, setNovoDestino] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [scansTotal, setScansTotal] = useState<{ total: number; qr: number; nfc: number } | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("dds_links")
      .select(
        "id, codigo, slug, produto, destino_atual, status, qr_png_path, qr_svg_path, created_at, companies(nome), plates(codigo, ultimo_acesso_em)"
      )
      .order("created_at", { ascending: false });
    setLinks((data as any) ?? []);
    setCarregando(false);
  }

  const filtrados = links.filter((l) => {
    if (!busca) return true;
    const alvo = busca.toLowerCase();
    return (
      l.codigo.toLowerCase().includes(alvo) ||
      l.slug.toLowerCase().includes(alvo) ||
      l.companies?.nome?.toLowerCase().includes(alvo) ||
      l.plates?.[0]?.codigo?.toLowerCase().includes(alvo)
    );
  });

  async function abrirDetalhe(link: DdsLink) {
    setSelecionado(link);
    setNovoDestino(link.destino_atual ?? "");

    const { data: hist } = await supabase
      .from("link_destination_history")
      .select("destino_anterior, destino_novo, created_at")
      .eq("link_id", link.id)
      .order("created_at", { ascending: false });
    setHistorico(hist ?? []);

    const { count: total } = await supabase
      .from("link_scan_events")
      .select("id", { count: "exact", head: true })
      .eq("link_id", link.id);
    const { count: qr } = await supabase
      .from("link_scan_events")
      .select("id", { count: "exact", head: true })
      .eq("link_id", link.id)
      .eq("source", "QR");
    const { count: nfc } = await supabase
      .from("link_scan_events")
      .select("id", { count: "exact", head: true })
      .eq("link_id", link.id)
      .eq("source", "NFC");
    setScansTotal({ total: total ?? 0, qr: qr ?? 0, nfc: nfc ?? 0 });
  }

  async function salvarNovoDestino() {
    if (!selecionado || !novoDestino) return;
    setSalvando(true);
    const { error } = await supabase.rpc("alter_link_destino", {
      p_link_id: selecionado.id,
      p_novo_destino: novoDestino,
    });
    setSalvando(false);
    if (error) return alert("Não foi possível alterar o destino: " + error.message);
    await carregar();
    await abrirDetalhe({ ...selecionado, destino_atual: novoDestino, status: "ATIVO" });
  }

  async function alternarPausa() {
    if (!selecionado) return;
    const novoStatus = selecionado.status === "PAUSADO" ? "ATIVO" : "PAUSADO";
    await supabase.from("dds_links").update({ status: novoStatus }).eq("id", selecionado.id);
    await carregar();
    setSelecionado({ ...selecionado, status: novoStatus });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">QR Codes</h1>
        <Link to="/admin" className="text-sm text-brand-600 hover:underline">
          ← Ver Placas
        </Link>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Pesquisar por código do QR, código da placa ou empresa..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-4"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {carregando ? (
            <p className="p-4 text-gray-500">Carregando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">QR</th>
                  <th className="p-3">Empresa</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => abrirDetalhe(l)}
                    className={`border-t cursor-pointer hover:bg-brand-50 ${selecionado?.id === l.id ? "bg-brand-50" : ""}`}
                  >
                    <td className="p-3 font-mono">{l.codigo}</td>
                    <td className="p-3">{l.companies?.nome ?? "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selecionado && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono font-semibold">{selecionado.codigo}</p>
                <p className="text-xs text-gray-500">go.ddsinovacao.com.br/{selecionado.slug}</p>
              </div>
              {selecionado.qr_png_path && (
                <img
                  src={publicStorageUrl("qr-codes", selecionado.qr_png_path)}
                  alt="QR Code"
                  className="w-20 h-20 border rounded"
                />
              )}
            </div>

            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Empresa:</span> {selecionado.companies?.nome ?? "—"}</p>
              <p><span className="text-gray-500">Placa:</span> {selecionado.plates?.[0]?.codigo ?? "—"}</p>
              <p><span className="text-gray-500">Status:</span> <StatusBadge status={selecionado.status} /></p>
              {scansTotal && (
                <p>
                  <span className="text-gray-500">Acessos:</span> {scansTotal.total} (QR {scansTotal.qr} / NFC {scansTotal.nfc})
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {selecionado.qr_png_path && (
                <a href={publicStorageUrl("qr-codes", selecionado.qr_png_path)} download className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100">
                  Baixar PNG
                </a>
              )}
              {selecionado.qr_svg_path && (
                <a href={publicStorageUrl("qr-codes", selecionado.qr_svg_path)} download className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100">
                  Baixar SVG
                </a>
              )}
              <button onClick={alternarPausa} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100">
                {selecionado.status === "PAUSADO" ? "Reativar" : "Pausar"}
              </button>
            </div>

            <div>
              <label className="text-sm text-gray-600">Alterar destino</label>
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
          </div>
        )}
      </div>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-700",
  AGUARDANDO_DESTINO: "bg-yellow-100 text-yellow-700",
  PAUSADO: "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] ?? ""}`}>
      {status}
    </span>
  );
}
