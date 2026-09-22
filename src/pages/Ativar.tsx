import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase, callFunction } from "../lib/supabaseClient";

type Step = "codigo" | "empresa" | "cadastro" | "confirmado";

type Empresa = {
  google_place_id: string;
  nome: string;
  write_a_review_uri: string;
  google_maps_uri: string | null;
  rating: number | null;
  review_count: number | null;
  cidade?: string | null;
  estado?: string | null;
};

export default function Ativar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("codigo");
  const [codigo, setCodigo] = useState(params.get("codigo") ?? "");
  const [pin, setPin] = useState("");
  const [plateId, setPlateId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);

  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    whatsapp: "",
    senha: "",
    cidade: "",
    estado: "",
  });

  async function validarPin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const data = await callFunction<{ plate_id?: string; error?: string }>(
        "activate-plate",
        { codigo, pin }
      );
      if (data.error) throw new Error(data.error);
      setPlateId(data.plate_id!);
      setStep("empresa");
    } catch (e: any) {
      setErro(e.message ?? "Código ou PIN inválido.");
    } finally {
      setCarregando(false);
    }
  }

  function confirmarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nomeEmpresa.trim() || !placeId.trim()) {
      setErro("Preencha o nome da empresa e o Place ID.");
      return;
    }
    setEmpresaSelecionada({
      google_place_id: placeId.trim(),
      nome: nomeEmpresa.trim(),
      write_a_review_uri: `https://search.google.com/local/writereview?placeid=${placeId.trim()}`,
      google_maps_uri: `https://www.google.com/maps/place/?q=place_id:${placeId.trim()}`,
      rating: null,
      review_count: null,
    });
    setStep("cadastro");
  }

  async function finalizarCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!empresaSelecionada || !plateId) return;
    setErro(null);
    setCarregando(true);
    try {
      const { data: signUp, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
      });
      if (signUpError) throw signUpError;
      if (!signUp.user?.id) throw new Error("Falha ao criar usuário.");

      const result = await callFunction<{ company_id?: string; error?: string }>(
        "complete-activation",
        {
          plateId,
          profile: { nome: form.nome, sobrenome: form.sobrenome, whatsapp: form.whatsapp },
          empresa: { ...empresaSelecionada, cidade: form.cidade || null, estado: form.estado || null },
        }
      );
      if (result.error) throw new Error(result.error);

      setStep("confirmado");
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível concluir o cadastro.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        {step !== "confirmado" && (
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-3">
            ← Voltar
          </Link>
        )}
        {step === "codigo" && (
          <>
            <h1 className="text-xl font-semibold mb-1">Ative sua placa DDS Avaliações</h1>
            <p className="text-sm text-gray-500 mb-4">
              Digite o código impresso na placa e o PIN de ativação.
            </p>
            <form onSubmit={validarPin} className="space-y-3">
              <Input label="Código da placa" value={codigo} onChange={setCodigo} placeholder="DDS-A7K29P" />
              <Input label="PIN de ativação" value={pin} onChange={setPin} placeholder="000000" />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Botao carregando={carregando}>Validar</Botao>
            </form>
          </>
        )}

        {step === "empresa" && (
          <>
            <h1 className="text-xl font-semibold mb-1">Vincule sua empresa do Google</h1>
            <p className="text-sm text-gray-500 mb-4">
              Precisamos do "Place ID" da sua empresa no Google. É gratuito e rápido de achar:
              {" "}
              <a
                href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                target="_blank"
                rel="noreferrer"
                className="text-brand-600 underline"
              >
                clique aqui, digite o nome da sua empresa no mapa e copie o código que aparecer
              </a>.
            </p>
            <form onSubmit={confirmarEmpresa} className="space-y-3">
              <Input label="Nome da empresa" value={nomeEmpresa} onChange={setNomeEmpresa} placeholder="Ex: Padaria do João" />
              <Input label="Place ID" value={placeId} onChange={setPlaceId} placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4" />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Botao carregando={carregando}>Continuar</Botao>
            </form>
          </>
        )}

        {step === "cadastro" && empresaSelecionada && (
          <>
            <h1 className="text-xl font-semibold mb-1">Quase lá!</h1>
            <p className="text-sm text-gray-500 mb-4">
              Empresa selecionada: <strong>{empresaSelecionada.nome}</strong>
            </p>
            <form onSubmit={finalizarCadastro} className="space-y-3">
              <Input label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
              <Input label="Sobrenome" value={form.sobrenome} onChange={(v) => setForm({ ...form, sobrenome: v })} />
              <Input label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Input label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
              <Input label="Cidade" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} placeholder="Ex: Curitiba" required={false} />
              <Input label="Estado (UF)" value={form.estado} onChange={(v) => setForm({ ...form, estado: v.toUpperCase() })} placeholder="Ex: PR" required={false} />
              <Input label="Senha" value={form.senha} onChange={(v) => setForm({ ...form, senha: v })} type="password" />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Botao carregando={carregando}>Concluir cadastro</Botao>
            </form>
          </>
        )}

        {step === "confirmado" && (
          <div className="text-center space-y-4">
            <h1 className="text-xl font-semibold">Sua placa está pronta! 🎉</h1>
            <p className="text-gray-600">{empresaSelecionada?.nome}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
            >
              Ir para o painel
            </button>
          </div>
        )}
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
