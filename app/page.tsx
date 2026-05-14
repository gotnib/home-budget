"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, Wallet } from "lucide-react";
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

const plannerCards = [
  { emoji: "🍓", title: "Groceries", text: "Cute carts that respect your budget." },
  { emoji: "🧾", title: "Bills", text: "Recurring costs stay tidy and visible." },
  { emoji: "🌈", title: "Goals", text: "See what is safe to spend at a glance." },
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
    <main className="relative min-h-[100dvh] overflow-hidden px-4 py-8 hero-gradient sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-14 h-44 w-44 rounded-[3rem] bg-blush-200/50 blur-2xl animate-sparkle-drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-4 top-8 h-28 w-28 rounded-full bg-honey-200/70 blur-xl animate-cute-pop"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-10 right-1/4 h-36 w-36 rounded-[2.5rem] bg-sage-200/50 blur-2xl animate-float"
      />

      <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="cute-panel p-6 sm:p-8 lg:p-10 animate-fade-up">
          <div className="relative z-10 space-y-8">
            <header className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-honey-700 ring-1 ring-honey-200 shadow-soft">
                <Sparkles className="h-3.5 w-3.5" />
                HTML-first cozy budgeting
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-honey-300 via-honey-400 to-blush-400 shadow-honey-lg animate-cute-pop">
                    <Wallet className="h-9 w-9 text-white" strokeWidth={1.8} />
                    <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-soft ring-1 ring-cream-200">
                      🍯
                    </span>
                  </div>
                  <div>
                    <p className="font-serif text-lg italic text-muted-foreground">Meet</p>
                    <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                      HoneyCart
                    </h1>
                  </div>
                </div>

                <p className="max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  A playful home-budget dashboard with friendly HTML forms, soft cards, and a grocery plan that keeps the backend connections exactly where they belong.
                </p>
              </div>
            </header>

            <div className="grid gap-3 sm:grid-cols-3">
              {plannerCards.map((card, index) => (
                <article
                  key={card.title}
                  className="cute-card p-4 animate-fade-up"
                  style={{ animationDelay: `${150 + index * 75}ms` }}
                >
                  <div className="mb-3 text-3xl" aria-hidden>
                    {card.emoji}
                  </div>
                  <h2 className="text-sm font-bold text-foreground">{card.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.text}</p>
                </article>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {features.map(({ icon, label, color }) => (
                <span key={label} className={cn("chip ring-1", color)}>
                  <span className="text-sm" aria-hidden>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="relative z-10 animate-fade-up delay-150" aria-label="Account access">
          <div className="rounded-[2rem] bg-white/95 p-5 shadow-soft-lg ring-1 ring-cream-200/80 backdrop-blur-xl sm:p-7">
            <div className="mb-6 text-center">
              <p className="section-label mb-2">Welcome back</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {mode === "signin" ? "Sign in to your hive" : "Start your cozy plan"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Secure auth remains powered by the existing Supabase connection.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-cream-100 p-1 gap-1" role="tablist" aria-label="Authentication mode">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "rounded-xl py-2.5 text-sm font-semibold transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey-300",
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
                className="btn-honey flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
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

          <p className="mt-5 text-center text-xs text-muted-foreground/60 animate-fade-in delay-500">
            Calm, cozy, always in control ✨
          </p>
        </aside>
      </section>
    </main>
  );
}
