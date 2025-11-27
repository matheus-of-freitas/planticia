import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../libs/supabaseClient";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log("Auth state changed", newSession);
        const previousSession = session;
        setSession(newSession);

        if (previousSession && !newSession) {
          setTimeout(() => {
            router.replace("/");
          }, 100);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function signInWithGoogle() {
    console.log("Starting Google sign-in...");

    const redirectUrl = Linking.createURL("/");
    console.log("Redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error("Error starting OAuth:", error);
      return;
    }

    console.log("Supabase OAuth URL generated:", data);

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      console.log("WebBrowser result:", result);

      if (result.type === "success" && result.url) {
        console.log("Processing auth callback URL:", result.url);

        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1)); // Remove the # and parse
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error("Error setting session:", sessionError);
          } else {
            console.log("Session set successfully:", sessionData);
          }
        } else {
          console.error("Missing tokens in callback URL");
        }
      }
    } else {
      console.error("No OAuth URL returned from Supabase.");
    }
  }

  async function signOut() {
    console.log("Signing out...");
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}