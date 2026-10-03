import { useState } from "react";
import { useSearchParams } from "react-router-dom";

// Tela intermediária entre o escaneamento (QR/NFC) e o link real do Google.
// O acesso já foi contabilizado pelo scan-redirect antes de chegar aqui —
// esta tela só existe pra, opcionalmente, pedir telefone e aniversário da
// pessoa antes de mandar ela pra avaliação, com um "presente" como incentivo.
// Nunca trava: "Quero meu presente" e "Pular" levam os dois pro mesmo lugar,
// então ninguém deixa de avaliar por causa disso.
export default function Avaliar() {
  const [params] = useSearchParams();
  const slug = params.get("slug") ?? "";
  const dest = params.get("dest") ?? "";
  const empresa = params.get("empresa") ?? "";

  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [indo, setIndo] = useState(false);

  function irParaGoogle(comDados: boolean) {
    if (indo) return;
    setIndo(true);

    if (comDados && telefone.trim() && slug) {
      // Best-effort: dispara e não espera resposta, pra não atrasar o
      // redirecionamento. `keepalive` garante que o pedido continua indo
      // mesmo com a página saindo do ar logo em seguida.
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captar-lead`;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          slug,
          telefone: telefone.trim(),
          dataNascimento: dataNascimento || null,
        }),
      }).catch(() => {});
    }

    if (dest) {
      window.location.href = dest;
    }
  }

  if (!dest) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center text-gray-500">
        Link inválido ou expirado.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 text-center space-y-4">
        <div className="text-4xl">🎁</div>
        <div>
          <h1 className="text-xl font-semibold">
            {empresa ? `Ganhe uma surpresa da ${empresa}!` : "Ganhe uma surpresa!"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Deixe seu telefone e data de aniversário e receba um presente especial 🎉
          </p>
        </div>

        <div className="space-y-2.5 text-left">
          <label className="block">
            <span className="text-xs text-gray-500">Seu telefone</span>
            <input
              type="tel"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="mt-1 w-full text-center rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">Sua data de aniversário</span>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="mt-1 w-full text-center rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
        </div>

        <button
          onClick={() => irParaGoogle(true)}
          disabled={indo}
          className="w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50"
        >
          Quero meu presente e avaliar 🎁
        </button>

        <button
          onClick={() => irParaGoogle(false)}
          disabled={indo}
          className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-50"
        >
          Pular e avaliar sem deixar meus dados
        </button>
      </div>
    </div>
  );
}
