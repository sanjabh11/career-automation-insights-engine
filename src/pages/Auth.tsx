
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Shield } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthMode } from "@/contexts/WhopAppContext";

function mapAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Incorrect email or password. Please try again.";
  if (lower.includes("email not confirmed")) return "Please check your email and confirm your account before signing in.";
  if (lower.includes("user already registered")) return "An account with this email already exists. Try signing in instead.";
  if (lower.includes("password") && lower.includes("short")) return "Password must be at least 6 characters.";
  if (lower.includes("rate limit") || lower.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (lower.includes("network") || lower.includes("fetch")) return "Network error. Please check your connection and try again.";
  return "Something went wrong. Please try again.";
}

const Auth = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { isWhopMode, isReady } = useAuthMode();

  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  React.useEffect(() => {
    if (isReady && isWhopMode) {
      const search = window.location.search || "";
      navigate(`/whop/experience${search}`, { replace: true });
      return;
    }
    
    // If already logged in, redirect to home
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, isWhopMode, isReady]);

  // In Whop mode, do not render the email/password form at all.
  // The effect above will handle navigation to the Whop experience.
  if (isWhopMode) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <Card className="max-w-md w-full p-8 rounded-xl border border-[hsl(var(--border))] bg-[var(--bg-secondary)] flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-5 text-center text-[var(--text-primary)]">Redirecting from Whop...</h1>
          <p className="text-sm text-center text-[var(--text-secondary)]">
            You are already authenticated via Whop. Loading your experience.
          </p>
        </Card>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      setPending(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: redirectUrl }
        });
        if (error) throw error;
        setPending(false);
        setError("Signup successful! Please check your email for confirmation.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        // Full reload to update state everywhere
        window.location.href = "/";
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const friendly = mapAuthError(raw);
      setError(friendly);
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <Card className="max-w-md w-full p-8 rounded-xl border border-[hsl(var(--border))] bg-[var(--bg-secondary)] flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-[var(--accent-primary)]" />
          <span className="text-lg font-semibold text-[var(--text-primary)]">Automation Insights</span>
        </div>
        <h1 className="text-2xl font-bold mb-5 text-center text-[var(--text-primary)]">{isSignup ? "Create an Account" : "Sign In"}</h1>
        <form className="w-full space-y-4" onSubmit={handleAuth}>
          <div>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              disabled={pending}
              autoFocus
              required
            />
          </div>
          <div>
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              disabled={pending}
              required
            />
          </div>
          {error && <div className="text-[var(--accent-danger)] text-sm mt-2">{error}</div>}
          <Button className="w-full" type="submit" disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSignup ? "Sign Up" : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-center">
          <button
            type="button"
            className="text-[var(--accent-primary)] underline hover:text-[var(--accent-secondary)]"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
            }}
            disabled={pending}
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
