// supabase/functions/activate-plate/index.ts
//
// Recebe { codigo, pin } e verifica se a placa existe e está aguardando
// ativação. NUNCA autentica só com o código público — o PIN é obrigatório
// e é comparado contra um hash (bcrypt), nunca texto puro.
//
// Deploy: supabase functions deploy activate-plate

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Rate limit simples em memória (por instância) — para produção séria,
// mover para uma tabela `activation_attempts` com janela de tempo.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 min

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

Deno.serve(async (req) => {
  try {
    const { codigo, pin } = await req.json();
    if (!codigo || !pin) {
      return json({ error: "Código e PIN são obrigatórios." }, 400);
    }

    const rateLimitKey = codigo.toUpperCase();
    if (tooManyAttempts(rateLimitKey)) {
      return json(
        { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
        429
      );
    }

    const { data: plate, error } = await supabaseAdmin
      .from("plates")
      .select("id, pin_hash, status, pin_used")
      .eq("codigo", codigo.toUpperCase())
      .maybeSingle();

    // Mensagem genérica — não revelar se o código existe ou não (evita
    // enumeração de placas).
    const genericError = { error: "Código ou PIN inválido." };

    if (error || !plate) return json(genericError, 400);
    if (plate.status !== "AGUARDANDO_ATIVACAO" || plate.pin_used) {
      return json({ error: "Esta placa já foi ativada ou não está disponível." }, 400);
    }

    const pinOk = await bcrypt.compare(pin, plate.pin_hash);
    if (!pinOk) return json(genericError, 400);

    // Marca a placa como pronta para vincular (o cadastro do cliente,
    // feito na sequência pelo frontend via supabase.auth.signUp, é quem
    // efetivamente troca o status para ATIVA depois de criar a empresa).
    await supabaseAdmin
      .from("plates")
      .update({ pin_used: true })
      .eq("id", plate.id);

    return json({ plate_id: plate.id }, 200);
  } catch (e) {
    console.error(e);
    return json({ error: "Erro interno." }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
