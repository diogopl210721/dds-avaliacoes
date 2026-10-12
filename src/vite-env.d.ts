/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// A biblioteca de QR Code não traz tipos próprios; só usamos toDataURL.
declare module 'qrcode' {
  const QRCode: { toDataURL(text: string, options?: Record<string, unknown>): Promise<string> };
  export default QRCode;
}
