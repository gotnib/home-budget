"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface BudgetData {
  monthlyIncome: number;
  fixedBills: number;
  savingsGoal: number;
  groceryPercent: number;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function BudgetPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [groceryPercent, setGroceryPercent] = useState(25);
  const [savingsGoal, setSavingsGoal] = useState(0);

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/budget");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setGroceryPercent(json.groceryPercent);
      setSavingsGoal(json.savingsGoal);
    } catch { setError("Failed to load budget data."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const monthlyIncome = data?.monthlyIncome ?? 0;
  const fixedBills    = data?.fixedBills ?? 0;
  const flexible      = Math.max(0, monthlyIncome - fixedBills - savingsGoal);
  const groceryBudget = Math.max(0, flexible * (groceryPercent / 100));

  const billsPct    = monthlyIncome > 0 ? Math.min(100, (fixedBills    / monthlyIncome) * 100) : 0;
  const savingsPct  = monthlyIncome > 0 ? Math.min(100, (savingsGoal   / monthlyIncome) * 100) : 0;
  const groceryPct  = monthlyIncome > 0 ? Math.min(100, (groceryBudget / monthlyIncome) * 100) : 0;

  async function handleSave() {
    setIsSaving(true); setSaveSuccess(false); setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groceryPercent, savingsGoal }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaveSuccess(true);
      await fetchBudget();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally { setIsSaving(false); }
  }

  if (isLoading) {
    return (
      <div className="app-layout">
        <Navbar />
        <div className="loading-center">
          <Loader2 style={{ width: "2rem", height: "2rem", color: "var(--honey-400)", animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  const breakdownRows = [
    { label: "Income",         amount: monthlyIncome,                            color: "var(--sage-400)",     positive: true  },
    { label: "Fixed bills",    amount: -fixedBills,                              color: "var(--blush-400)",    positive: false },
    { label: "Savings goal",   amount: -savingsGoal,                             color: "var(--lavender-400)", positive: false },
    { label: "Grocery budget", amount: -groceryBudget,                           color: "var(--honey-400)",    positive: false },
    { label: "Other flexible", amount: Math.max(0, flexible - groceryBudget),   color: "var(--cream-400)",    positive: true  },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container--sm">

        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Finance</p>
          <h1 className="page-title">Budget</h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>Adjust your savings and grocery allocation.</p>
        </div>

        {error && <div className="alert alert--error animate-slide-up">{error}</div>}

        {/* Income hero */}
        <div className="stat-hero stat-hero--sage animate-fade-up delay-50" style={{ padding: "1.25rem" }}>
          <div className="stat-hero-content">
            <p className="stat-hero-label">Monthly income</p>
            <p className="stat-hero-value" style={{ fontSize: "2.25rem", marginTop: "0.5rem" }}>{fmt(monthlyIncome)}</p>
            <p className="stat-hero-sub">Calculated from your income sources</p>
          </div>
        </div>

        {/* Fixed bills */}
        <div className="card animate-fade-up delay-100">
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--blush-700)" }}>Fixed bills</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <p style={{ fontSize: "1.875rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--blush-800)" }}>{fmt(fixedBills)}</p>
              <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>{billsPct.toFixed(0)}% of income</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-fill--blush" style={{ width: `${billsPct}%` }} />
            </div>
          </div>
        </div>

        {/* Savings goal */}
        <div className="card animate-fade-up delay-150">
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--lavender-700)" }}>Monthly savings goal</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: "var(--color-muted)", fontWeight: 500 }}>$</span>
              <input
                type="number" min="0" step="10"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="form-input form-input--narrow form-input--lg"
              />
              <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>({savingsPct.toFixed(0)}% of income)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-fill--lavender" style={{ width: `${savingsPct}%` }} />
            </div>
          </div>
        </div>

        {/* Grocery % */}
        <div className="card animate-fade-up delay-200">
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--honey-700)" }}>Grocery allocation</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label htmlFor="grocery-pct" className="form-label" style={{ margin: 0 }}>
                  % of flexible budget for groceries
                </label>
                <span style={{ fontSize: "1.25rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--honey-700)" }}>{groceryPercent}%</span>
              </div>
              <input
                id="grocery-pct" type="range" min={0} max={100} step={1}
                value={groceryPercent}
                onChange={(e) => setGroceryPercent(parseInt(e.target.value, 10))}
                className="form-range"
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(154,126,90,0.6)" }}>
                <span>0%</span><span>100%</span>
              </div>
            </div>

            <div style={{ borderRadius: "1rem", background: "linear-gradient(to right, var(--honey-50), var(--lavender-50))", padding: "1rem", boxShadow: "inset 0 0 0 1px var(--honey-200)" }}>
              <p className="section-label" style={{ marginBottom: "0.25rem" }}>Your grocery budget</p>
              <p style={{ fontSize: "2.25rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-fg)" }}>{fmt(groceryBudget)}</p>
              <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                {groceryPercent}% × {fmt(flexible)} flexible = {fmt(groceryBudget)}/mo
              </p>
              <div className="progress-track" style={{ marginTop: "0.75rem" }}>
                <div
                  className="progress-fill"
                  style={{ width: `${groceryPct}%`, background: "linear-gradient(to right, #f9cf6b, #c9b8e8)" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="card animate-fade-up delay-250">
          <div className="card-body">
            <p className="section-label" style={{ marginBottom: "0.75rem" }}>Monthly breakdown</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {breakdownRows.map(({ label, amount, color, positive }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-muted)" }}>
                    <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: color, flexShrink: 0 }} />
                    {label}
                  </span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: positive ? "var(--sage-700)" : "var(--color-fg)" }}>
                    {amount < 0 ? "-" : "+"}{fmt(Math.abs(amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }} className="animate-fade-up delay-300">
          {saveSuccess && (
            <div className="alert alert--success animate-scale-in" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "var(--sage-500)" }} />
              Budget settings saved!
            </div>
          )}
          <button onClick={handleSave} disabled={isSaving} className="btn btn--honey btn--lg" style={{ width: "100%", gap: "0.5rem" }}>
            {isSaving
              ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
              : <Save style={{ width: "1rem", height: "1rem" }} />
            }
            Save Budget Settings
          </button>
        </div>
      </main>
    </div>
  );
}
