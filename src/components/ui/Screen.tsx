import { ReactNode } from "react";
import { Aurora, BrandMark, Spinner } from "./Fx";

// Tela cheia de espera ou aviso, no visual escuro do sistema.
export function ScreenMessage({ children, light = false }: { children: ReactNode; light?: boolean }) {
  if (light) return <div className="min-h-[100dvh] grid place-items-center px-4 text-ink-muted bg-[#f4f6fb]">{children}</div>;
  return (
    <div className="dds-dark min-h-[100dvh] grid place-items-center px-4 text-[#cfe0fb]">
      <Aurora calm />
      <div className="absolute top-5 left-5"><BrandMark /></div>
      {children}
    </div>
  );
}

export function ScreenLoading({ label = "Carregando…", light = false }: { label?: string; light?: boolean }) {
  return <ScreenMessage light={light}><p className="flex items-center gap-3 text-sm font-medium" role="status"><Spinner />{label}</p></ScreenMessage>;
}
