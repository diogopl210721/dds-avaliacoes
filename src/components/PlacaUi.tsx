import { NavLink, Link } from "react-router-dom";

// Peças compartilhadas pelas telas públicas da placa (ativar, trocar link,
// recuperar código): menu de abas, campo de texto e botão de envio.

const ABAS = [
  { to: "/ativar", rotulo: "Ativar" },
  { to: "/editar", rotulo: "Trocar link" },
  { to: "/recuperar", rotulo: "Recuperar" },
  { to: "/analise", rotulo: "Estatísticas" },
];

export function MenuPlaca() {
  return (
    <div className="mb-4">
      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-3">
        ← Voltar ao início
      </Link>
      <nav className="grid grid-cols-4 gap-1 bg-gray-100 rounded-lg p-1 text-xs sm:text-sm">
        {ABAS.map((a) => (
          <NavLink
            key={a.to}
            to={a.to}
            className={({ isActive }) =>
              `text-center py-2 rounded-md font-medium ${
                isActive ? "bg-white shadow text-brand-700" : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            {a.rotulo}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function Campo({
  label,
  value,
  onChange,
  placeholder,
  ajuda,
  readOnly = false,
  inputMode,
  maxLength,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  ajuda?: string;
  readOnly?: boolean;
  inputMode?: "numeric" | "text" | "url";
  maxLength?: number;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
          readOnly ? "bg-gray-50 text-gray-500 font-mono" : ""
        }`}
      />
      {ajuda && <span className="block text-xs text-gray-400 mt-1">{ajuda}</span>}
    </label>
  );
}

export function BotaoEnviar({
  children,
  carregando,
}: {
  children: React.ReactNode;
  carregando: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={carregando}
      className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
    >
      {carregando ? "Aguarde..." : children}
    </button>
  );
}

// Só aceita números, até 4 (a senha da placa).
export function somente4Digitos(v: string): string {
  return v.replace(/\D/g, "").slice(0, 4);
}

export function CopiarBotao({ texto, rotulo }: { texto: string; rotulo: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(texto).catch(() => {})}
      className="text-xs px-2.5 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
    >
      {rotulo}
    </button>
  );
}
