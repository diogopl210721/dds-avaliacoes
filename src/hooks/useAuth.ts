import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { withTimeout } from "../lib/withTimeout";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let eventReceived = false;
    setLoading(true); setError(null);
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      eventReceived = true;
      setSession(next); setLoading(false); setError(null);
    });
    withTimeout(supabase.auth.getSession(), "Não foi possível verificar sua sessão. Tente novamente.")
      .then(({ data, error }) => {
        if (!active || eventReceived) return;
        if (error) throw error;
        setSession(data.session); setLoading(false);
      })
      .catch(() => {
        if (active && !eventReceived) { setError("Não foi possível verificar sua sessão. Tente novamente."); setLoading(false); }
      });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [attempt]);

  return { session, loading, user: session?.user ?? null, error, retry: () => setAttempt(value => value + 1) };
}

