import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, QrCode, Nfc, ExternalLink, Star } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/DashboardLayout";
import { CountUp } from "../../components/ui/Fx";

type Company = {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  write_a_review_uri: string | null;
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [scansTotal, setScansTotal] = useState(0);
  const [scansQr, setScansQr] = useState(0);
  const [scansNfc, setScansNfc] = useState(0);
  const [porDia, setPorDia] = useState<{ dia: string; acessos: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: comp } = await supabase
        .from("companies")
        .select("id, nome, cidade, estado, write_a_review_uri")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!comp) return;
      setCompany(comp);

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

      const { data: eventos } = await supabase
        .from("link_scan_events")
        .select("created_at")
        .eq("company_id", comp.id)
        .order("created_at", { ascending: false })
        .limit(1000);

      const contagem = [0, 0, 0, 0, 0, 0, 0];
      (eventos ?? []).forEach((e) => {
        const dia = new Date(e.created_at).getDay();
        contagem[dia] += 1;
      });
      setPorDia(DIAS.map((dia, i) => ({ dia, acessos: contagem[i] })));
    })();
  }, [user]);

  if (!company) {
    return (
      <div className="min-h-[100dvh] bg-[#f4f6fb] p-6 sm:p-10">
        <div className="max-w-5xl mx-auto space-y-4" aria-busy="true">
          <p className="text-sm text-ink-muted">Carregando seu painel...</p>
          <div className="grid sm:grid-cols-3 gap-4">{[0, 1, 2].map(i => <div key={i} className="dds-skel h-32 !rounded-[22px]" />)}</div>
          <div className="dds-skel h-72 !rounded-[22px]" />
        </div>
      </div>
    );
  }

  const cidadeEstado = [company.cidade, company.estado].filter(Boolean).join(" - ") || null;

  return (
    <DashboardLayout empresaNome={company.nome} cidadeEstado={cidadeEstado}>
      <p className="text-sm font-semibold text-brand-600 mb-1 dds-rise">Olá!</p>
      <h1 className="font-display text-[clamp(26px,3.4vw,34px)] font-extrabold tracking-[-.04em] leading-tight mb-6 dds-rise" style={{ ["--d" as string]: ".05s" }}>Aqui está o resumo da sua placa</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users size={20} />} label="Acessos pela placa" valor={scansTotal} d={0} />
        <StatCard icon={<QrCode size={20} />} label="Via QR Code" valor={scansQr} d={.06} />
        <StatCard icon={<Nfc size={20} />} label="Via NFC" valor={scansNfc} d={.12} violet />
      </div>

      <div className="dds-card dds-card-pad mb-6">
        <h2 className="font-display font-bold mb-4">Acessos por dia da semana</h2>
        {scansTotal > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porDia} margin={{ left: -18, right: 4, top: 8 }}>
              <defs>
                <linearGradient id="dds-dash-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#399cff" />
                  <stop offset="1" stopColor="#1a6fe0" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#eef2f8" />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#5b6b8c" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5b6b8c" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#eef6ff" }} contentStyle={{ borderRadius: 12, border: "1px solid #e3e8f2", boxShadow: "0 12px 32px -16px #0b142666" }} />
              <Bar dataKey="acessos" fill="url(#dds-dash-bar)" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#d6deec] bg-[#f9fbfe] px-4 py-5 text-sm text-ink-muted">
            Ainda não houve nenhum acesso pela placa. Assim que alguém escanear o QR ou usar o NFC, os dados aparecem aqui.
          </p>
        )}
      </div>

      {company.write_a_review_uri && (
        <div className="dds-card dds-card-pad flex items-start gap-4">
          <span className="dds-icon-tile shrink-0"><Star size={20} /></span>
          <div className="min-w-0">
            <p className="font-display font-bold mb-1">Link de avaliação vinculado</p>
            <a
              href={company.write_a_review_uri}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-start gap-1.5 text-sm text-brand-600 hover:text-brand-700 break-all"
            >
              {company.write_a_review_uri} <ExternalLink size={14} className="shrink-0 mt-0.5" />
            </a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({ icon, label, valor, d, violet = false }: { icon: React.ReactNode; label: string; valor: number; d: number; violet?: boolean }) {
  return (
    <div className="dds-card dds-lift p-5 dds-rise" style={{ ["--d" as string]: `${d}s` }}>
      <span className={`dds-icon-tile ${violet ? "!bg-gradient-to-br !from-[#f3f0ff] !to-[#e6e0ff] !text-[#6d5ae6] !shadow-[inset_0_0_0_1px_#d9d1ff]" : ""}`}>{icon}</span>
      <p className="mt-4 font-display text-[32px] leading-none font-extrabold tracking-[-.04em]"><CountUp value={valor} /></p>
      <p className="mt-1.5 text-sm text-ink-muted">{label}</p>
    </div>
  );
}
