import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Star, MessageCircle, Users, TrendingUp, RefreshCw } from "lucide-react";
import { supabase, callFunction } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/DashboardLayout";

type Company = {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  rating: number | null;
  review_count: number | null;
  last_manual_refresh_at: string | null;
};
type Snapshot = { rating: number; review_count: number; captured_at: string };

export default function Dashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [scansTotal, setScansTotal] = useState(0);
  const [scansQr, setScansQr] = useState(0);
  const [scansNfc, setScansNfc] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: comp } = await supabase
        .from("companies")
        .select("id, nome, cidade, estado, rating, review_count, last_manual_refresh_at")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!comp) return;
      setCompany(comp);

      const { data: snaps } = await supabase
        .from("review_snapshots")
        .select("rating, review_count, captured_at")
        .eq("company_id", comp.id)
        .order("captured_at", { ascending: true });
      setSnapshots(snaps ?? []);

      const { count: total } = await supabase
        .from("link_scan_events")
        .select("id", { count: "exact", head: true })
        .eq("company_id", comp.id);
      const { count: qr } = await supabase
        .from("link_scan_events")
        .select("id", { count: "exact", head: true })
        .eq("company_id", comp.id)
        .eq("source", "QR");
      const { count: nfc } = await supabase
        .from("link_scan_events")
        .select("id", { count: "exact", head: true })
        .eq("company_id", comp.id)
        .eq("source", "NFC");
      setScansTotal(total ?? 0);
      setScansQr(qr ?? 0);
      setScansNfc(nfc ?? 0);
    })();
  }, [user]);

  async function atualizarAgora() {
    if (!company) return;
    setAtualizando(true);
    setMsg(null);
    try {
      const data = await callFunction<{ rating?: number; review_count?: number; error?: string }>(
        "manual-refresh",
        { companyId: company.id }
      );
      if (data.error) throw new Error(data.error);
      setCompany({
        ...company,
        rating: data.rating ?? company.rating,
        review_count: data.review_count ?? company.review_count,
      });
      setMsg("Atualizado com sucesso.");
    } catch (e: any) {
      setMsg(e.message ?? "Não foi possível atualizar agora.");
    } finally {
      setAtualizando(false);
    }
  }

  if (!company) {
    return <div className="p-8 text-gray-500">Carregando seu painel...</div>;
  }

  const chartData = snapshots.map((s) => ({
    data: new Date(s.captured_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    nota: s.rating,
    avaliacoes: s.review_count,
  }));

  const cidadeEstado = [company.cidade, company.estado].filter(Boolean).join(" - ") || null;

  // Variações vs. o snapshot anterior — só exibe quando há histórico suficiente.
  const anterior = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const deltaNota = anterior && company.rating != null ? +(company.rating - anterior.rating).toFixed(1) : null;
  const deltaAvaliacoes = anterior && company.review_count != null ? company.review_count - anterior.review_count : null;

  return (
    <DashboardLayout empresaNome={company.nome} cidadeEstado={cidadeEstado}>
      <p className="text-sm text-gray-400 mb-1">Olá!</p>
      <h1 className="text-2xl font-bold mb-6">Aqui está o resumo da sua empresa</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Star size={20} className="text-amber-500" fill="currentColor" />}
          iconBg="bg-amber-50"
          label="Nota atual"
          valor={company.rating != null ? company.rating.toFixed(1).replace(".", ",") : "—"}
          delta={deltaNota != null ? `${deltaNota >= 0 ? "+" : ""}${deltaNota}`.replace(".", ",") : null}
          deltaSufixo="nos últimos 30 dias"
        />
        <StatCard
          icon={<MessageCircle size={20} className="text-brand-600" />}
          iconBg="bg-brand-50"
          label="Total de avaliações"
          valor={company.review_count ?? "—"}
          delta={deltaAvaliacoes != null ? `+${deltaAvaliacoes}` : null}
          deltaSufixo="novas avaliações"
        />
        <StatCard
          icon={<Users size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          label="Acessos pela placa"
          valor={scansTotal}
          delta={null}
          deltaSufixo={`QR ${scansQr} · NFC ${scansNfc}`}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-gray-400" />
          <h2 className="font-semibold">Evolução da sua reputação</h2>
        </div>
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <XAxis dataKey="data" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="nota" domain={[0, 5]} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="avaliacoes" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="avaliacoes"
                dataKey="avaliacoes"
                name="Quantidade de avaliações"
                fill="#a7f3d0"
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
              <Line
                yAxisId="nota"
                type="monotone"
                dataKey="nota"
                name="Nota"
                stroke="#2f6fed"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">
            Ainda não há histórico suficiente — o gráfico aparece a partir da segunda atualização.
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-medium">Atualização automática: semanal</p>
          <p className="text-sm text-gray-500">
            Quer ver o número mais novo agora? Use o botão ao lado (limite de 1x a cada 24h).
          </p>
        </div>
        <button
          onClick={atualizarAgora}
          disabled={atualizando}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          <RefreshCw size={16} className={atualizando ? "animate-spin" : ""} />
          {atualizando ? "Atualizando..." : "Atualizar agora"}
        </button>
      </div>
      {msg && <p className="text-sm text-gray-600 mt-2">{msg}</p>}
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  valor,
  delta,
  deltaSufixo,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  valor: string | number;
  delta: string | null;
  deltaSufixo: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {delta && (
        <p className="text-xs font-medium text-green-600 flex items-center gap-1">
          <TrendingUp size={12} /> {delta} <span className="text-gray-400 font-normal">{deltaSufixo}</span>
        </p>
      )}
      {!delta && deltaSufixo && <p className="text-xs text-gray-400">{deltaSufixo}</p>}
    </div>
  );
}
