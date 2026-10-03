import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { callFunction } from "../lib/supabaseClient";

export default function Ativar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState(params.get("codigo") ?? "");
  const [pin, setPin] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [linkAvaliacao, setLinkAvaliacao] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [concluido, setConcluido] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const link = linkAvaliacao.trim();
    if (!codigo.trim() || !pin.trim()) {
      setErro("Preencha o código da placa e o PIN.");
      return;
    }
    if (!nomeEmpresa.trim() || !link) {
      setErro("Preencha o nome da empresa e o link de avaliação.");
      return;
    }
    if (!link.startsWith("http")) {
      setErro("Cole o link completo (começando com https://).");
      return;
    }

    setCarregando(true);
    try {
      const data = await callFunction<{ ok?: boolean; error?: string }>(
        "registrar-placa",
        {
          codigo: codigo.trim(),
          pin: pin.trim(),
          nomeEmpresa: nomeEmpresa.trim(),
          reviewLink: link,
          cidade: cidade || null,
          estado: estado || null,
        }
      );
      if (data.error) throw new Error(data.error);
      setConcluido(true);
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível concluir o cadastro.");
    } finally {
      setCarregando(false);
    }
  }

  if (concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow p-6 text-center space-y-4">
          <h1 className="text-xl font-semibold">Sua placa está pronta! 🎉</h1>
          <p className="text-gray-600">{nomeEmpresa}</p>
          <p className="text-sm text-gray-500">
            Guarde o código <strong>{codigo.trim().toUpperCase()}</strong> e o PIN — você vai
            usá-los sempre que quiser alterar o link ou ver as estatísticas da sua placa.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/analise")}
              className="px-5 py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
            >
              Ver estatísticas da minha placa
            </button>
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              Voltar ao início
            </Link>
          </div>
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
        <h1 className="text-xl font-semibold mb-1">Cadastre sua placa DDS Avaliações</h1>
        <p className="text-sm text-gray-500 mb-4">
          Digite o código impresso na placa, o PIN de 4 dígitos e o link de avaliação da sua
          empresa no Google. Sem necessidade de criar conta.
        </p>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-4 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">Não tem o link de avaliação ainda?</p>
          <p>
            <strong>Oficial:</strong>{" "}
            <a href="https://business.google.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">
              business.google.com
            </a>{" "}
            → sua empresa → "Receber mais avaliações" → copiar link.
          </p>
          <p>
            <strong>Alternativa gratuita:</strong>{" "}
            <a href="https://productmate.com/google-review-link-generator" target="_blank" rel="noreferrer" className="text-brand-600 underline">
              productmate.com/google-review-link-generator
            </a>
          </p>
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <Input label="Código da placa" value={codigo} onChange={setCodigo} placeholder="Ex: DDS215" />
          <Input label="PIN" value={pin} onChange={setPin} placeholder="0000" />
          <Input label="Nome da empresa" value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: Padaria do João" />
          <Input label="Link de avaliação" value={linkAvaliacao} onChange={setLinkAvaliacao} placeholder="Cole aqui o link que você copiou" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cidade" value={cidade} onChange={setCidade} required={false} />
            <Input label="Estado (UF)" value={estado} onChange={(v) => setEstado(v.toUpperCase())} required={false} />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Botao carregando={carregando}>Salvar</Botao>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </label>
  );
}

function Botao({ children, carregando }: { children: React.ReactNode; carregando: boolean }) {
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
