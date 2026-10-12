// Reduz fotos grandes antes do envio (fotos de celular chegam a 5 MB).
// A página carrega mais rápido e o armazenamento dura mais.
export type ImageKind = 'logo' | 'cover' | 'photo';
const MAX: Record<ImageKind, number> = { logo: 600, cover: 1800, photo: 1400 };

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler esta imagem.')); };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File, kind: ImageKind): Promise<File> {
  try {
    const img = await load(file);
    const w = img.naturalWidth, h = img.naturalHeight;
    const scale = Math.min(1, MAX[kind] / Math.max(w, h));
    if (scale === 1 && file.size < 350_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const keepPng = kind === 'logo' && file.type === 'image/png';
    let blob = await toBlob(canvas, keepPng ? 'image/png' : 'image/webp', 0.82);
    if (!blob || (!keepPng && blob.type !== 'image/webp')) blob = await toBlob(canvas, 'image/jpeg', 0.84);
    if (!blob || blob.size >= file.size) return file;
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.' + ext, { type: blob.type });
  } catch {
    return file;
  }
}
