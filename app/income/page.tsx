"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ManualIncomeForm } from "@/components/forms/ManualIncomeForm";
import { Loader2, Trash2, Building2, TrendingUp, Plus, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface Income {
  id: string;
  name: string;
  amount: number;
  cadence: string;
  source: string;
}

interface IncomeEntry {
  id: string;
  sourceName: string;
  amount: number;
  receivedAt: string;
  note: string | null;
}

const CADENCE_LABEL: Record<string, string> = {
  weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", annually: "Annually",
};

function monthlyAmount(amount: number, cadence: string): number {
  switch (cadence) {
    case "weekly":   return (amount * 52) / 12;
    case "biweekly": return (amount * 26) / 12;
    case "annually": return amount / 12;
    default:         return amount;
  }
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Log paycheck form
  const [logSource, setLogSource] = useState("");
  const [logAmount, setLogAmount] = useState("");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logNote, setLogNote] = useState("");
  const [logSaving, setLogSaving] = useState(false);

  const fetchIncomes = useCallback(async () => {
    setIsLoading(true);
    try {
      const [incRes, histRes] = await Promise.all([fetch("/api/income"), fetch("/api/income/history")]);
      const incData = await incRes.json();
      const histData = await histRes.json();
      if (!incRes.ok) throw new Error(incData.error);
      setIncomes(incData.incomes ?? []);
      setEntries(histData.entries ?? []);
    } catch { setError("Failed to load income sources."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchIncomes(); }, [fetchIncomes]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/income", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setIncomes((prev) => prev.filter((i) => i.id !== id));
    } catch { setError("Failed to delete income source."); }
    finally { setDeletingId(null); }
  }

  async function handleLogPaycheck(e: React.FormEvent) {
    e.preventDefault();
    if (!logSource.trim() || !logAmount || !logDate) return;
    setLogSaving(true);
    try {
      const res = await fetch("/api/income/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceName: logSource.trim(),
          amount: parseFloat(logAmount),
          receivedAt: logDate,
          note: logNote.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries((prev) => [data.entry, ...prev]);
      setLogAmount("");
      setLogNote("");
    } catch { setError("Failed to log paycheck."); }
    finally { setLogSaving(false); }
  }

  async function handleDeleteEntry(id: string) {
    try {
      await fetch("/api/income/history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch { /* ignore */ }
  }

  const totalMonthly = incomes.reduce((s, i) => s + monthlyAmount(i.amount, i.cadence), 0);
  const ytdTotal = entries.filter((e) => new Date(e.receivedAt).getFullYear() === new Date().getFullYear())
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container--md">

        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Finance</p>
          <h1 className="page-title">Income</h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>Track all your income sources and log paychecks.</p>
        </div>

        {error && <div className="alert alert--error animate-slide-up">{error}</div>}

        {/* Hero stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }} className="animate-fade-up delay-50">
          <div className="stat-hero stat-hero--sage" style={{ padding: "1.25rem" }}>
            <div className="stat-hero-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p className="stat-hero-label">Monthly income</p>
                  <p className="stat-hero-value" style={{ fontSize: "1.75rem", marginTop: "0.375rem" }}>{fmt(totalMonthly)}</p>
                  <p className="stat-hero-sub">{incomes.length} source{incomes.length === 1 ? "" : "s"}</p>
                </div>
                <span className="stat-hero-icon" style={{ width: "2.5rem", height: "2.5rem" }}>
                  <TrendingUp style={{ width: "1.25rem", height: "1.25rem", color: "white" }} />
                </span>
              </div>
            </div>
          </div>
          <div className="stat-hero stat-hero--honey" style={{ padding: "1.25rem" }}>
            <div className="stat-hero-content">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p className="stat-hero-label">Logged this year</p>
                  <p className="stat-hero-value" style={{ fontSize: "1.75rem", marginTop: "0.375rem" }}>{fmt(ytdTotal)}</p>
                  <p className="stat-hero-sub">{entries.filter((e) => new Date(e.receivedAt).getFullYear() === new Date().getFullYear()).length} paychecks</p>
                </div>
                <Link href="/settings">
                  <button className="btn--glass">
                    <Building2 style={{ width: "0.875rem", height: "0.875rem" }} />
                    Bank
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Add form */}
        <div className="card animate-fade-up delay-100">
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--sage-700)" }}>Add an income source</h3>
          </div>
          <div className="card-body">
            <ManualIncomeForm onSuccess={fetchIncomes} />
          </div>
        </div>

        {/* Sources list */}
        <div className="card animate-fade-up delay-150">
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="card-title">Your income sources</h3>
            {incomes.length > 0 && <span className="badge badge--sage">{incomes.length}</span>}
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="loading-center">
                <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--sage-400)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : incomes.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: "2.5rem" }}>💰</span>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-fg)" }}>No income sources yet</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Add your first income source above.</p>
                </div>
              </div>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                {incomes.map((income, i) => (
                  <li key={income.id}>
                    {i > 0 && <hr className="separator" />}
                    <div className="list-item-row">
                      <div className="list-item-content">
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" }}>
                          <span className="list-item-name">{income.name}</span>
                          {income.source === "plaid" && <span className="badge badge--lavender">bank</span>}
                        </div>
                        <p className="list-item-meta">
                          {CADENCE_LABEL[income.cadence] ?? income.cadence}
                          {" · "}
                          <strong style={{ fontWeight: 600, color: "var(--sage-700)" }}>
                            {fmt(monthlyAmount(income.amount, income.cadence))}/mo
                          </strong>
                        </p>
                      </div>
                      <p className="list-item-amount">{fmt(income.amount)}</p>
                      <button
                        onClick={() => handleDelete(income.id)}
                        disabled={deletingId === income.id}
                        aria-label="Delete income source"
                        className="list-item-delete"
                      >
                        {deletingId === income.id
                          ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                          : <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                        }
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Pay stub history */}
        <div className="card animate-fade-up delay-200">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: historyOpen ? "1.25rem 1.25rem 0" : "1.25rem" }}
          >
            <div>
              <h3 className="card-title">Paycheck log</h3>
              <p className="card-description">{entries.length > 0 ? `${entries.length} entries logged` : "Track each paycheck as it arrives"}</p>
            </div>
            {historyOpen
              ? <ChevronUp style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-muted)", flexShrink: 0 }} />
              : <ChevronDown style={{ width: "1.125rem", height: "1.125rem", color: "var(--color-muted)", flexShrink: 0 }} />
            }
          </button>

          {historyOpen && (
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Log form */}
              <form onSubmit={handleLogPaycheck} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-fg)" }}>Log a paycheck</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div className="form-field">
                    <label className="form-label">Source name</label>
                    <input
                      type="text"
                      value={logSource}
                      onChange={(e) => setLogSource(e.target.value)}
                      placeholder="e.g. Employer"
                      className="form-input"
                      list="income-source-list"
                    />
                    <datalist id="income-source-list">
                      {incomes.map((i) => <option key={i.id} value={i.name} />)}
                    </datalist>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Amount ($)</label>
                    <input
                      type="number"
                      value={logAmount}
                      onChange={(e) => setLogAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="form-input"
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <div className="form-field">
                    <label className="form-label">Date received</label>
                    <input
                      type="date"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Note (optional)</label>
                    <input
                      type="text"
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      placeholder="e.g. Bonus included"
                      className="form-input"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={logSaving || !logSource.trim() || !logAmount}
                  className="btn btn--sage"
                  style={{ gap: "0.5rem", alignSelf: "flex-start" }}
                >
                  {logSaving
                    ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                    : <Plus style={{ width: "0.875rem", height: "0.875rem" }} />
                  }
                  Log paycheck
                </button>
              </form>

              <hr className="separator" />

              {/* History list */}
              {entries.length === 0 ? (
                <div className="empty-state" style={{ padding: "1rem 0" }}>
                  <span style={{ fontSize: "2rem" }}>📬</span>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>No paychecks logged yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {entries.map((entry, i) => (
                    <div key={entry.id}>
                      {i > 0 && <hr className="separator" />}
                      <div className="list-item-row">
                        <div className="list-item-content">
                          <span className="list-item-name">{entry.sourceName}</span>
                          <p className="list-item-meta">
                            {fmtDate(entry.receivedAt)}
                            {entry.note && <span style={{ color: "var(--color-muted)" }}> · {entry.note}</span>}
                          </p>
                        </div>
                        <p className="list-item-amount" style={{ color: "var(--sage-700)" }}>+{fmt(entry.amount)}</p>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="list-item-delete"
                          aria-label="Delete entry"
                        >
                          <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
