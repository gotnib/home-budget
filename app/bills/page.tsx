"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Trash2, Building2, Receipt, Pencil, Check, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ManualBillForm } from "@/components/forms/ManualBillForm";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number | null;
  cadence: string;
  source: string;
}

interface EditState {
  name: string;
  amount: string;
  dueDay: string;
  cadence: string;
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

function isDueSoon(dueDay: number | null): boolean {
  if (dueDay == null) return false;
  const diff = dueDay - new Date().getDate();
  return diff >= 0 && diff <= 7;
}

function isOverdue(dueDay: number | null): boolean {
  if (dueDay == null) return false;
  return dueDay < new Date().getDate();
}

function paidKey(id: string): string {
  const d = new Date();
  return `bill-paid-${id}-${d.getFullYear()}-${d.getMonth()}`;
}

function getBillPaid(id: string): boolean {
  try { return localStorage.getItem(paidKey(id)) === "1"; } catch { return false; }
}

function setBillPaid(id: string, paid: boolean) {
  try {
    if (paid) localStorage.setItem(paidKey(id), "1");
    else localStorage.removeItem(paidKey(id));
  } catch { /* ignore */ }
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", amount: "", dueDay: "", cadence: "monthly" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bills");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const fetched: Bill[] = data.bills;
      setBills(fetched);
      // Load paid state from localStorage
      const paid = new Set<string>();
      fetched.forEach((b) => { if (getBillPaid(b.id)) paid.add(b.id); });
      setPaidIds(paid);
    } catch { setError("Failed to load bills."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  function startEdit(bill: Bill) {
    setEditingId(bill.id);
    setEditState({
      name: bill.name,
      amount: String(bill.amount),
      dueDay: bill.dueDay != null ? String(bill.dueDay) : "",
      cadence: bill.cadence,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSaveEdit(id: string) {
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch("/api/bills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editState.name,
          amount: parseFloat(editState.amount),
          dueDay: editState.dueDay === "" ? null : parseInt(editState.dueDay, 10),
          cadence: editState.cadence,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setBills((prev) => prev.map((b) => b.id === id ? { ...b, ...data.bill } : b));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSavingId(null); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/bills", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch { setError("Failed to delete bill."); }
    finally { setDeletingId(null); }
  }

  function handleTogglePaid(id: string) {
    const next = !paidIds.has(id);
    setBillPaid(id, next);
    setPaidIds((prev) => {
      const s = new Set(prev);
      next ? s.add(id) : s.delete(id);
      return s;
    });
  }

  const totalMonthly = bills.reduce((s, b) => s + monthlyAmount(b.amount, b.cadence), 0);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container--md">

        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Expenses</p>
          <h1 className="page-title">Bills</h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>Track your recurring expenses and due dates.</p>
        </div>

        {error && <div className="alert alert--error animate-slide-up">{error}</div>}

        {/* Summary hero */}
        <div className="stat-hero stat-hero--blush animate-fade-up delay-50" style={{ padding: "1.25rem" }}>
          <div className="stat-hero-content">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p className="stat-hero-label">Total monthly</p>
                <p className="stat-hero-value" style={{ fontSize: "2.25rem", marginTop: "0.5rem" }}>
                  ${totalMonthly.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <p className="stat-hero-sub">{bills.length} recurring bill{bills.length === 1 ? "" : "s"}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                <span className="stat-hero-icon" style={{ width: "3rem", height: "3rem" }}>
                  <Receipt style={{ width: "1.5rem", height: "1.5rem", color: "white" }} />
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
            <h3 className="card-title" style={{ color: "var(--blush-700)" }}>Add a bill</h3>
          </div>
          <div className="card-body">
            <ManualBillForm onSuccess={fetchBills} />
          </div>
        </div>

        {/* Bills list */}
        <div className="card animate-fade-up delay-150">
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="card-title">Your bills</h3>
            {bills.length > 0 && <span className="badge badge--blush">{bills.length}</span>}
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="loading-center">
                <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--blush-400)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : bills.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: "2.5rem" }}>📋</span>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-fg)" }}>No bills yet</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Add your first bill above.</p>
                </div>
              </div>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                {bills.map((bill, i) => {
                  const paid = paidIds.has(bill.id);
                  const over = !paid && isOverdue(bill.dueDay);
                  const soon = !paid && !over && isDueSoon(bill.dueDay);
                  const isEditing = editingId === bill.id;

                  return (
                    <li key={bill.id}>
                      {i > 0 && <hr className="separator" />}

                      {isEditing ? (
                        /* ── Edit row ── */
                        <div style={{ padding: "0.75rem 0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div className="form-grid-2" style={{ gap: "0.5rem" }}>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Name</label>
                              <input
                                className="form-input"
                                value={editState.name}
                                onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
                              />
                            </div>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Amount ($)</label>
                              <input
                                className="form-input"
                                type="number" min="0" step="0.01"
                                value={editState.amount}
                                onChange={(e) => setEditState((s) => ({ ...s, amount: e.target.value }))}
                              />
                            </div>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Due day of month</label>
                              <input
                                className="form-input"
                                type="number" min="1" max="31" placeholder="1–31 (optional)"
                                value={editState.dueDay}
                                onChange={(e) => setEditState((s) => ({ ...s, dueDay: e.target.value }))}
                              />
                            </div>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Cadence</label>
                              <select
                                className="form-select"
                                value={editState.cadence}
                                onChange={(e) => setEditState((s) => ({ ...s, cadence: e.target.value }))}
                              >
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="annually">Annually</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => handleSaveEdit(bill.id)}
                              disabled={savingId === bill.id}
                              className="btn btn--soft btn--sm"
                              style={{ gap: "0.375rem" }}
                            >
                              {savingId === bill.id
                                ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                                : <Check style={{ width: "0.875rem", height: "0.875rem" }} />
                              }
                              Save
                            </button>
                            <button onClick={cancelEdit} className="btn btn--outline btn--sm" style={{ gap: "0.375rem" }}>
                              <X style={{ width: "0.875rem", height: "0.875rem" }} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Display row ── */
                        <div className="list-item-row" style={{ opacity: paid ? 0.55 : 1 }}>
                          <div className="list-item-content">
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" }}>
                              <span className="list-item-name" style={{ textDecoration: paid ? "line-through" : "none" }}>
                                {bill.name}
                              </span>
                              {bill.source === "plaid" && <span className="badge badge--lavender">bank</span>}
                              {paid  && <span className="badge badge--sage">paid</span>}
                              {over  && <span className="badge badge--blush">overdue</span>}
                              {soon  && <span className="badge badge--honey">due soon</span>}
                            </div>
                            <p className="list-item-meta">
                              {CADENCE_LABEL[bill.cadence] ?? bill.cadence}
                              {bill.dueDay != null && ` · due the ${bill.dueDay}th`}
                              {" · "}
                              <strong style={{ fontWeight: 600, color: over ? "var(--blush-600)" : "var(--color-fg)" }}>
                                ${monthlyAmount(bill.amount, bill.cadence).toFixed(0)}/mo
                              </strong>
                            </p>
                          </div>

                          <p className="list-item-amount">${bill.amount.toFixed(2)}</p>

                          {/* Mark paid / unpaid */}
                          <button
                            onClick={() => handleTogglePaid(bill.id)}
                            title={paid ? "Mark as unpaid" : "Mark as paid"}
                            style={{
                              background: "none", border: "none", cursor: "pointer", padding: "0.375rem",
                              borderRadius: "0.5rem", color: paid ? "var(--sage-500)" : "var(--color-muted)",
                              transition: "color 0.15s, background 0.15s",
                              flexShrink: 0,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cream-100)"; e.currentTarget.style.color = "var(--sage-600)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = paid ? "var(--sage-500)" : "var(--color-muted)"; }}
                          >
                            <CheckCircle2 style={{ width: "1rem", height: "1rem" }} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => startEdit(bill)}
                            title="Edit bill"
                            style={{
                              background: "none", border: "none", cursor: "pointer", padding: "0.375rem",
                              borderRadius: "0.5rem", color: "var(--color-muted)",
                              transition: "color 0.15s, background 0.15s",
                              flexShrink: 0,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cream-100)"; e.currentTarget.style.color = "var(--lavender-600)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--color-muted)"; }}
                          >
                            <Pencil style={{ width: "0.875rem", height: "0.875rem" }} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(bill.id)}
                            disabled={deletingId === bill.id}
                            aria-label="Delete bill"
                            className="list-item-delete"
                          >
                            {deletingId === bill.id
                              ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                              : <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                            }
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
