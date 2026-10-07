import { useState } from "react";
import { useSearchParams } from "react-router-dom";

// Tela intermediária entre o escaneamento (QR/NFC) e o link real do Google.
// O acesso já foi contabilizado pelo scan-redirect antes de chegar aqui —
// esta tela só existe pra, opcionalmente, pedir telefone e aniversário da
// pessoa antes de mandar ela pra avaliação, com um "presente" como incentivo.
// Nunca trava: o botão principal e "Pular" levam os dois pro mesmo lugar,
// então ninguém deixa de avaliar por causa disso.

// Formata enquanto digita: só números, no formato DD/MM/AAAA.
// Texto simples em vez de <input type="date"> de propósito — abrir o
// calendário nativo é um passo a mais que faz gente desistir no meio.
function formatarDigitandoData(valorAtual: string, novoValor: string): string {
  const digitos = novoValor.replace(/\D/g, "").slice(0, 8);
  let formatado = digitos;
  if (digitos.length > 4) {
    formatado = `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
  } else if (digitos.length > 2) {
    formatado = `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }
  return formatado;
}

// Converte "DD/MM/AAAA" digitado pelo usuário em "AAAA-MM-DD" (ISO) pro
// backend. Retorna null se a data estiver incompleta ou inválida.
function dataBrParaIso(valor: string): string | null {
  const m = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const d = Number(dia);
  const mo = Number(mes);
  const y = Number(ano);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const data = new Date(Date.UTC(y, mo - 1, d));
  if (data.getUTCFullYear() !== y || data.getUTCMonth() !== mo - 1 || data.getUTCDate() !== d) {
    return null;
  }
  if (data.getTime() > Date.now()) return null;
  return `${ano}-${mes}-${dia}`;
}

export default function Avaliar() {
  const [params] = useSearchParams();
  const slug = params.get("slug") ?? "";
  const dest = params.get("dest") ?? "";
  const empresa = params.get("empresa") ?? "";

  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [indo, setIndo] = useState(false);

  // Só dispara o envio do lead — a navegação em si fica por conta do próprio
  // <a href={dest}> (um toque de verdade num link). Isso importa no iPhone:
  // um redirecionamento por JavaScript não deixa o sistema entregar o link
  // pro app do Google Maps (onde o cliente já está logado), e o link acaba
  // abrindo no navegador, que pede login no Google.
  function enviarLead() {
    if (indo) return;
    setIndo(true);

    if (telefone.trim() && slug) {
      // Best-effort: dispara e não espera resposta, pra não atrasar a
      // navegação. `keepalive` garante que o pedido continua indo mesmo com
      // a página saindo do ar logo em seguida.
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/captar-lead`;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          slug,
          telefone: telefone.trim(),
          dataNascimento: dataBrParaIso(dataNascimento.trim()),
        }),
      }).catch(() => {});
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
        <div className="text-4xl">🎂</div>
        <div>
          <h1 className="text-xl font-semibold">
            {empresa ? `A ${empresa} quer lembrar de você!` : "Quer ser lembrado no seu aniversário?"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Deixe seu telefone e a data do seu aniversário e a gente te manda um parabéns no seu
            mês — quem sabe até com uma surpresa 🎁
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
            <span className="text-xs text-gray-500">Sua data de aniversário (DD/MM/AAAA)</span>
            <input
              type="text"
              inputMode="numeric"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(formatarDigitandoData(dataNascimento, e.target.value))}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="mt-1 w-full text-center rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
        </div>

        <a
          href={dest}
          onClick={enviarLead}
          className="block w-full py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
        >
          Quero ser lembrado no meu aniversário e avaliar 🎂
        </a>

        <a href={dest} className="inline-block text-xs text-gray-400 hover:text-gray-600 underline">
          Pular e avaliar sem deixar meus dados
        </a>
      </div>
    </div>
  );
}
