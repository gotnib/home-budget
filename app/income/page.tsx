"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ManualIncomeForm } from "@/components/forms/ManualIncomeForm";
import { Loader2, Trash2, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Income {
  id: string;
  name: string;
  amount: number;
  cadence: string;
  source: string;
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

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchIncomes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/income");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIncomes(data.incomes ?? []);
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

  const totalMonthly = incomes.reduce((s, i) => s + monthlyAmount(i.amount, i.cadence), 0);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container--md">

        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Finance</p>
          <h1 className="page-title">Income</h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>Track all your income sources.</p>
        </div>

        {error && <div className="alert alert--error animate-slide-up">{error}</div>}

        {/* Hero stat */}
        <div className="stat-hero stat-hero--sage animate-fade-up delay-50" style={{ padding: "1.25rem" }}>
          <div className="stat-hero-content">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p className="stat-hero-label">Total monthly income</p>
                <p className="stat-hero-value" style={{ fontSize: "2.25rem", marginTop: "0.5rem" }}>{fmt(totalMonthly)}</p>
                <p className="stat-hero-sub">{incomes.length} source{incomes.length === 1 ? "" : "s"}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                <span className="stat-hero-icon" style={{ width: "3rem", height: "3rem" }}>
                  <TrendingUp style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
                </span>
                <Link href="/settings">
                  <button className="btn--glass">
                    <Building2 style={{ width: "0.875rem", height: "0.875rem" }} />
                    Import from bank
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

        {/* List */}
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
      </main>
    </div>
  );
}
