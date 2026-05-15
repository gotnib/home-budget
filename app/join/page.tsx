"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Users, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

type AuthMode = "signin" | "signup";

function JoinContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [role, setRole] = useState<"worker" | "hive" | null>(null);
  const [error, setError] = useState("");
  const [authState, setAuthState] = useState<"checking" | "unauthenticated" | "authenticated">("checking");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthState(data.user ? "authenticated" : "unauthenticated");
    });
  }, [supabase]);

  // Auto-join when auth completes and a code is present
  useEffect(() => {
    if (authState === "authenticated" && code.trim() && status === "idle") {
      handleJoin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setAuthState("authenticated");
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleJoin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!code.trim()) return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/household/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
      setRole(data.role);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (authState === "checking") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
        <Loader2 style={{ width: "1.5rem", height: "1.5rem", animation: "spin 1s linear infinite", color: "var(--honey-400)" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream-50)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ width: "3rem", height: "3rem", background: "var(--honey-100)", borderRadius: "1rem", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
            <Users style={{ width: "1.5rem", height: "1.5rem", color: "var(--honey-600)" }} />
          </span>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--color-fg)", letterSpacing: "-0.025em" }}>Join a household</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginTop: "0.375rem" }}>
            {authState === "unauthenticated"
              ? "Create an account or sign in to accept the invite"
              : "Enter the invite code shared with you"}
          </p>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <CheckCircle2 style={{ width: "2.5rem", height: "2.5rem", color: "var(--sage-500)" }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-fg)" }}>You&apos;re in!</p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>
                {role === "worker"
                  ? "You joined as a Worker — you have full access to the household budget."
                  : "You joined as a Hive member — you can view the grocery list and meal plans."}
              </p>
            </div>
            <button onClick={() => router.push("/groceries")} className="btn btn--honey" style={{ gap: "0.5rem" }}>
              Go to groceries
            </button>
          </div>
        ) : authState === "unauthenticated" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Auth mode toggle */}
            <div style={{ display: "flex", background: "var(--cream-100)", borderRadius: "0.875rem", padding: "0.25rem", border: "1px solid var(--cream-200)" }}>
              {(["signup", "signin"] as AuthMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setAuthMode(mode); setAuthError(""); }}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "0.625rem",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    background: authMode === mode ? "white" : "transparent",
                    color: authMode === mode ? "var(--color-fg)" : "var(--color-muted)",
                    boxShadow: authMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {mode === "signup" ? "Create account" : "Sign in"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="card" style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="form-input"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={authMode === "signup" ? "At least 6 characters" : "Your password"}
                        className="form-input"
                        required
                        autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                        style={{ paddingRight: "2.5rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", display: "flex", alignItems: "center" }}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff style={{ width: "1rem", height: "1rem" }} /> : <Eye style={{ width: "1rem", height: "1rem" }} />}
                      </button>
                    </div>
                  </div>

                  {code && (
                    <div style={{ padding: "0.5rem 0.75rem", background: "var(--honey-50)", borderRadius: "0.5rem", border: "1px solid var(--honey-200)" }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--honey-700)", fontWeight: 600 }}>Invite code: <span style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>{code}</span></p>
                    </div>
                  )}

                  {authError && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", background: "var(--blush-50)", borderRadius: "0.625rem", border: "1px solid var(--blush-200)" }}>
                      <AlertCircle style={{ width: "0.875rem", height: "0.875rem", color: "var(--blush-600)", flexShrink: 0 }} />
                      <p style={{ fontSize: "0.8125rem", color: "var(--blush-700)" }}>{authError}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn btn--honey"
                style={{ gap: "0.5rem" }}
              >
                {authLoading
                  ? <><Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> {authMode === "signup" ? "Creating account…" : "Signing in…"}</>
                  : authMode === "signup" ? "Create account & join" : "Sign in & join"
                }
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div className="form-field">
                <label className="form-label">Invite code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  className="form-input"
                  maxLength={8}
                  autoFocus
                  style={{ letterSpacing: "0.1em", fontFamily: "monospace", fontSize: "1.125rem", textAlign: "center" }}
                />
              </div>

              {status === "error" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", padding: "0.625rem 0.875rem", background: "var(--blush-50)", borderRadius: "0.625rem", border: "1px solid var(--blush-200)" }}>
                  <AlertCircle style={{ width: "0.875rem", height: "0.875rem", color: "var(--blush-600)", flexShrink: 0 }} />
                  <p style={{ fontSize: "0.8125rem", color: "var(--blush-700)" }}>{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !code.trim()}
              className="btn btn--honey"
              style={{ gap: "0.5rem" }}
            >
              {status === "loading"
                ? <><Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> Joining…</>
                : <><Users style={{ width: "1rem", height: "1rem" }} /> Join household</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  );
}
