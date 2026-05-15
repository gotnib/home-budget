"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, CheckCircle2, Wallet, ChevronDown, ChevronUp, Trash2, Plus } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ManualIncomeForm } from "@/components/forms/ManualIncomeForm";

interface BudgetData {
  monthlyIncome: number;
  fixedBills: number;
  savingsGoal: number;
  groceryPercent: number;
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  cadence: string;
  dueDay: number | null;
}

type PayPeriod = "weekly" | "biweekly" | "twicemonthly" | "monthly";

const PAY_PERIODS: { key: PayPeriod; label: string; perYear: number }[] = [
  { key: "weekly",        label: "Weekly",       perYear: 52 },
  { key: "biweekly",     label: "Biweekly",      perYear: 26 },
  { key: "twicemonthly", label: "Twice Monthly", perYear: 24 },
  { key: "monthly",      label: "Monthly",       perYear: 12 },
];

const CADENCE_SHORT: Record<string, string> = {
  weekly: "wk", biweekly: "2wk", monthly: "mo", annually: "yr",
};

function perPeriod(monthlyAmount: number, period: PayPeriod): number {
  const p = PAY_PERIODS.find((x) => x.key === period)!;
  return (monthlyAmount * 12) / p.perYear;
}

const fmt      = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtShort = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function PaycheckCard({ monthlyIncome, savingsGoal, groceryBudget, bills, initialPeriod }: {
  monthlyIncome: number; savingsGoal: number; groceryBudget: number; bills: Bill[]; initialPeriod: PayPeriod;
}) {
  const [period, setPeriod] = useState<PayPeriod>(initialPeriod);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [billPickerOpen, setBillPickerOpen] = useState(true);

  function selectPeriod(p: PayPeriod) {
    setPeriod(p);
    fetch("/api/user-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payPeriod: p }),
    });
  }

  function toggleBill(id: string) {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAllBills() {
    setSelectedBillIds(new Set(bills.map((b) => b.id)));
  }

  const income        = perPeriod(monthlyIncome, period);
  const savings       = perPeriod(savingsGoal, period);
  const groceries     = perPeriod(groceryBudget, period);
  const selectedBills = bills.filter((b) => selectedBillIds.has(b.id));
  const billsTotal    = selectedBills.reduce((s, b) => s + b.amount, 0);
  const totalOut      = billsTotal + savings + groceries;
  const leftover      = income - totalOut;
  const isShort       = leftover < 0;
  const periodLabel   = PAY_PERIODS.find((p2) => p2.key === period)!.label.toLowerCase();

  const rows = [
    { label: `Bills (${selectedBills.length} selected)`, amount: billsTotal,  color: "var(--blush-400)"    },
    { label: "Savings",                                   amount: savings,     color: "var(--lavender-400)" },
    { label: "Groceries",                                 amount: groceries,   color: "var(--honey-400)"    },
  ].filter((r) => r.amount > 0);

  return (
    <div className="card animate-fade-up delay-150">
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="icon-pill icon-pill--honey icon-pill--sm">
            <Wallet style={{ width: "1rem", height: "1rem" }} />
          </span>
          <h3 className="card-title">Per Paycheck Budget</h3>
        </div>
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Period selector */}
        <div>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>How often do you get paid?</p>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
            {PAY_PERIODS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => selectPeriod(key)} style={{ padding: "0.4375rem 0.875rem", borderRadius: "0.75rem", border: "1px solid", borderColor: period === key ? "var(--honey-400)" : "var(--cream-300)", background: period === key ? "var(--honey-100)" : "white", fontWeight: 700, fontSize: "0.8125rem", color: period === key ? "var(--honey-800)" : "var(--color-muted)", cursor: "pointer", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {monthlyIncome === 0 ? (
          <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", textAlign: "center", padding: "0.5rem 0" }}>
            Add income sources on the Dashboard to see your paycheck breakdown.
          </p>
        ) : (
          <>
            {/* Paycheck income */}
            <div style={{ borderRadius: "1rem", background: "linear-gradient(135deg, var(--sage-50), var(--cream-100))", border: "1px solid var(--sage-200)", padding: "1rem" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--sage-700)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {PAY_PERIODS.find((p2) => p2.key === period)!.label} paycheck
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--color-fg)", marginTop: "0.25rem" }}>
                {fmtShort(income)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                {fmt(monthlyIncome)}/mo ÷ {PAY_PERIODS.find((p2) => p2.key === period)!.perYear / 12} paychecks per month
              </p>
            </div>

            {/* Bill picker */}
            {bills.length > 0 && (
              <div style={{ border: "1px solid var(--cream-200)", borderRadius: "0.875rem", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setBillPickerOpen((v) => !v)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0.75rem 1rem", background: "var(--cream-100)", border: "none", cursor: "pointer" }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-fg)" }}>
                      Which bills are due this {periodLabel} check?
                    </span>
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      {selectedBills.length} of {bills.length} · {fmtShort(billsTotal)}
                    </span>
                  </div>
                  {billPickerOpen
                    ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)", flexShrink: 0 }} />
                    : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)", flexShrink: 0 }} />
                  }
                </button>

                {billPickerOpen && (
                  <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.375rem" }}>
                      <button
                        type="button"
                        onClick={() => selectedBillIds.size === bills.length ? setSelectedBillIds(new Set()) : selectAllBills()}
                        style={{ fontSize: "0.75rem", color: "var(--blush-700)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                      >
                        {selectedBillIds.size === bills.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                      {bills.map((bill) => {
                        const checked = selectedBillIds.has(bill.id);
                        return (
                          <label
                            key={bill.id}
                            style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.5rem", borderRadius: "0.625rem", cursor: "pointer", background: checked ? "var(--blush-50)" : "transparent", border: "1px solid", borderColor: checked ? "var(--blush-200)" : "transparent" }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBill(bill.id)}
                              style={{ accentColor: "var(--blush-600)", width: "1rem", height: "1rem", flexShrink: 0 }}
                            />
                            <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, color: "var(--color-fg)" }}>{bill.name}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{CADENCE_SHORT[bill.cadence] ?? bill.cadence}</span>
                            <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: checked ? "var(--blush-700)" : "var(--color-fg)", fontVariantNumeric: "tabular-nums" }}>
                              ${bill.amount.toFixed(2)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Breakdown rows */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map(({ label, amount, color }, idx) => {
                const pct = income > 0 ? Math.min(100, (amount / income) * 100) : 0;
                return (
                  <div key={label} style={{ padding: "0.75rem 0", borderBottom: idx < rows.length - 1 ? "1px solid var(--cream-200)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>
                        <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: color, flexShrink: 0 }} />
                        {label}
                      </span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: "0.9375rem" }}>
                        {fmtShort(amount)}
                        <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--color-muted)", marginLeft: "0.25rem" }}>{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div style={{ height: "4px", borderRadius: "9999px", background: "var(--cream-200)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "9999px", transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leftover */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: "0.875rem", background: isShort ? "var(--blush-50)" : "var(--sage-50)", border: "1px solid", borderColor: isShort ? "var(--blush-200)" : "var(--sage-200)" }}>
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: isShort ? "var(--blush-700)" : "var(--sage-700)" }}>
                  {isShort ? "Short this paycheck" : "Left after this check"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                  {fmtShort(income)} income − {fmtShort(totalOut)} committed
                </p>
              </div>
              <p style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.03em", color: isShort ? "var(--blush-700)" : "var(--sage-700)" }}>
                {isShort ? "-" : ""}{fmtShort(Math.abs(leftover))}
              </p>
            </div>

            {/* Biweekly bonus note */}
            {period === "biweekly" && (
              <div style={{ fontSize: "0.8125rem", color: "var(--color-muted)", background: "var(--honey-50)", border: "1px solid var(--honey-200)", borderRadius: "0.75rem", padding: "0.625rem 0.875rem", lineHeight: 1.5 }}>
                🎉 <strong style={{ color: "var(--honey-800)" }}>Bonus paycheck months:</strong> Biweekly workers get 2 extra paychecks per year (~{fmtShort(income * 2)} extra). Great for debt, savings, or a buffer.
              </div>
            )}

            {/* Quick reference */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[
                { label: `${PAY_PERIODS.find((p2) => p2.key === period)!.label} income`,  value: fmtShort(income) },
                { label: "Annual income",  value: fmtShort(monthlyIncome * 12) },
                { label: `${periodLabel} savings`, value: fmtShort(savings) },
                { label: "Annual savings", value: fmtShort(savingsGoal * 12) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--cream-100)", borderRadius: "0.625rem", padding: "0.625rem 0.75rem" }}>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                  <p style={{ fontWeight: 700, fontSize: "1rem", marginTop: "0.125rem" }}>{value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [incomes, setIncomes] = useState<Array<{id:string;name:string;amount:number;cadence:string}>>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [groceryPercent, setGroceryPercent] = useState(25);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [savingsGoalInput, setSavingsGoalInput] = useState("0");
  const [payPeriod, setPayPeriod] = useState<PayPeriod>("biweekly");

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const [budgetRes, billsRes, settingsRes, incRes] = await Promise.all([
        fetch("/api/budget"),
        fetch("/api/bills"),
        fetch("/api/user-settings"),
        fetch("/api/income"),
      ]);
      const budgetJson   = await budgetRes.json();
      const billsJson    = await billsRes.json();
      const settingsJson = settingsRes.ok ? await settingsRes.json() : {};
      const incJson      = incRes.ok ? await incRes.json() : {};
      if (!budgetRes.ok) throw new Error(budgetJson.error);
      setData(budgetJson);
      setGroceryPercent(budgetJson.groceryPercent);
      setSavingsGoal(budgetJson.savingsGoal);
      setSavingsGoalInput(String(budgetJson.savingsGoal));
      if (billsRes.ok) setBills(billsJson.bills ?? []);
      if (settingsJson.payPeriod) setPayPeriod(settingsJson.payPeriod as PayPeriod);
      setIncomes(incJson.incomes ?? []);
    } catch { setError("Failed to load budget data."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const monthlyIncome = data?.monthlyIncome ?? 0;
  const fixedBills    = data?.fixedBills ?? 0;
  const flexible      = Math.max(0, monthlyIncome - fixedBills - savingsGoal);
  const groceryBudget = Math.max(0, flexible * (groceryPercent / 100));

  const billsPct   = monthlyIncome > 0 ? Math.min(100, (fixedBills    / monthlyIncome) * 100) : 0;
  const savingsPct = monthlyIncome > 0 ? Math.min(100, (savingsGoal   / monthlyIncome) * 100) : 0;
  const groceryPct = monthlyIncome > 0 ? Math.min(100, (groceryBudget / monthlyIncome) * 100) : 0;

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

  async function handleDeleteIncome(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/income", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setIncomes((prev) => prev.filter((inc) => inc.id !== id));
    } finally {
      setDeletingId(null);
    }
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
    { label: "Income",         amount: monthlyIncome,                          color: "var(--sage-400)",     positive: true  },
    { label: "Fixed bills",    amount: -fixedBills,                            color: "var(--blush-400)",    positive: false },
    { label: "Savings goal",   amount: -savingsGoal,                           color: "var(--lavender-400)", positive: false },
    { label: "Grocery budget", amount: -groceryBudget,                         color: "var(--honey-400)",    positive: false },
    { label: "Other flexible", amount: Math.max(0, flexible - groceryBudget), color: "var(--cream-400)",    positive: true  },
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

        {/* Income sources */}
        <div className="card animate-fade-up delay-50">
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--sage-700)" }}>Income sources</h3>
            <p className="card-description">Add your salary, freelance, or any recurring income.</p>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ManualIncomeForm onSuccess={fetchBudget} />
            {incomes.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                {incomes.map((inc, i) => (
                  <div key={inc.id}>
                    {i > 0 && <hr className="separator" />}
                    <div className="list-item-row">
                      <div className="list-item-content">
                        <span className="list-item-name">{inc.name}</span>
                        <p className="list-item-meta">
                          {({weekly:"Weekly",biweekly:"Bi-weekly",monthly:"Monthly",annually:"Annually"} as Record<string,string>)[inc.cadence] ?? inc.cadence}
                          {" · "}
                          <strong style={{ color: "var(--sage-700)" }}>
                            ${(inc.cadence === "weekly" ? inc.amount*52/12 : inc.cadence === "biweekly" ? inc.amount*26/12 : inc.cadence === "annually" ? inc.amount/12 : inc.amount).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}/mo
                          </strong>
                        </p>
                      </div>
                      <p className="list-item-amount">${inc.amount.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}</p>
                      <button
                        onClick={() => handleDeleteIncome(inc.id)}
                        disabled={deletingId === inc.id}
                        aria-label="Delete income"
                        className="list-item-delete"
                      >
                        {deletingId === inc.id
                          ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                          : <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Income hero */}
        <div className="stat-hero stat-hero--sage animate-fade-up delay-100" style={{ padding: "1.25rem" }}>
          <div className="stat-hero-content">
            <p className="stat-hero-label">Monthly income</p>
            <p className="stat-hero-value" style={{ fontSize: "2.25rem", marginTop: "0.5rem" }}>{fmt(monthlyIncome)}</p>
            <p className="stat-hero-sub">{incomes.length} source{incomes.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {/* Paycheck budget */}
        <PaycheckCard
          monthlyIncome={monthlyIncome}
          savingsGoal={savingsGoal}
          groceryBudget={groceryBudget}
          bills={bills}
          initialPeriod={payPeriod}
        />

        {/* Fixed bills */}
        <div className="card animate-fade-up delay-200">
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
                value={savingsGoalInput}
                onChange={(e) => {
                  setSavingsGoalInput(e.target.value);
                  const parsed = parseFloat(e.target.value);
                  if (!isNaN(parsed) && parsed >= 0) setSavingsGoal(parsed);
                }}
                onBlur={() => {
                  const parsed = parseFloat(savingsGoalInput);
                  const clamped = isNaN(parsed) || parsed < 0 ? 0 : parsed;
                  setSavingsGoal(clamped);
                  setSavingsGoalInput(String(clamped));
                }}
                className="form-input form-input--narrow form-input--lg"
                placeholder="0"
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
                <div className="progress-fill" style={{ width: `${groceryPct}%`, background: "linear-gradient(to right, #f9cf6b, #c9b8e8)" }} />
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
