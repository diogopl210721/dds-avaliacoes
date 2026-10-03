import { useState } from "react";
import { Link } from "react-router-dom";
import { callFunction } from "../lib/supabaseClient";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Lead = { telefone: string; created_at: string };

type Resultado = {
  codigo: string;
  empresa: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
  totalAcessos: number;
  porDia: Record<string, number>;
  porMes: Record<string, number>;
  porAno: Record<string, number>;
  porOrigem: Record<string, number>;
  telefones: Lead[];
};

// Monta o endereço pro cabeçalho dos relatórios: usa o endereço completo se
// tiver sido cadastrado, senão cai pra cidade/estado, senão fica em branco.
function enderecoCompleto(r: Resultado): string {
  if (r.endereco) {
    const cidadeEstado = [r.cidade, r.estado].filter(Boolean).join(" - ");
    return cidadeEstado ? `${r.endereco}, ${cidadeEstado}` : r.endereco;
  }
  return [r.cidade, r.estado].filter(Boolean).join(" - ") || "—";
}

// Converte um telefone digitado de qualquer jeito num link wa.me válido,
// assumindo Brasil quando não vier o código do país.
function linkWhatsapp(telefoneBruto: string): string {
  let digitos = telefoneBruto.replace(/\D/g, "");
  digitos = digitos.replace(/^0+/, "");
  if (!digitos.startsWith("55") && (digitos.length === 10 || digitos.length === 11)) {
    digitos = "55" + digitos;
  }
  return `https://wa.me/${digitos}`;
}

export default function Analise() {
  const [codigo, setCodigo] = useState("");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

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
    } catch (e: any) {
      setErro(e.message ?? "Código ou PIN inválido.");
    } finally {
      setCarregando(false);
    }
  }

  function exportarExcel() {
    if (!resultado) return;
    const empresa = resultado.empresa ?? "Sua placa";
    const endereco = enderecoCompleto(resultado);

    const cabecalho = [
      ["Cliente", empresa],
      ["Código da placa", resultado.codigo],
      ["Endereço", endereco],
      [],
      ["Telefone", "Data"],
      ...resultado.telefones.map((l) => [l.telefone, new Date(l.created_at).toLocaleString("pt-BR")]),
    ];

    const planilha = XLSX.utils.aoa_to_sheet(cabecalho);
    planilha["!cols"] = [{ wch: 22 }, { wch: 22 }];
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, "Telefones");
    XLSX.writeFile(livro, `telefones-${resultado.codigo}.xlsx`);
  }

  function exportarPdf() {
    if (!resultado) return;
    const empresa = resultado.empresa ?? "Sua placa";
    const endereco = enderecoCompleto(resultado);

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(empresa, 14, 18);
    doc.setFontSize(10);
    doc.text(`Código da placa: ${resultado.codigo}`, 14, 26);
    doc.text(`Endereço: ${endereco}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [["Telefone", "Data"]],
      body: resultado.telefones.map((l) => [l.telefone, new Date(l.created_at).toLocaleString("pt-BR")]),
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`telefones-${resultado.codigo}.pdf`);
  }

  if (resultado) {
    const ultimosDias = Object.entries(resultado.porDia)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 30);
    const ultimosMeses = Object.entries(resultado.porMes)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 12);
    const anos = Object.entries(resultado.porAno).sort((a, b) => (a[0] < b[0] ? 1 : -1));

    return (
      <div className="min-h-screen px-4 py-8 flex justify-center">
        <div className="w-full max-w-2xl space-y-6">
          <div>
            <button
              onClick={() => setResultado(null)}
              className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-3"
            >
              ← Voltar
            </button>
            <h1 className="text-xl font-semibold">{resultado.empresa ?? "Sua placa"}</h1>
            <p className="text-sm text-gray-500">
              Código: {resultado.codigo} · Status: {resultado.status}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card titulo="Total de acessos" valor={resultado.totalAcessos} />
            <Card titulo="QR" valor={resultado.porOrigem.QR ?? 0} />
            <Card titulo="NFC" valor={resultado.porOrigem.NFC ?? 0} />
          </div>

          <Secao titulo={`Telefones de clientes (${resultado.telefones.length})`}>
            <div className="flex justify-end gap-2 mb-3">
              <button
                onClick={exportarExcel}
                disabled={resultado.telefones.length === 0}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100 disabled:opacity-40"
              >
                Exportar Excel
              </button>
              <button
                onClick={exportarPdf}
                disabled={resultado.telefones.length === 0}
                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-100 disabled:opacity-40"
              >
                Exportar PDF
              </button>
            </div>
            {resultado.telefones.length === 0 ? (
              <SemDados />
            ) : (
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {resultado.telefones.map((l, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-sm border-b border-gray-100 py-1.5 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{l.telefone}</p>
                      <p className="text-xs text-gray-400">{new Date(l.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <a
                      href={linkWhatsapp(l.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600"
                    >
                      WhatsApp
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Acessos por dia (últimos 30 dias com registro)">
            {ultimosDias.length === 0 ? (
              <SemDados />
            ) : (
              <Tabela linhas={ultimosDias} />
            )}
          </Secao>

          <Secao titulo="Acessos por mês">
            {ultimosMeses.length === 0 ? <SemDados /> : <Tabela linhas={ultimosMeses} />}
          </Secao>

          <Secao titulo="Acessos por ano">
            {anos.length === 0 ? <SemDados /> : <Tabela linhas={anos} />}
          </Secao>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-3">
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold mb-1">Análise da sua placa</h1>
        <p className="text-sm text-gray-500 mb-4">
          Digite o código e o PIN da sua placa para ver quantas pessoas acessaram, por dia, mês e
          ano.
        </p>
        <form onSubmit={consultar} className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-600">Código da placa</span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: DDS215"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">PIN</span>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="0000"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {carregando ? "Aguarde..." : "Consultar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 text-center">
      <p className="text-2xl font-semibold text-brand-600">{valor}</p>
      <p className="text-xs text-gray-500 mt-1">{titulo}</p>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{titulo}</h2>
      {children}
    </div>
  );
}

function Tabela({ linhas }: { linhas: [string, number][] }) {
  return (
    <div className="space-y-1">
      {linhas.map(([chave, valor]) => (
        <div key={chave} className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{chave}</span>
          <span className="font-medium text-gray-800">{valor}</span>
        </div>
      ))}
    </div>
  );
}

function SemDados() {
  return <p className="text-sm text-gray-400">Ainda não há acessos registrados.</p>;
}
