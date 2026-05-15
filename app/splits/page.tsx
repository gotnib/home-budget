"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Plus, Trash2, Check, Users, X,
  SplitSquareVertical, CheckCircle2, Circle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface SplitPerson {
  name: string;
  amount: number;
  settled: boolean;
}

interface SplitExpense {
  id: string;
  name: string;
  total: number;
  yourShare: number;
  paidBy: string;
  people: SplitPerson[];
  settled: boolean;
  createdAt: string;
}

interface PersonRow {
  name: string;
  amount: string;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SplitsPage() {
  const [splits, setSplits] = useState<SplitExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [iPaid, setIPaid] = useState(true);
  const [payerName, setPayerName] = useState("");
  const [people, setPeople] = useState<PersonRow[]>([
    { name: "", amount: "" },
    { name: "", amount: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Action states
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSplits = useCallback(async () => {
    try {
      const res = await fetch("/api/splits");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load splits.");
      setSplits(data.splits ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load splits.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSplits();
  }, [fetchSplits]);

  // yourShare = total - sum(people amounts) when iPaid; otherwise = 0
  const sumPeople = people.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalNum = parseFloat(formTotal) || 0;
  const yourShare = iPaid ? Math.max(0, totalNum - sumPeople) : 0;

  function addPerson() {
    setPeople((prev) => [...prev, { name: "", amount: "" }]);
  }

  function removePerson(idx: number) {
    setPeople((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePerson(idx: number, field: keyof PersonRow, value: string) {
    setPeople((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) { setFormError("Please enter an expense name."); return; }
    if (!formTotal || totalNum <= 0) { setFormError("Please enter a valid total amount."); return; }
    if (!iPaid && !payerName.trim()) { setFormError("Please enter who paid."); return; }
    const validPeople = people.filter((p) => p.name.trim());
    if (validPeople.length === 0) { setFormError("Add at least one person."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          total: totalNum,
          yourShare,
          paidBy: iPaid ? "me" : payerName.trim(),
          people: validPeople.map((p) => ({
            name: p.name.trim(),
            amount: parseFloat(p.amount) || 0,
            settled: false,
          })),
          settled: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add split.");
      // Reset form
      setFormName("");
      setFormTotal("");
      setIPaid(true);
      setPayerName("");
      setPeople([{ name: "", amount: "" }, { name: "", amount: "" }]);
      await fetchSplits();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add split.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSettle(id: string) {
    setSettlingId(id);
    try {
      const res = await fetch("/api/splits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, settled: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to settle.");
      setSplits((prev) => prev.map((s) => s.id === id ? { ...s, settled: true } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to settle split.");
    } finally {
      setSettlingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/splits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Delete failed.");
      setSplits((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete split.");
    } finally {
      setDeletingId(null);
    }
  }

  // Summary stats
  const owedToYou = splits
    .filter((s) => s.paidBy === "me" && !s.settled)
    .reduce((sum, s) => {
      const othersShare = s.people.filter((p) => !p.settled).reduce((a, p) => a + p.amount, 0);
      return sum + othersShare;
    }, 0);

  const youOwe = splits
    .filter((s) => s.paidBy !== "me" && !s.settled)
    .reduce((sum, s) => sum + s.yourShare, 0);

  const unsettled = splits.filter((s) => !s.settled);
  const settled = splits.filter((s) => s.settled);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container--md">

        {/* Page header */}
        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Finances</p>
          <h1 className="page-title">Bill Splits</h1>
        </div>

        {error && (
          <div className="alert alert--error animate-slide-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0.125rem", marginLeft: "0.5rem" }}>
              <X style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>
        )}

        {/* Summary stats */}
        <div className="animate-fade-up delay-50" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div className="stat-mini stat-mini--sage">
            <p className="stat-mini-label">Owed to you</p>
            <p className="stat-mini-value">${fmt(owedToYou)}</p>
          </div>
          <div className="stat-mini stat-mini--blush">
            <p className="stat-mini-label">You owe</p>
            <p className="stat-mini-value">${fmt(youOwe)}</p>
          </div>
        </div>

        {/* ── Add split form ── */}
        <div className="card animate-fade-up delay-100">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "2rem", height: "2rem", borderRadius: "0.625rem",
              background: "var(--honey-100)", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 0 0 1px var(--honey-200)", flexShrink: 0,
            }}>
              <SplitSquareVertical style={{ width: "1rem", height: "1rem", color: "var(--honey-600)" }} />
            </div>
            <h2 className="card-title">Add a split</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {formError && (
                <div className="alert alert--error">{formError}</div>
              )}

              <div className="form-grid-2" style={{ gap: "0.75rem" }}>
                <div className="form-field">
                  <label className="form-label">What&apos;s this expense?</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Dinner at Rosie's"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Total amount ($)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                  />
                </div>
              </div>

              {/* Who paid toggle */}
              <div className="form-field">
                <label className="form-label">Who paid?</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem", borderRadius: "0.875rem", background: "var(--cream-100)", padding: "0.25rem" }}>
                  <button
                    type="button"
                    onClick={() => setIPaid(true)}
                    style={{
                      borderRadius: "0.625rem", padding: "0.5rem",
                      fontSize: "0.875rem", fontWeight: 700,
                      background: iPaid ? "white" : "transparent",
                      color: iPaid ? "var(--color-fg)" : "var(--color-muted)",
                      border: "none", cursor: "pointer",
                      boxShadow: iPaid ? "var(--shadow-soft)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    I paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setIPaid(false)}
                    style={{
                      borderRadius: "0.625rem", padding: "0.5rem",
                      fontSize: "0.875rem", fontWeight: 700,
                      background: !iPaid ? "white" : "transparent",
                      color: !iPaid ? "var(--color-fg)" : "var(--color-muted)",
                      border: "none", cursor: "pointer",
                      boxShadow: !iPaid ? "var(--shadow-soft)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    Someone else paid
                  </button>
                </div>
                {!iPaid && (
                  <input
                    className="form-input"
                    placeholder="Their name"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    style={{ marginTop: "0.5rem" }}
                  />
                )}
              </div>

              {/* Your share preview */}
              {iPaid && totalNum > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderRadius: "0.75rem", padding: "0.625rem 0.875rem",
                  background: "var(--honey-50)", boxShadow: "inset 0 0 0 1px var(--honey-200)",
                }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--honey-700)", fontWeight: 500 }}>Your share</span>
                  <span style={{ fontSize: "0.9375rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: "var(--honey-800)" }}>
                    ${fmt(yourShare)}
                  </span>
                </div>
              )}

              {/* People rows */}
              <div className="form-field">
                <label className="form-label" style={{ marginBottom: "0.5rem" }}>Split with</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {people.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        className="form-input"
                        placeholder={`Person ${i + 1} name`}
                        value={p.name}
                        onChange={(e) => updatePerson(i, "name", e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input
                        className="form-input form-input--narrow"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        value={p.amount}
                        onChange={(e) => updatePerson(i, "amount", e.target.value)}
                      />
                      {people.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePerson(i)}
                          className="btn btn--ghost btn--icon btn--sm"
                          style={{ color: "var(--color-muted)", flexShrink: 0 }}
                        >
                          <X style={{ width: "0.875rem", height: "0.875rem" }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPerson}
                  className="btn btn--sage btn--sm"
                  style={{ marginTop: "0.625rem", alignSelf: "flex-start" }}
                >
                  <Plus style={{ width: "0.875rem", height: "0.875rem" }} />
                  Add person
                </button>
              </div>

              <button type="submit" disabled={submitting} className="btn btn--honey btn--full">
                {submitting
                  ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                  : <SplitSquareVertical style={{ width: "1rem", height: "1rem" }} />
                }
                {submitting ? "Adding…" : "Add split"}
              </button>
            </form>
          </div>
        </div>

        {/* ── Splits list ── */}
        <div className="card animate-fade-up delay-150">
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "2rem", height: "2rem", borderRadius: "0.625rem",
                background: "var(--lavender-100)", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "inset 0 0 0 1px var(--lavender-200)", flexShrink: 0,
              }}>
                <Users style={{ width: "1rem", height: "1rem", color: "var(--lavender-600)" }} />
              </div>
              <h2 className="card-title">Your splits</h2>
            </div>
            {splits.length > 0 && (
              <span className="badge badge--lavender">{splits.length}</span>
            )}
          </div>
          <div className="card-body">
            {isLoading ? (
              <div className="loading-center" style={{ padding: "3rem 0" }}>
                <Loader2 className="spinner" style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
            ) : splits.length === 0 ? (
              <div className="empty-state">
                <div style={{
                  width: "3.5rem", height: "3.5rem", borderRadius: "1rem",
                  background: "var(--lavender-100)", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px var(--lavender-200)",
                }}>
                  <SplitSquareVertical style={{ width: "1.5rem", height: "1.5rem", color: "var(--lavender-500)" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-fg)" }}>No splits yet</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>
                    Add an expense above to start tracking who owes what.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {/* Unsettled first */}
                {[...unsettled, ...settled].map((split, i) => (
                  <SplitRow
                    key={split.id}
                    split={split}
                    settlingId={settlingId}
                    deletingId={deletingId}
                    onSettle={handleSettle}
                    onDelete={handleDelete}
                    isLast={i === splits.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

function SplitRow({
  split,
  settlingId,
  deletingId,
  onSettle,
  onDelete,
  isLast,
}: {
  split: SplitExpense;
  settlingId: string | null;
  deletingId: string | null;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
  isLast: boolean;
}) {
  return (
    <div style={{
      borderRadius: "0.875rem",
      border: "1px solid var(--cream-200)",
      background: split.settled ? "rgba(239,246,240,0.5)" : "white",
      padding: "0.875rem 1rem",
      opacity: split.settled ? 0.6 : 1,
      transition: "opacity 0.2s",
    }}>
      {/* Top row: name + total + settled icon */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
        <div style={{
          width: "2rem", height: "2rem", borderRadius: "0.625rem", flexShrink: 0,
          background: split.settled ? "var(--sage-100)" : "var(--lavender-100)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `inset 0 0 0 1px ${split.settled ? "var(--sage-200)" : "var(--lavender-200)"}`,
        }}>
          {split.settled
            ? <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "var(--sage-600)" }} />
            : <SplitSquareVertical style={{ width: "1rem", height: "1rem", color: "var(--lavender-600)" }} />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-fg)" }}>{split.name}</p>
            {split.settled && <span className="badge badge--sage">Settled</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
              {split.paidBy === "me" ? "You paid" : `${split.paidBy} paid`}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>·</span>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", fontVariantNumeric: "tabular-nums", color: "var(--color-fg)" }}>
              ${split.total.toFixed(2)} total
            </span>
          </div>
        </div>

        {/* Your share chip */}
        <div style={{
          borderRadius: "0.625rem", padding: "0.25rem 0.625rem", flexShrink: 0,
          background: split.paidBy === "me" ? "var(--honey-50)" : "var(--blush-50)",
          boxShadow: `inset 0 0 0 1px ${split.paidBy === "me" ? "var(--honey-200)" : "var(--blush-200)"}`,
        }}>
          <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-muted)" }}>
            {split.paidBy === "me" ? "Your share" : "You owe"}
          </p>
          <p style={{ fontWeight: 800, fontSize: "0.9375rem", fontVariantNumeric: "tabular-nums", color: split.paidBy === "me" ? "var(--honey-800)" : "var(--blush-700)" }}>
            ${split.yourShare.toFixed(2)}
          </p>
        </div>
      </div>

      {/* People list */}
      {split.people.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {split.people.map((person, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.25rem 0",
              borderTop: i === 0 ? "1px solid var(--cream-200)" : "none",
              paddingTop: i === 0 ? "0.625rem" : "0.25rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {person.settled
                  ? <CheckCircle2 style={{ width: "0.875rem", height: "0.875rem", color: "var(--sage-500)", flexShrink: 0 }} />
                  : <Circle style={{ width: "0.875rem", height: "0.875rem", color: "var(--cream-400)", flexShrink: 0 }} />
                }
                <span style={{
                  fontSize: "0.875rem",
                  color: person.settled ? "var(--color-muted)" : "var(--color-fg)",
                  textDecoration: person.settled ? "line-through" : "none",
                }}>
                  {person.name}
                </span>
              </div>
              <span style={{
                fontSize: "0.875rem", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                color: person.settled ? "var(--color-muted)" : "var(--color-fg)",
              }}>
                ${person.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.875rem", paddingTop: "0.75rem", borderTop: "1px solid var(--cream-200)" }}>
        {!split.settled ? (
          <button
            onClick={() => onSettle(split.id)}
            disabled={settlingId === split.id}
            className="btn btn--sage btn--sm"
          >
            {settlingId === split.id
              ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
              : <Check style={{ width: "0.875rem", height: "0.875rem" }} />
            }
            Mark settled
          </button>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            fontSize: "0.8125rem", fontWeight: 600, color: "var(--sage-600)",
            padding: "0.25rem 0",
          }}>
            <CheckCircle2 style={{ width: "0.875rem", height: "0.875rem" }} />
            Settled
          </span>
        )}
        <button
          onClick={() => onDelete(split.id)}
          disabled={deletingId === split.id}
          className="btn btn--ghost btn--sm"
          style={{ marginLeft: "auto", color: "var(--color-muted)" }}
        >
          {deletingId === split.id
            ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
            : <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
          }
        </button>
      </div>
    </div>
  );
}
