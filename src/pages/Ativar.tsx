import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { callFunction } from "../lib/supabaseClient";

type PlaceResumo = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
};

type PlaceSelecionado = {
  google_place_id: string;
  nome: string;
  endereco: string | null;
  write_a_review_uri: string | null;
};

export default function Ativar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState(params.get("codigo") ?? "");
  const [pin, setPin] = useState("");

  // Busca da empresa (Google) — substitui o antigo campo de texto livre.
  const [buscaEmpresa, setBuscaEmpresa] = useState("");
  const [resultados, setResultados] = useState<PlaceResumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<PlaceSelecionado | null>(null);
  const [carregandoSelecao, setCarregandoSelecao] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fluxo padrão: passo a passo gratuito (productmate/business.google.com),
  // sem depender de uma chave paga do Google Places. A busca automática
  // (Google Places) fica como opção avançada, pra quem configurar a chave.
  const [modoManual, setModoManual] = useState(true);
  const [nomeEmpresaManual, setNomeEmpresaManual] = useState("");
  const [linkAvaliacaoManual, setLinkAvaliacaoManual] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [nomeFinal, setNomeFinal] = useState("");

  useEffect(() => {
    if (modoManual) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (buscaEmpresa.trim().length < 3) {
      setResultados([]);
      return;
    }
    debounceRef.current = setTimeout(() => buscarEmpresas(buscaEmpresa), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaEmpresa, modoManual]);

  async function buscarEmpresas(query: string) {
    setBuscando(true);
    setErroBusca(null);
    try {
      const data = await callFunction<{ places?: PlaceResumo[]; error?: string }>(
        "search-company",
        { action: "search", query }
      );
      if (data.error) throw new Error(data.error);
      setResultados(data.places ?? []);
    } catch (e: any) {
      setErroBusca("Não foi possível buscar agora. Você pode preencher manualmente mais abaixo.");
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  async function escolherEmpresa(place: PlaceResumo) {
    setCarregandoSelecao(true);
    setErro(null);
    try {
      const data = await callFunction<PlaceSelecionado & { error?: string }>(
        "search-company",
        { action: "select", placeId: place.id }
      );
      if ((data as any).error) throw new Error((data as any).error);
      if (!data.write_a_review_uri) {
        throw new Error("Não encontramos o link de avaliação dessa empresa. Tente o preenchimento manual.");
      }
      setSelecionada(data);
      setResultados([]);
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível selecionar essa empresa.");
    } finally {
      setCarregandoSelecao(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!codigo.trim() || !pin.trim()) {
      setErro("Preencha o código da placa e o PIN.");
      return;
    }

    let nomeEmpresa: string;
    let link: string;

    if (selecionada && !modoManual) {
      nomeEmpresa = selecionada.nome;
      link = selecionada.write_a_review_uri!;
    } else {
      nomeEmpresa = nomeEmpresaManual.trim();
      const valor = linkAvaliacaoManual.trim();
      if (!nomeEmpresa || !valor) {
        setErro("Preencha o nome da empresa e o link (ou o Place ID) de avaliação.");
        return;
      }
      if (valor.startsWith("http")) {
        // Já é um link completo (ex: copiado do business.google.com ou do productmate).
        link = valor;
      } else if (/^[A-Za-z0-9_-]{10,}$/.test(valor)) {
        // Só o Place ID (ex: ChIJN1t_tDeuEmsRUsoyG83frY4) — a gente monta o link
        // sozinho, sem precisar de nenhuma API paga: é a mesma fórmula que
        // sites como o productmate usam por trás dos panos.
        link = `https://search.google.com/local/writereview?placeid=${encodeURIComponent(valor)}`;
      } else {
        setErro("Cole o link completo (começando com https://) ou o Place ID da empresa.");
        return;
      }
    }

    setCarregando(true);
    try {
      const data = await callFunction<{ ok?: boolean; error?: string }>(
        "registrar-placa",
        {
          codigo: codigo.trim(),
          pin: pin.trim(),
          nomeEmpresa,
          reviewLink: link,
          cidade: cidade || null,
          estado: estado || null,
        }
      );
      if (data.error) throw new Error(data.error);
      setNomeFinal(nomeEmpresa);
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
          <p className="text-gray-600">{nomeFinal}</p>
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
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 inline-block mb-3">
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold mb-1">Cadastre sua placa DDS Avaliações</h1>
        <p className="text-sm text-gray-500 mb-4">
          Digite o código impresso na placa, o PIN de 4 dígitos e o link de avaliação da sua
          empresa no Google. Sem necessidade de criar conta.
        </p>

        <form onSubmit={salvar} className="space-y-3">
          <Input label="Código da placa" value={codigo} onChange={setCodigo} placeholder="Ex: DDS215" />
          <Input label="PIN" value={pin} onChange={setPin} placeholder="0000" />

          {modoManual ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600 space-y-2">
                <p className="font-medium text-gray-700">Como pegar o link de avaliação (grátis, direto do Google, leva 1 minuto):</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    Clique no botão abaixo — é uma ferramenta oficial do Google, abre em nova aba.
                  </li>
                  <li>
                    Digite o nome da sua empresa na caixa de busca do mapa e clique no pino certo.
                  </li>
                  <li>
                    Aparece um código (o "Place ID", algo como <code className="bg-gray-100 px-1 rounded">ChIJ...</code>) — copie
                    ele.
                  </li>
                  <li>
                    Volte nesta aba e cole esse código no campo <strong>"Link de avaliação"</strong> abaixo — a gente
                    monta o link sozinho.
                  </li>
                </ol>
                <a
                  href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-1 px-3 py-1.5 rounded-lg bg-white border border-gray-300 font-medium text-gray-700 hover:bg-gray-100"
                >
                  Abrir ferramenta do Google (Place ID Finder) ↗
                </a>
                <p className="pt-1 text-gray-400">
                  Prefere colar o link pronto? Também funciona: pegue em{" "}
                  <a href="https://business.google.com" target="_blank" rel="noreferrer" className="text-brand-600 underline">
                    business.google.com
                  </a>{" "}
                  → sua empresa → "Receber mais avaliações" → copiar link, ou em{" "}
                  <a href="https://productmate.com/google-review-link-generator" target="_blank" rel="noreferrer" className="text-brand-600 underline">
                    productmate.com
                  </a>
                  .
                </p>
              </div>
              <Input label="Nome da empresa" value={nomeEmpresaManual} onChange={setNomeEmpresaManual} placeholder="Ex: Padaria do João" />
              <Input label="Link de avaliação ou Place ID" value={linkAvaliacaoManual} onChange={setLinkAvaliacaoManual} placeholder="Cole aqui o código ou o link completo" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Cidade" value={cidade} onChange={setCidade} required={false} />
                <Input label="Estado (UF)" value={estado} onChange={(v) => setEstado(v.toUpperCase())} required={false} />
              </div>
              <button
                type="button"
                onClick={() => setModoManual(false)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Prefere buscar automaticamente? (opcional)
              </button>
            </div>
          ) : (
            <div>
              <label className="block">
                <span className="text-sm text-gray-600">Nome da sua empresa</span>
                <input
                  value={selecionada ? selecionada.nome : buscaEmpresa}
                  onChange={(e) => {
                    setSelecionada(null);
                    setBuscaEmpresa(e.target.value);
                  }}
                  placeholder="Comece a digitar o nome..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>

              {buscando && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
              {erroBusca && <p className="text-xs text-red-500 mt-1">{erroBusca}</p>}

              {!selecionada && resultados.length > 0 && (
                <ul className="mt-1 border border-gray-200 rounded-lg divide-y overflow-hidden">
                  {resultados.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => escolherEmpresa(r)}
                        disabled={carregandoSelecao}
                        className="w-full text-left px-3 py-2 hover:bg-brand-50 disabled:opacity-50"
                      >
                        <p className="text-sm font-medium">{r.displayName?.text ?? "—"}</p>
                        {r.formattedAddress && (
                          <p className="text-xs text-gray-500">{r.formattedAddress}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selecionada && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                  <p className="font-medium text-green-800">✓ {selecionada.nome}</p>
                  {selecionada.endereco && (
                    <p className="text-xs text-green-700">{selecionada.endereco}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelecionada(null);
                      setBuscaEmpresa("");
                    }}
                    className="text-xs text-green-700 underline mt-1"
                  >
                    Trocar empresa
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setModoManual(true)}
                className="text-xs text-gray-400 hover:text-gray-600 underline mt-2"
              >
                ← Voltar para o passo a passo gratuito
              </button>
            </div>
          )}

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
