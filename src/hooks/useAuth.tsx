import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseAvailable } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role?: 'user' | 'admin') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId as any)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      // silently fail - profile is optional
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (err: any) {
        // Network error is expected when offline
        if (!navigator.onLine) {
          console.log("📡 Offline: skipping auth sync");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    let subscription: any;
    const setupAuthListener = async () => {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
        subscription = data.subscription;
      } catch (err: any) {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();
    setupAuthListener();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === "admin";

  const signUp = async (email: string, password: string, displayName: string, role: 'user' | 'admin' = 'user') => {
    if (!isOnline) {
      return { error: { message: "No internet connection. Please check your network." } };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: displayName,
            role: role
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: { message: "Network error. Please try again." } };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isOnline) {
      return { error: { message: "No internet connection. Please check your network." } };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err: any) {
      return { error: { message: "Network error. Please try again." } };
    }
  };

  const signOut = async () => {
    // 1. Actually await the signout so tokens get cleared
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }

    // 2. Manually remove any remaining supabase auth keys
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("sb-") || k.startsWith("app:")) {
        localStorage.removeItem(k);
      }
    });

    // 3. Clear query cache
    try { queryClient.clear(); } catch {}

    // 4. Reset state
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);

    // 5. Redirect
    window.location.href = window.location.origin;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
