import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, QrCode, Smartphone } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/DashboardLayout";

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
    return <div className="p-8 text-gray-500">Carregando seu painel...</div>;
  }

  const cidadeEstado = [company.cidade, company.estado].filter(Boolean).join(" - ") || null;

  return (
    <DashboardLayout empresaNome={company.nome} cidadeEstado={cidadeEstado}>
      <p className="text-sm text-gray-400 mb-1">Olá!</p>
      <h1 className="text-2xl font-bold mb-6">Aqui está o resumo da sua placa</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Users size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          label="Acessos pela placa"
          valor={scansTotal}
        />
        <StatCard
          icon={<QrCode size={20} className="text-brand-600" />}
          iconBg="bg-brand-50"
          label="Via QR Code"
          valor={scansQr}
        />
        <StatCard
          icon={<Smartphone size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Via NFC"
          valor={scansNfc}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold mb-4">Acessos por dia da semana</h2>
        {scansTotal > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porDia}>
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="acessos" fill="#2f6fed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">
            Ainda não houve nenhum acesso pela placa. Assim que alguém escanear o QR ou usar o NFC, os dados aparecem aqui.
          </p>
        )}
      </div>

      {company.write_a_review_uri && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="font-medium mb-1">Link de avaliação vinculado</p>
          
            href={company.write_a_review_uri}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-brand-600 underline break-all"
          >
            {company.write_a_review_uri}
          </a>
        </div>
      )}
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  valor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  valor: string | number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${iconBg}`}>{icon}</div>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
