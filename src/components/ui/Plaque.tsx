import { Nfc, Star } from "lucide-react";

// Ilustração da plaquinha (QR Code + NFC). O QR é só desenho, não leva a lugar nenhum.
// Os tamanhos usam cqw (largura da própria placa), então ela fica proporcional em qualquer tamanho.
const N = 25;
const qrPath = (() => {
  let seed = 20260712;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const finder = (r: number, c: number) => [[0, 0], [0, N - 7], [N - 7, 0]].some(([fr, fc]) => r >= fr - 1 && r <= fr + 7 && c >= fc - 1 && c <= fc + 7);
  let d = "";
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (finder(r, c)) continue;
    const timing = (r === 6 || c === 6) ? (r + c) % 2 === 0 : rnd() > .52;
    if (timing) d += `M${c + .12} ${r + .12}h.76v.76h-.76z`;
  }
  return d;
})();

function Finder({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect x=".5" y=".5" width="6" height="6" rx="1.6" fill="none" stroke="#0b1426" strokeWidth="1" />
    <rect x="2" y="2" width="3" height="3" rx=".9" fill="url(#dds-qr-g)" />
  </g>;
}

export function QrArt() {
  return (
    <svg viewBox={`0 0 ${N} ${N}`} aria-hidden="true">
      <defs><linearGradient id="dds-qr-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1a6fe0" /><stop offset="1" stopColor="#0b1426" /></linearGradient></defs>
      <path d={qrPath} fill="#0b1426" />
      <Finder x={0} y={0} /><Finder x={N - 7} y={0} /><Finder x={0} y={N - 7} />
      <rect x="10" y="10" width="5" height="5" rx="1.2" fill="#fff" />
      <path d="M12.5 10.9l.55 1.15 1.25.17-.9.88.21 1.24-1.11-.59-1.11.59.21-1.24-.9-.88 1.25-.17z" fill="#fbbf24" />
    </svg>
  );
}

export default function Plaque({ name = "Sua empresa" }: { name?: string }) {
  return (
    <div className="dds-plaque">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-[1.6cqw] text-[3.4cqw] font-bold tracking-[.12em] text-ink-muted whitespace-nowrap"><span className="w-[1.8cqw] h-[1.8cqw] rounded-full bg-brand-400" />AVALIE NO GOOGLE</div>
        <span className="flex gap-[.6cqw] text-amber-400" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <Star key={i} className="w-[3.4cqw] h-[3.4cqw]" fill="currentColor" strokeWidth={0} />)}</span>
      </div>
      <p className="font-display font-extrabold text-[7.4cqw] leading-[1.08] tracking-tight mt-[5%]">Gostou? <span className="font-serif italic font-normal text-brand-600 whitespace-nowrap">Conte pra gente.</span></p>
      <div className="dds-qr mt-[6%] w-[70%] mx-auto"><QrArt /></div>
      <div className="mt-auto pt-[5%] flex items-center justify-between gap-[3cqw]">
        <div className="flex items-center gap-[3cqw]"><span className="dds-nfc !w-[12cqw] !h-[12cqw]"><Nfc className="w-[6cqw] h-[6cqw]" /></span><span className="text-[3.5cqw] leading-tight text-ink-soft font-medium">Aproxime o celular<br />ou aponte a câmera</span></div>
        <span className="grid place-items-center w-[10cqw] h-[10cqw] rounded-[2.6cqw] bg-navy-900 text-[#66e0ff]"><Star className="w-[5cqw] h-[5cqw]" fill="currentColor" strokeWidth={0} /></span>
      </div>
      <p className="mt-[4%] text-center text-[3cqw] tracking-[.18em] text-ink-muted/80 font-semibold truncate">{name.toUpperCase()}</p>
    </div>
  );
}
