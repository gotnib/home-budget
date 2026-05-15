"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Heart, Home, Loader2, ShieldCheck, ShoppingCart, Sparkles, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

const familyWins = [
  "Know what is safe to spend before grocery day",
  "Keep bills, food, and savings in one calm plan",
  "Make money talks feel lighter at home",
];

const highlights = [
  { icon: ShoppingCart, label: "Grocery rhythm",    text: "Plan carts around the money you actually have left." },
  { icon: Home,         label: "Household clarity", text: "See income, bills, and flexible spending together."   },
  { icon: Heart,        label: "Budget jars",       text: "Tune savings goals and grocery allocation."           },
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
    setError(null); setSuccess(null); setIsLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard"); router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Check your email to confirm your account!");
        setEmail(""); setPassword("");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode(next: Mode) { setMode(next); setError(null); setSuccess(null); }

  const showOverlay = isLoading && mode === "signin";

  return (
    <>
    {showOverlay && (
      <div className="signin-overlay" aria-live="assertive" aria-label="Signing in">
        <div className="signin-overlay-blob1" aria-hidden />
        <div className="signin-overlay-blob2" aria-hidden />
        <div className="signin-overlay-icon" aria-hidden>
          <Wallet style={{ width: "2rem", height: "2rem" }} strokeWidth={2.1} />
        </div>
        <div className="signin-overlay-spinner" aria-hidden />
        <div style={{ textAlign: "center" }}>
          <p className="signin-overlay-title">Signing you in…</p>
          <p className="signin-overlay-sub">Getting your HoneyCart ready</p>
        </div>
      </div>
    )}
    <main className="landing-wrap">
      <section className="landing-section">
        <div className="landing-grid">

          {/* ── Left hero ── */}
          <div className="landing-hero">
            <div className="landing-hero-blob1" aria-hidden />
            <div className="landing-hero-blob2" aria-hidden />
            <div className="landing-hero-blob3" aria-hidden />

            <div className="landing-hero-inner">
              <header>
                <div className="landing-brand">
                  <div className="landing-brand-left">
                    <span className="landing-brand-icon">
                      <Wallet style={{ width: "1.75rem", height: "1.75rem" }} strokeWidth={2.1} />
                    </span>
                    <div>
                      <p className="landing-brand-name">HoneyCart</p>
                      <p className="landing-brand-tagline">Family Budget</p>
                    </div>
                  </div>
                  <span className="landing-hero-pill">🍯 Made for home life</span>
                </div>

                <div style={{ maxWidth: "48rem", marginTop: "2rem" }}>
                  <div className="landing-hero-tag">
                    <Sparkles style={{ width: "1rem", height: "1rem", color: "var(--honey-700)" }} />
                    Gentle budgeting for busy families
                  </div>

                  <h1 className="landing-h1">Feel calm about what your family can spend.</h1>

                  <p className="landing-p">
                    HoneyCart turns income, bills, savings, and grocery plans into one warm monthly picture so every cart, bill, and goal feels easier to manage.
                  </p>
                </div>
              </header>

              <div className="landing-demo-grid">
                <div className="landing-demo-card">
                  <p className="landing-demo-label">This month</p>
                  <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", fontWeight: 600, color: "var(--honey-900)" }}>
                      <span>Groceries planned</span><span>$640</span>
                    </div>
                    <div className="landing-demo-bar-track">
                      <div className="landing-demo-bar-fill" />
                    </div>
                    <p className="landing-demo-text">A friendly snapshot helps your family see what is covered and what is still flexible.</p>
                  </div>
                </div>

                <div className="landing-wins-grid">
                  {familyWins.map((win) => (
                    <div key={win} className="landing-win-item">
                      <CheckCircle2 style={{ marginTop: "0.125rem", width: "1rem", height: "1rem", flexShrink: 0, color: "var(--sage-700)" }} />
                      <span>{win}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right form ── */}
          <aside className="landing-aside" aria-label="Account access">
            <div className="landing-form-card">
              <div style={{ marginBottom: "1.75rem" }}>
                <div className="landing-form-shield">
                  <ShieldCheck style={{ width: "1.75rem", height: "1.75rem" }} strokeWidth={2} />
                </div>
                <h2 className="landing-form-h2">
                  {mode === "signin" ? "Welcome back" : "Start your family plan"}
                </h2>
                <p className="landing-form-sub">
                  {mode === "signin"
                    ? "Sign in to review your budget, grocery plan, and monthly spending rhythm."
                    : "Create an account and bring your household money into one peaceful place."}
                </p>
              </div>

              <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={`auth-tab${mode === m ? " active" : ""}`}
                  >
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-field">
                  <label className="form-label" htmlFor="email">Email</label>
                  <div className="form-input-wrap">
                    <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <input
                      id="email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="form-input form-input--icon-left"
                      required autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="form-input-wrap">
                    <svg className="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                      className="form-input form-input--icon-left form-input--icon-right"
                      required
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      minLength={mode === "signup" ? 6 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="form-input-eye"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword
                        ? <EyeOff style={{ width: "1rem", height: "1rem" }} />
                        : <Eye style={{ width: "1rem", height: "1rem" }} />
                      }
                    </button>
                  </div>
                </div>

                {error && <div role="alert" className="alert alert--error">{error}</div>}
                {success && <div role="status" className="alert alert--success">{success}</div>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn--honey btn--full"
                  style={{ gap: "0.5rem" }}
                >
                  {isLoading
                    ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                    : <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                  }
                  {mode === "signin" ? "Sign in to HoneyCart" : "Create my account"}
                </button>
              </form>
            </div>

            <div className="landing-highlights">
              {highlights.map(({ icon: Icon, label, text }) => (
                <div key={label} className="landing-highlight-item">
                  <span className="icon-pill icon-pill--sage icon-pill--md" style={{ flexShrink: 0 }}>
                    <Icon style={{ width: "1.25rem", height: "1.25rem" }} />
                  </span>
                  <div className="landing-highlight-text">
                    <h4>{label}</h4>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </section>
    </main>
    </>
  );
}
