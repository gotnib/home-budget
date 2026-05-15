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

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
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

/** Returns the next real due date for a bill (or null if non-monthly/no dueDay). */
function nextDueDate(dueDay: number | null, cadence: string): Date | null {
  if (dueDay == null || cadence !== "monthly") return null;
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const daysThis = new Date(y, m + 1, 0).getDate();
  const dayThis = Math.min(dueDay, daysThis);
  if (dayThis >= today.getDate()) return new Date(y, m, dayThis);
  // Due next month
  const nm = m === 11 ? 0 : m + 1;
  const ny = m === 11 ? y + 1 : y;
  const daysNext = new Date(ny, nm + 1, 0).getDate();
  return new Date(ny, nm, Math.min(dueDay, daysNext));
}

/** Human-readable due date string, e.g. "Due May 20" or "Due Jun 3". */
function dueDateLabel(dueDay: number | null, cadence: string): string {
  if (dueDay == null) return CADENCE_LABEL[cadence] ?? cadence;
  if (cadence !== "monthly") return `${CADENCE_LABEL[cadence] ?? cadence} · day ${dueDay}`;
  const d = nextDueDate(dueDay, cadence);
  if (!d) return `Day ${dueDay}`;
  const today = new Date();
  const isThisMonth = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const suffix = isThisMonth ? "" : ` ${d.getFullYear() !== today.getFullYear() ? d.getFullYear() : ""}`;
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}${suffix.trim() ? " " + suffix.trim() : ""}`;
}

function isOverdue(dueDay: number | null, cadence: string, paid: boolean): boolean {
  if (paid || dueDay == null || cadence !== "monthly") return false;
  return dueDay < new Date().getDate();
}

function isDueSoon(dueDay: number | null, cadence: string, paid: boolean): boolean {
  if (paid || dueDay == null || cadence !== "monthly") return false;
  const diff = dueDay - new Date().getDate();
  return diff >= 0 && diff <= 7;
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

/* ── Calendar ── */
function BillCalendar({
  bills, paidIds, selectedDay, onSelectDay,
}: {
  bills: Bill[];
  paidIds: Set<string>;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun

  // monthly bills only — map dueDay → bills
  const billsByDay: Record<number, Bill[]> = {};
  bills.forEach((b) => {
    if (b.dueDay != null && b.cadence === "monthly") {
      const d = Math.min(b.dueDay, daysInMonth);
      if (!billsByDay[d]) billsByDay[d] = [];
      billsByDay[d].push(b);
    }
  });

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="card animate-fade-up delay-100">
      <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 className="card-title">{MONTH_NAMES[month]} {year}</h3>
        <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Monthly bills only</span>
      </div>
      <div className="card-body" style={{ paddingTop: 0 }}>
        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "0.25rem" }}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "0.6875rem", fontWeight: 600, color: "var(--color-muted)", padding: "0.25rem 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} />;
            const isToday = day === todayDate;
            const isSelected = day === selectedDay;
            const dayBills = billsByDay[day] ?? [];
            const isPast = day < todayDate;
            const hasOverdue = dayBills.some((b) => !paidIds.has(b.id) && isPast);
            const hasUpcoming = dayBills.some((b) => !paidIds.has(b.id) && !isPast);
            const hasPaid = dayBills.some((b) => paidIds.has(b.id));

            let bg = "transparent";
            if (isToday) bg = "var(--honey-400)";
            else if (isSelected) bg = "var(--lavender-100)";

            return (
              <button
                key={day}
                onClick={() => onSelectDay(isSelected ? null : day)}
                style={{
                  background: bg,
                  border: isSelected && !isToday ? "1.5px solid var(--lavender-400)" : "1.5px solid transparent",
                  borderRadius: "0.5rem",
                  padding: "0.375rem 0.125rem 0.25rem",
                  cursor: dayBills.length > 0 || isToday ? "pointer" : "default",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                  minHeight: "2.75rem",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { if (!isToday && !isSelected) e.currentTarget.style.background = "var(--cream-100)"; }}
                onMouseLeave={(e) => { if (!isToday && !isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontSize: "0.8125rem",
                  fontWeight: isToday ? 700 : 400,
                  color: isToday ? "white" : isPast && day !== todayDate ? "var(--color-muted)" : "var(--color-fg)",
                  lineHeight: 1,
                }}>
                  {day}
                </span>
                {dayBills.length > 0 && (
                  <div style={{ display: "flex", gap: "2px", flexWrap: "wrap", justifyContent: "center" }}>
                    {hasOverdue && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--blush-500)", display: "block" }} />}
                    {hasUpcoming && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--lavender-400)", display: "block" }} />}
                    {hasPaid && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sage-400)", display: "block" }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.875rem", fontSize: "0.75rem", color: "var(--color-muted)", flexWrap: "wrap" }}>
          {[
            { color: "var(--honey-400)", label: "Today" },
            { color: "var(--blush-500)", label: "Overdue" },
            { color: "var(--lavender-400)", label: "Upcoming" },
            { color: "var(--sage-400)", label: "Paid" },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>

        {/* Selected day detail */}
        {selectedDay !== null && (() => {
          const dayBills = billsByDay[selectedDay] ?? [];
          return (
            <div style={{ marginTop: "1rem", borderRadius: "0.875rem", background: "var(--cream-100)", border: "1px solid var(--cream-200)", padding: "0.75rem 1rem" }}>
              <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-fg)", marginBottom: "0.375rem" }}>
                {MONTH_NAMES[month]} {selectedDay}{selectedDay === todayDate ? " — today" : ""}
              </p>
              {dayBills.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>No bills due this day.</p>
              ) : (
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {dayBills.map((b) => (
                    <li key={b.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--color-fg)" }}>{b.name}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>${b.amount.toFixed(2)}</span>
                        {paidIds.has(b.id)
                          ? <span className="badge badge--sage">paid</span>
                          : selectedDay < todayDate
                            ? <span className="badge badge--blush">overdue</span>
                            : selectedDay <= todayDate + 7
                              ? <span className="badge badge--honey">due soon</span>
                              : null
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ name: "", amount: "", dueDay: "", cadence: "monthly" });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = new Date();

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bills");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const fetched: Bill[] = data.bills;
      setBills(fetched);
      const paid = new Set<string>();
      fetched.forEach((b) => { if (getBillPaid(b.id)) paid.add(b.id); });
      setPaidIds(paid);
    } catch { setError("Failed to load bills."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  function startEdit(bill: Bill) {
    setEditingId(bill.id);
    setEditState({ name: bill.name, amount: String(bill.amount), dueDay: bill.dueDay != null ? String(bill.dueDay) : "", cadence: bill.cadence });
  }
  function cancelEdit() { setEditingId(null); }

  async function handleSaveEdit(id: string) {
    setSavingId(id); setError(null);
    try {
      const res = await fetch("/api/bills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editState.name, amount: parseFloat(editState.amount), dueDay: editState.dueDay === "" ? null : parseInt(editState.dueDay, 10), cadence: editState.cadence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setBills((prev) => prev.map((b) => b.id === id ? { ...b, ...data.bill } : b));
      setEditingId(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save."); }
    finally { setSavingId(null); }
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
    setPaidIds((prev) => { const s = new Set(prev); next ? s.add(id) : s.delete(id); return s; });
  }

  const totalMonthly = bills.reduce((s, b) => s + monthlyAmount(b.amount, b.cadence), 0);

  const overdueCount = bills.filter((b) => isOverdue(b.dueDay, b.cadence, paidIds.has(b.id))).length;
  const dueSoonCount = bills.filter((b) => isDueSoon(b.dueDay, b.cadence, paidIds.has(b.id))).length;

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container--md">

        {/* Header with today's date */}
        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Expenses</p>
          <h1 className="page-title">Bills</h1>
          <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>
            {DAY_NAMES[today.getDay()]}, {MONTH_NAMES[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </p>
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
                {/* Status pills */}
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {overdueCount > 0 && <span className="badge badge--blush">{overdueCount} overdue</span>}
                  {dueSoonCount > 0 && <span className="badge badge--honey">{dueSoonCount} due soon</span>}
                </div>
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

        {/* Calendar */}
        <BillCalendar
          bills={bills}
          paidIds={paidIds}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />

        {/* Add form */}
        <div className="card animate-fade-up delay-150">
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--blush-700)" }}>Add a bill</h3>
          </div>
          <div className="card-body">
            <ManualBillForm onSuccess={fetchBills} />
          </div>
        </div>

        {/* Bills list */}
        <div className="card animate-fade-up delay-200">
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
                  const over = isOverdue(bill.dueDay, bill.cadence, paid);
                  const soon = isDueSoon(bill.dueDay, bill.cadence, paid);
                  const isEditing = editingId === bill.id;

                  // For overdue bills: use THIS month's actual past date, not next month
                  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  let dueLabelStr: string | null = null;
                  let daysUntil: number | null = null;
                  let daysAgo: number | null = null;

                  if (bill.dueDay != null && bill.cadence === "monthly") {
                    if (over) {
                      // Past due this month
                      const y = today.getFullYear(), m = today.getMonth();
                      const daysInMonth = new Date(y, m + 1, 0).getDate();
                      const pastDate = new Date(y, m, Math.min(bill.dueDay, daysInMonth));
                      dueLabelStr = `${SHORT_MONTHS[pastDate.getMonth()]} ${pastDate.getDate()}`;
                      daysAgo = Math.round((todayMidnight.getTime() - pastDate.getTime()) / 86400000);
                    } else {
                      // Upcoming (this or next month)
                      const upcoming = nextDueDate(bill.dueDay, bill.cadence);
                      if (upcoming) {
                        dueLabelStr = `${SHORT_MONTHS[upcoming.getMonth()]} ${upcoming.getDate()}`;
                        daysUntil = Math.round((upcoming.getTime() - todayMidnight.getTime()) / 86400000);
                      }
                    }
                  } else if (bill.dueDay != null) {
                    dueLabelStr = `day ${bill.dueDay}`;
                  }

                  return (
                    <li key={bill.id}>
                      {i > 0 && <hr className="separator" />}

                      {isEditing ? (
                        <div style={{ padding: "0.75rem 0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <div className="form-grid-2" style={{ gap: "0.5rem" }}>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Name</label>
                              <input className="form-input" value={editState.name} onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))} />
                            </div>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Amount ($)</label>
                              <input className="form-input" type="number" min="0" step="0.01" value={editState.amount} onChange={(e) => setEditState((s) => ({ ...s, amount: e.target.value }))} />
                            </div>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Due day of month</label>
                              <input className="form-input" type="number" min="1" max="31" placeholder="1–31 (optional)" value={editState.dueDay} onChange={(e) => setEditState((s) => ({ ...s, dueDay: e.target.value }))} />
                            </div>
                            <div className="form-field" style={{ margin: 0 }}>
                              <label className="form-label">Cadence</label>
                              <select className="form-select" value={editState.cadence} onChange={(e) => setEditState((s) => ({ ...s, cadence: e.target.value }))}>
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="annually">Annually</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button onClick={() => handleSaveEdit(bill.id)} disabled={savingId === bill.id} className="btn btn--soft btn--sm" style={{ gap: "0.375rem" }}>
                              {savingId === bill.id ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} /> : <Check style={{ width: "0.875rem", height: "0.875rem" }} />}
                              Save
                            </button>
                            <button onClick={cancelEdit} className="btn btn--outline btn--sm" style={{ gap: "0.375rem" }}>
                              <X style={{ width: "0.875rem", height: "0.875rem" }} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="list-item-row" style={{ opacity: paid ? 0.55 : 1, alignItems: "flex-start", paddingTop: "0.625rem", paddingBottom: "0.625rem" }}>
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

                            {/* Due date line */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                              <p className="list-item-meta" style={{ margin: 0 }}>
                                {CADENCE_LABEL[bill.cadence] ?? bill.cadence}
                                {" · "}
                                <strong style={{ fontWeight: 600, color: "var(--color-fg)" }}>
                                  ${monthlyAmount(bill.amount, bill.cadence).toFixed(0)}/mo
                                </strong>
                              </p>
                            </div>

                            {/* Specific due date */}
                            {dueLabelStr && (
                              <p style={{ marginTop: "0.2rem", fontSize: "0.8125rem", color: over ? "var(--blush-600)" : soon ? "var(--honey-700)" : paid ? "var(--sage-600)" : "var(--color-muted)", fontWeight: 500 }}>
                                {paid
                                  ? `Paid · was due ${dueLabelStr}`
                                  : over
                                    ? `Overdue · was due ${dueLabelStr}${daysAgo != null ? ` (${daysAgo}d ago)` : ""}`
                                    : daysUntil === 0
                                      ? `Due today · ${dueLabelStr}`
                                      : daysUntil === 1
                                        ? `Due tomorrow · ${dueLabelStr}`
                                        : `Due ${dueLabelStr}${daysUntil != null ? ` · in ${daysUntil}d` : ""}`
                                }
                              </p>
                            )}
                          </div>

                          <p className="list-item-amount" style={{ marginTop: "0.125rem" }}>${bill.amount.toFixed(2)}</p>

                          {/* Mark paid */}
                          <button
                            onClick={() => handleTogglePaid(bill.id)}
                            title={paid ? "Mark as unpaid" : "Mark as paid"}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.375rem", borderRadius: "0.5rem", color: paid ? "var(--sage-500)" : "var(--color-muted)", transition: "color 0.15s, background 0.15s", flexShrink: 0 }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cream-100)"; e.currentTarget.style.color = "var(--sage-600)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = paid ? "var(--sage-500)" : "var(--color-muted)"; }}
                          >
                            <CheckCircle2 style={{ width: "1rem", height: "1rem" }} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => startEdit(bill)}
                            title="Edit bill"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.375rem", borderRadius: "0.5rem", color: "var(--color-muted)", transition: "color 0.15s, background 0.15s", flexShrink: 0 }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--cream-100)"; e.currentTarget.style.color = "var(--lavender-600)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--color-muted)"; }}
                          >
                            <Pencil style={{ width: "0.875rem", height: "0.875rem" }} />
                          </button>

                          {/* Delete */}
                          <button onClick={() => handleDelete(bill.id)} disabled={deletingId === bill.id} aria-label="Delete bill" className="list-item-delete">
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
