"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, BarChart3, TrendingUp, TrendingDown, RefreshCw, CreditCard, Repeat2 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";

interface CategoryStat {
  name: string;
  total: number;
}

interface Subscription {
  name: string;
  amount: number;
  lastDate: string;
  occurrences: number;
}

interface InsightsData {
  categories: CategoryStat[];
  currentTotal: number;
  prevTotal: number;
  subscriptions: Subscription[];
  hasTransactions: boolean;
}

const BAR_COLORS: Array<{ fill: string; label: string }> = [
  { fill: "var(--honey-400)",    label: "honey" },
  { fill: "var(--sage-400)",     label: "sage" },
  { fill: "var(--blush-400)",    label: "blush" },
  { fill: "var(--lavender-400)", label: "lavender" },
];

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/insights");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load insights.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchInsights();
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container--md">

        {/* Page header */}
        <div className="animate-fade-up" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p className="section-label" style={{ marginBottom: "0.25rem" }}>Finance</p>
            <h1 className="page-title">Spending Insights</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn--outline btn--sm"
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.125rem" }}
          >
            <RefreshCw style={{ width: "0.875rem", height: "0.875rem", animation: isLoading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert--error animate-slide-up">{error}</div>
        )}

        {isLoading ? (
          <div className="loading-center">
            <div className="loading-col">
              <Loader2 className="spinner" style={{ width: "2rem", height: "2rem" }} />
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Loading insights…</p>
            </div>
          </div>
        ) : data && !data.hasTransactions ? (
          /* ── Empty state ── */
          <div className="empty-state animate-fade-up">
            <div style={{
              width: "4rem", height: "4rem", borderRadius: "1.25rem",
              background: "var(--honey-100)", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 0 0 1px var(--honey-200)",
            }}>
              <BarChart3 style={{ width: "1.75rem", height: "1.75rem", color: "var(--honey-600)" }} />
            </div>
            <div style={{ maxWidth: "22rem", textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-fg)", marginBottom: "0.5rem" }}>
                No spending data yet
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: "1.6" }}>
                Connect your bank in Settings to see spending insights. Your transaction history will appear here once synced.
              </p>
            </div>
            <Link href="/settings">
              <button className="btn btn--honey" style={{ marginTop: "0.25rem" }}>
                <CreditCard style={{ width: "1rem", height: "1rem" }} />
                Connect bank in Settings
              </button>
            </Link>
          </div>
        ) : data ? (
          <>
            {/* ── This month vs last ── */}
            <div className="card animate-fade-up delay-50">
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "2rem", height: "2rem", borderRadius: "0.625rem",
                  background: "var(--honey-100)", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px var(--honey-200)", flexShrink: 0,
                }}>
                  <TrendingUp style={{ width: "1rem", height: "1rem", color: "var(--honey-600)" }} />
                </div>
                <h2 className="card-title">This month vs last</h2>
              </div>
              <div className="card-body">
                {/* Two stat minis side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <div className="stat-mini stat-mini--honey">
                    <p className="stat-mini-label">This month</p>
                    <p className="stat-mini-value">${fmt(data.currentTotal)}</p>
                  </div>
                  <div className="stat-mini" style={{
                    background: "rgba(255,255,255,0.7)",
                    color: "var(--color-muted)",
                    boxShadow: "inset 0 0 0 1px var(--cream-300), var(--shadow-soft)",
                  }}>
                    <p className="stat-mini-label">Last month</p>
                    <p className="stat-mini-value" style={{ fontSize: "1.5rem", fontWeight: 900, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em", marginTop: "0.5rem" }}>
                      ${fmt(data.prevTotal)}
                    </p>
                  </div>
                </div>

                {/* Trend indicator */}
                {(() => {
                  const diff = data.currentTotal - data.prevTotal;
                  const isUp = diff >= 0;
                  const pct = data.prevTotal > 0 ? Math.abs(diff / data.prevTotal * 100).toFixed(0) : null;
                  return (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.625rem",
                      borderRadius: "0.875rem",
                      padding: "0.75rem 1rem",
                      background: isUp ? "var(--blush-50)" : "var(--sage-50)",
                      boxShadow: `inset 0 0 0 1px ${isUp ? "var(--blush-200)" : "var(--sage-200)"}`,
                    }}>
                      {isUp
                        ? <TrendingUp style={{ width: "1.125rem", height: "1.125rem", color: "var(--blush-600)", flexShrink: 0 }} />
                        : <TrendingDown style={{ width: "1.125rem", height: "1.125rem", color: "var(--sage-600)", flexShrink: 0 }} />
                      }
                      <div>
                        <p style={{
                          fontWeight: 700, fontSize: "0.9375rem",
                          color: isUp ? "var(--blush-700)" : "var(--sage-700)",
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {isUp ? `+ $${fmt(diff)} more` : `- $${fmt(Math.abs(diff))} less`}
                          {pct && <span style={{ fontWeight: 500, fontSize: "0.8125rem", marginLeft: "0.375rem", opacity: 0.8 }}>({pct}%)</span>}
                        </p>
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                          {isUp ? "Spending is up compared to last month" : "Spending is down compared to last month"}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ── Spending breakdown ── */}
            <div className="card animate-fade-up delay-100">
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "2rem", height: "2rem", borderRadius: "0.625rem",
                  background: "var(--lavender-100)", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px var(--lavender-200)", flexShrink: 0,
                }}>
                  <BarChart3 style={{ width: "1rem", height: "1rem", color: "var(--lavender-600)" }} />
                </div>
                <h2 className="card-title">Spending breakdown</h2>
              </div>
              <div className="card-body">
                {data.categories.length === 0 ? (
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", textAlign: "center", padding: "1rem 0" }}>
                    No category data available.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {data.categories.slice(0, 8).map((cat, i) => {
                      const max = data.categories[0].total;
                      const pct = max > 0 ? (cat.total / max) * 100 : 0;
                      const color = BAR_COLORS[i % BAR_COLORS.length];
                      return (
                        <div key={cat.name}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-fg)" }}>{cat.name}</span>
                            <span style={{ fontSize: "0.875rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-fg)" }}>
                              ${fmt(cat.total)}
                            </span>
                          </div>
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${pct}%`, background: color.fill, transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Recurring charges ── */}
            <div className="card animate-fade-up delay-150">
              <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "2rem", height: "2rem", borderRadius: "0.625rem",
                  background: "var(--sage-100)", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px var(--sage-200)", flexShrink: 0,
                }}>
                  <Repeat2 style={{ width: "1rem", height: "1rem", color: "var(--sage-600)" }} />
                </div>
                <h2 className="card-title">Recurring charges</h2>
              </div>
              <div className="card-body">
                {data.subscriptions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "1.25rem 0" }}>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>No recurring charges detected yet.</p>
                  </div>
                ) : (
                  <ul style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                    {data.subscriptions.map((sub, i) => (
                      <li key={sub.name}>
                        {i > 0 && <hr className="separator" />}
                        <div className="list-item-row" style={{ padding: "0.625rem 0.25rem" }}>
                          <div style={{
                            width: "2rem", height: "2rem", borderRadius: "0.625rem", flexShrink: 0,
                            background: "var(--cream-200)", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Repeat2 style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-muted)" }} />
                          </div>
                          <div className="list-item-content">
                            <p className="list-item-name">{sub.name}</p>
                            <p className="list-item-meta">
                              Seen {sub.occurrences} time{sub.occurrences === 1 ? "" : "s"}
                              {" · "}last {new Date(sub.lastDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: "0.875rem", fontVariantNumeric: "tabular-nums", color: "var(--color-fg)" }}>
                              ${sub.amount.toFixed(2)}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>per charge</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : null}

      </main>
    </div>
  );
}
