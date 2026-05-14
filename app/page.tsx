"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Eye, EyeOff, Wallet, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const features = [
  { icon: "🏦", label: "Bank sync", color: "bg-lavender-100 text-lavender-700 ring-lavender-200" },
  { icon: "💰", label: "Smart budget", color: "bg-honey-100 text-honey-700 ring-honey-200" },
  { icon: "🛒", label: "Grocery planner", color: "bg-sage-100 text-sage-700 ring-sage-200" },
  { icon: "📊", label: "Spending insights", color: "bg-blush-100 text-blush-700 ring-blush-200" },
];

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account!");
        setEmail("");
        setPassword("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12 hero-gradient">

      {/* Floating ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 right-0 h-[600px] w-[600px] rounded-full opacity-50 blur-3xl animate-pulse-gentle"
        style={{ background: "radial-gradient(circle at 60% 40%, #fce4a3 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -left-32 h-[450px] w-[450px] rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, #ddeee0 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-1/4 h-[300px] w-[300px] -translate-y-1/2 rounded-full opacity-25 blur-3xl animate-float"
        style={{ background: "radial-gradient(circle, #ebe5f7 0%, transparent 70%)", animationDelay: "1.5s" }}
      />

      <div className="relative z-10 w-full max-w-sm space-y-7">

        {/* Hero mark */}
        <div className="flex flex-col items-center gap-5 text-center animate-fade-up">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-honey-300 via-honey-400 to-honey-600 shadow-honey-lg">
              <Wallet className="h-9 w-9 text-white" strokeWidth={1.75} />
            </div>
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-cream-200 animate-bounce-in delay-300">
              <Sparkles className="h-3.5 w-3.5 text-honey-500" />
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              HoneyCart
            </h1>
            <p className="mt-2 text-base text-muted-foreground leading-relaxed">
              Your cozy budget companion 🍯
            </p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-2 animate-fade-up delay-100">
          {features.map(({ icon, label, color }) => (
            <span
              key={label}
              className={cn("chip ring-1", color)}
            >
              <span className="text-sm">{icon}</span>
              {label}
            </span>
          ))}
        </div>

        {/* Auth card */}
        <div className="rounded-3xl bg-white/95 p-6 shadow-soft-lg ring-1 ring-cream-200/80 backdrop-blur-sm sm:p-8 animate-fade-up delay-150">

          {/* Tab toggle */}
          <div className="mb-6 flex rounded-2xl bg-cream-100 p-1 gap-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-250",
                  mode === m
                    ? "bg-white text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  className="pl-10 pr-12"
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  minLength={mode === "signup" ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="animate-slide-up rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className="animate-slide-up rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700 ring-1 ring-sage-200"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-honey flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in to HoneyCart" : "Create my account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-semibold text-honey-600 hover:text-honey-700 transition-colors hover:underline underline-offset-2"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-semibold text-honey-600 hover:text-honey-700 transition-colors hover:underline underline-offset-2"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 animate-fade-in delay-500">
          Calm, cozy, always in control ✨
        </p>
      </div>
    </div>
  );
}
