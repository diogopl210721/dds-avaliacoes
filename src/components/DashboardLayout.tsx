import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Tags,
  Star,
  MousePointerClick,
  FileBarChart,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/empresa", label: "Minha Empresa", icon: Building2 },
  { to: "/dashboard/placas", label: "Minhas Placas", icon: Tags },
  { to: "/dashboard/avaliacoes", label: "Avaliações", icon: Star },
  { to: "/dashboard/acessos", label: "Acessos", icon: MousePointerClick },
  { to: "/dashboard/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export default function DashboardLayout({
  empresaNome,
  cidadeEstado,
  children,
}: {
  empresaNome: string;
  cidadeEstado?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
            D
          </div>
          <div>
            <p className="font-semibold leading-tight">DDS</p>
            <p className="text-[10px] text-gray-400 leading-tight tracking-wide">AVALIAÇÕES</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm">
            <span className="text-gray-400">📍</span>
            <div className="text-left">
              <p className="font-medium leading-tight">{empresaNome}</p>
              {cidadeEstado && <p className="text-xs text-gray-400 leading-tight">{cidadeEstado}</p>}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
