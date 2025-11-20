
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  React.useEffect(() => {
    // If already logged in, redirect to home
    if (!loading && user) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

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
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate.");
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="max-w-md w-full p-8 rounded-lg border flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-5 text-center">{isSignup ? "Create an Account" : "Sign In"}</h1>
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
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          <Button className="w-full" type="submit" disabled={pending}>
            {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSignup ? "Sign Up" : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-center">
          <button
            type="button"
            className="text-blue-700 underline hover:text-blue-800"
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
