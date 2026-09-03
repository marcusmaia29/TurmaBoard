import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import type { Profile } from "../../lib/database.types";
import { hasAdminRole } from "./auth.utils";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError("Não foi possível verificar a sessão.");
      setSession(data.session);
      setIsSessionLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setProfile(null);
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "SIGNED_OUT") setAuthError(null);
      setIsSessionLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const client = supabase;
    const userId = session?.user.id;
    let cancelled = false;

    if (!client || !userId) return;
    void client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setProfile(null);
          setAuthError("Seu perfil não pôde ser carregado. Entre novamente.");
        } else {
          setProfile(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const isLoading = isSessionLoading || Boolean(session && profile?.id !== session.user.id && !authError);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isAdmin: hasAdminRole(profile),
      isLoading,
      authError,
      async signIn(email, password) {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) throw error;
      },
    }),
    [authError, isLoading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
