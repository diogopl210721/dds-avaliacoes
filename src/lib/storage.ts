import { supabase } from "./supabaseClient";

const url = import.meta.env.VITE_SUPABASE_URL as string;

export function publicStorageUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl ?? `${url}/storage/v1/object/public/${bucket}/${path}`;
}
