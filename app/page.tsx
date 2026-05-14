"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Home,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const familyWins = [
  "Know what is safe to spend before grocery day",
  "Keep bills, food, and savings in one calm plan",
  "Build routines that make money talks feel lighter",
];

const highlights = [
  {
    icon: ShoppingCart,
    label: "Grocery rhythm",
    text: "Plan carts around the money you actually have left.",
  },
  {
    icon: Home,
    label: "Household clarity",
    text: "See monthly income, bills, and flexible spending together.",
  },
  {
    icon: Heart,
    label: "Less stress",
    text: "Simple guidance for families who want a softer budget day.",
  },
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
    <main className="min-h-[100dvh] overflow-hidden bg-cream px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:items-center">
          <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-honey-200 via-honey-300 to-blush-300 p-6 shadow-honey-lg ring-1 ring-white/70 sm:p-8 lg:p-10">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/25 blur-2xl"
            />
            <div
              aria-hidden
              className="absolute bottom-8 right-12 h-28 w-28 rounded-[2rem] bg-honey-50/30 blur-xl animate-float"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-sage-100/30 blur-2xl"
            />

            <div className="relative z-10 flex min-h-[650px] flex-col justify-between gap-10">
              <header className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/90 p-3 shadow-soft ring-1 ring-white/80">
                      <Wallet className="h-7 w-7 text-honey-700" strokeWidth={2.1} />
                    </span>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.18em] text-honey-900/70">
                        HoneyCart
                      </p>
                      <p className="font-serif text-sm italic text-honey-900/65">
                        Family Budget
                      </p>
                    </div>
                  </div>

                  <span className="hidden rounded-full bg-white/65 px-4 py-2 text-sm font-bold text-honey-900 shadow-soft ring-1 ring-white/70 sm:inline-flex">
                    🍯 Made for home life
                  </span>
                </div>

                <div className="max-w-3xl space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-honey-900 shadow-soft ring-1 ring-white/80">
                    <Sparkles className="h-4 w-4 text-honey-700" />
                    Gentle budgeting for busy families
                  </div>

                  <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.05em] text-honey-900 sm:text-6xl lg:text-7xl">
                    Feel calm about what your family can spend.
                  </h1>

                  <p className="max-w-2xl text-lg leading-8 text-honey-900/75 sm:text-xl">
                    HoneyCart turns income, bills, savings, and grocery plans into one warm monthly picture—so every cart, bill, and goal feels easier to manage.
                  </p>
                </div>
              </header>

              <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] md:items-end">
                <div className="rounded-[1.75rem] bg-white/80 p-5 shadow-soft ring-1 ring-white/80 backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-honey-900/60">
                    This month
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-honey-900">
                      <span>Groceries planned</span>
                      <span>$640</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-honey-100">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-honey-400 to-blush-400" />
                    </div>
                    <p className="text-sm leading-6 text-honey-900/65">
                      A friendly snapshot helps your family see what is covered and what is still flexible.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                  {familyWins.map((win) => (
                    <div
                      key={win}
                      className="flex items-start gap-3 rounded-2xl bg-white/70 p-3.5 text-sm font-semibold leading-5 text-honey-900 shadow-soft ring-1 ring-white/75 backdrop-blur-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-700" />
                      <span>{win}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5" aria-label="Account access">
            <div className="rounded-[2rem] bg-white p-5 shadow-soft-lg ring-1 ring-cream-200/90 sm:p-7 lg:p-8">
              <div className="mb-7 space-y-3 text-center sm:text-left">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-honey-100 text-honey-700 ring-1 ring-honey-200 sm:mx-0">
                  <ShieldCheck className="h-7 w-7" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {mode === "signin" ? "Welcome back" : "Start your family plan"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {mode === "signin"
                      ? "Sign in to review your budget, grocery plan, and monthly spending rhythm."
                      : "Create an account and bring your household money into one peaceful place."}
                  </p>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-cream-100 p-1" role="tablist" aria-label="Authentication mode">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={cn(
                      "rounded-xl py-2.5 text-sm font-bold transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-300",
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-300"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div role="alert" className="animate-slide-up rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200">
                    {error}
                  </div>
                )}
                {success && (
                  <div role="status" className="animate-slide-up rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700 ring-1 ring-sage-200">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-honey flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {mode === "signin" ? "Open my budget" : "Create my plan"}
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

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {highlights.map(({ icon: Icon, label, text }) => (
                <div key={label} className="rounded-3xl bg-white/90 p-4 shadow-soft ring-1 ring-cream-200/80">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-honey-100 text-honey-700 ring-1 ring-honey-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{label}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
