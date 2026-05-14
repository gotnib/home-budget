"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [tab,    setTab]    = useState<"signin" | "signup">("signin");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Ambient orb */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-honey-200/30 blur-[120px]" />
      </div>

      {/* Card */}
      <div className="animate-scale-in w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo showTagline />
          <p className="mt-1 text-sm text-muted-foreground">
            Know your numbers, fill your cart.
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl bg-muted p-1 text-sm" role="tablist">
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "flex-1 rounded-lg bg-background py-1.5 font-medium text-foreground shadow-sm transition-all"
                  : "flex-1 rounded-lg py-1.5 text-muted-foreground transition-all hover:text-foreground"
              }
            >
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            /* hook up your Supabase auth here */
          }}
        >
          {tab === "signup" && (
            <div className="animate-fade-up space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Davis family"
                autoComplete="name"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-honey-400 focus:ring-2 focus:ring-honey-200"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-honey-400 focus:ring-2 focus:ring-honey-200"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={tab === "signin" ? "current-password" : "new-password"}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-honey-400 focus:ring-2 focus:ring-honey-200"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw
                  ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                  : <Eye    className="h-4 w-4" aria-hidden="true" />
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-honey-500 px-4 py-2.5 text-sm font-semibold text-bark-dark shadow-sm transition-all hover:bg-honey-400 active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {tab === "signin" ? "Sign in to HoneyCart" : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Calm, cozy, and always in control.
        </p>
      </div>
    </div>
  );
}
