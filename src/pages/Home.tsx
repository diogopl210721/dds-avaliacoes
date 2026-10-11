import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-8">
      <div>
        <h1 className="text-4xl font-bold text-brand-700">DDS Avaliações</h1>
        <p className="mt-3 text-lg text-gray-600 max-w-md mx-auto">
          Transforme um simples toque em novas oportunidades de avaliação.
        </p>
      </div>

      <div className="flex items-center gap-6 text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">📶</span>
          <span>Aproxime (NFC)</span>
        </div>
        <span>ou</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">📷</span>
          <span>Escaneie (QR)</span>
        </div>
        <span>↓</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">⭐</span>
          <span>Avalie no Google</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link to="/cadastrar" className="px-6 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600">Cadastrar minha placa</Link>
        <Link to="/sistema" className="px-6 py-3 rounded-lg border border-gray-300 font-medium hover:bg-gray-100">Acesse meu sistema</Link>
      </div>
    </div>
  );
}
