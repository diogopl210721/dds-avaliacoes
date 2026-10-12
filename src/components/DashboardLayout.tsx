import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Tags,
  Star,
  MousePointerClick,
  FileBarChart,
  Settings,
  MapPin,
} from "lucide-react";
import { BrandMark } from "./ui/Fx";

const navItems = [
  { to: "/minisite", label: "Minha mini página", icon: Building2 },
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
    <div className="min-h-[100dvh] lg:flex bg-[#f4f6fb]">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-navy-950 text-[#cfe0fb] sticky top-0 h-[100dvh] border-r border-white/[.06]">
        <div className="px-5 h-16 flex items-center border-b border-white/[.06]"><BrandMark /></div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-brand-500/90 to-brand-500/50 text-white shadow-[inset_0_0_0_1px_#399cff55]"
                    : "text-[#a7b7d1] hover:bg-white/[.06] hover:text-white"
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
        <header className="h-16 border-b border-[#e3e8f2] bg-white/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6">
          <div className="lg:hidden"><BrandMark dark={false} /></div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#e3e8f2] bg-white text-sm min-w-0">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-50 text-brand-600 shrink-0"><MapPin size={15} /></span>
            <div className="text-left min-w-0">
              <p className="font-semibold leading-tight truncate">{empresaNome}</p>
              {cidadeEstado && <p className="text-xs text-ink-muted leading-tight truncate">{cidadeEstado}</p>}
            </div>
          </div>
        </header>
        <nav className="lg:hidden flex gap-1.5 overflow-x-auto px-4 py-3 bg-white border-b border-[#e3e8f2] dds-scroll">
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? "bg-brand-500 text-white" : "bg-[#f1f4f9] text-ink-soft"}`}>{label}</NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
