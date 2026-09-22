import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase, callFunction } from "../../lib/supabaseClient";

type Plate = {
  id: string;
  codigo: string;
  slug: string;
  status: string;
  apelido: string | null;
  company_id: string | null;
  companies: { nome: string } | null;
  ultimo_acesso_em: string | null;
};

type PlacaCriada = {
  codigo: string;
  slug: string;
  pin: string;
  urlQr: string;
  urlNfc: string;
  qrPngDataUrl: string;
};

export default function AdminPlacas() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [quantidade, setQuantidade] = useState(10);
  const [criando, setCriando] = useState(false);
  const [loteCriado, setLoteCriado] = useState<PlacaCriada[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("plates")
      .select("id, codigo, slug, status, apelido, company_id, ultimo_acesso_em, companies(nome)")
      .order("created_at", { ascending: false });
    setPlates((data as any) ?? []);
    setCarregando(false);
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
    // Sem depender de biblioteca de ZIP: baixa cada QR como PNG separado.
    // (Se preferir tudo em um único .zip, dá para adicionar JSZip depois —
    // deixei simples aqui para não inflar as dependências do MVP.)
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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Placas</h1>
          <Link to="/admin/qrcodes" className="text-sm text-brand-600 hover:underline">
            Ver QR Codes →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-end gap-3">
          <label className="block">
            <span className="text-sm text-gray-600">Quantidade</span>
            <input
              type="number"
              min={1}
              max={500}
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

        {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}

        {loteCriado && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="font-medium mb-2">
              {loteCriado.length} placa(s) criada(s). Baixe agora — o PIN não fica mais visível depois.
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

        {carregando ? (
          <p className="text-gray-500">Carregando...</p>
        ) : (
          <table className="w-full bg-white rounded-xl shadow overflow-hidden text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Empresa</th>
                <th className="p-3">Status</th>
                <th className="p-3">Último acesso</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plates.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-mono">{p.codigo}</td>
                  <td className="p-3">{p.companies?.nome ?? "—"}</td>
                  <td className="p-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-3 text-gray-500">
                    {p.ultimo_acesso_em ? new Date(p.ultimo_acesso_em).toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="p-3 space-x-2">
                    {p.status !== "BLOQUEADA" ? (
                      <AcaoLink onClick={() => alterarStatus(p.id, "BLOQUEADA")}>Bloquear</AcaoLink>
                    ) : (
                      <AcaoLink onClick={() => alterarStatus(p.id, "ATIVA")}>Desbloquear</AcaoLink>
                    )}
                    <AcaoLink onClick={() => transferirPlaca(p.id)}>Transferir</AcaoLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
