"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Plus, Trash2, CheckCircle2, Circle, Sparkles, Receipt, X, ChevronDown, ChevronUp } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number | null;
  status: string;
}

interface AISuggestion {
  name: string;
  quantity: number;
  estimatedPrice: number;
}

export default function GroceriesPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [budget, setBudget] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Add item
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [addingItem, setAddingItem] = useState(false);

  // AI prompt
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());
  const [aiAdding, setAiAdding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Receipt
  const [receiptStore, setReceiptStore] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptLogging, setReceiptLogging] = useState(false);
  const [showPurchased, setShowPurchased] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/groceries/cart");
    const data = await res.json();
    if (res.ok) setItems(data.items ?? []);
  }, []);

  const fetchBudget = useCallback(async () => {
    const res = await fetch("/api/budget");
    const data = await res.json();
    if (res.ok) setBudget(data.groceryBudget ?? 0);
  }, []);

  useEffect(() => {
    Promise.all([fetchItems(), fetchBudget()]).finally(() => setIsLoading(false));
  }, [fetchItems, fetchBudget]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingItem(true);
    await fetch("/api/groceries/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        quantity: parseInt(newQty) || 1,
        estimatedPrice: newPrice ? parseFloat(newPrice) : undefined,
      }),
    });
    setNewName(""); setNewPrice(""); setNewQty("1");
    await fetchItems();
    setAddingItem(false);
    nameRef.current?.focus();
  }

  async function handleCheck(item: GroceryItem) {
    const newStatus = item.status === "planned" ? "purchased" : "planned";
    const res = await fetch("/api/groceries/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: newStatus }),
    });
    if (res.ok) {
      const json = await res.json();
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...json.item } : i)));
    }
  }

  async function handleDelete(id: string) {
    await fetch("/api/groceries/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiSuggestions([]);
    setAiSelected(new Set());
    try {
      const res = await fetch("/api/groceries/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAiSuggestions(data.suggestions ?? []);
      setAiSelected(new Set(data.suggestions.map((_: AISuggestion, i: number) => i)));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAIAdd() {
    const toAdd = aiSuggestions.filter((_, i) => aiSelected.has(i));
    if (!toAdd.length) return;
    setAiAdding(true);
    for (const item of toAdd) {
      await fetch("/api/groceries/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
    await fetchItems();
    setAiSuggestions([]);
    setAiPrompt("");
    setAiAdding(false);
  }

  function toggleAI(i: number) {
    setAiSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  async function handleReceipt(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(receiptAmount);
    if (!amount || amount <= 0) return;
    setReceiptLogging(true);
    const storeName = receiptStore.trim() || "Store";
    await fetch("/api/groceries/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Receipt: ${storeName}`,
        quantity: 1,
        estimatedPrice: amount,
        status: "purchased",
      }),
    });
    setReceiptStore(""); setReceiptAmount("");
    await fetchItems();
    setReceiptLogging(false);
  }

  const planned   = items.filter((i) => i.status === "planned");
  const purchased = items.filter((i) => i.status === "purchased");
  const totalPlanned   = planned.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);
  const totalPurchased = purchased.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);
  const remaining = budget > 0 ? Math.max(0, budget - totalPurchased) : null;
  const isOver    = budget > 0 && totalPurchased > budget;
  const aiTotal   = aiSuggestions.filter((_, i) => aiSelected.has(i)).reduce((s, x) => s + x.estimatedPrice * x.quantity, 0);

  if (isLoading) {
    return (
      <div className="app-layout">
        <Navbar />
        <div className="loading-center">
          <div className="loading-col">
            <Loader2 style={{ width: "2rem", height: "2rem", color: "var(--honey-400)", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container">

        {/* Header */}
        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Grocery Planner</p>
          <h1 className="page-title">Grocery List</h1>
          {budget > 0 && (
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
                Budget: <strong style={{ color: "var(--color-fg)" }}>${budget.toFixed(0)}</strong>
              </span>
              <span style={{ fontSize: "0.875rem", color: isOver ? "var(--blush-700)" : "var(--sage-700)", fontWeight: 600 }}>
                {isOver
                  ? `$${(totalPurchased - budget).toFixed(2)} over`
                  : `$${remaining?.toFixed(2)} remaining`}
              </span>
            </div>
          )}
        </div>

        {/* AI Prompt */}
        <div className="card animate-fade-up delay-50">
          <div className="card-header">
            <span className="icon-pill icon-pill--sage icon-pill--sm" style={{ marginRight: "0.5rem" }}>
              <Sparkles style={{ width: "1rem", height: "1rem" }} />
            </span>
            <h3 className="card-title" style={{ display: "inline" }}>AI Grocery Builder</h3>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {aiSuggestions.length === 0 ? (
              <>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder='e.g. "Build a grocery list for a family of 5 with 3 small children, keep it under $150 at Food Lion"'
                  rows={3}
                  className="form-input"
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                  disabled={aiLoading}
                />
                {aiError && <div role="alert" className="alert alert--error">{aiError}</div>}
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="btn btn--sage"
                  style={{ gap: "0.5rem", alignSelf: "flex-start" }}
                >
                  {aiLoading
                    ? <><Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> Generating…</>
                    : <><Sparkles style={{ width: "1rem", height: "1rem" }} /> Generate list</>
                  }
                </button>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                    {aiSelected.size} of {aiSuggestions.length} selected · est. ${aiTotal.toFixed(2)}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" onClick={() => setAiSelected(aiSelected.size === aiSuggestions.length ? new Set() : new Set(aiSuggestions.map((_, i) => i)))} style={{ fontSize: "0.75rem", color: "var(--sage-700)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      {aiSelected.size === aiSuggestions.length ? "Deselect all" : "Select all"}
                    </button>
                    <button type="button" onClick={() => { setAiSuggestions([]); setAiPrompt(""); }} style={{ fontSize: "0.75rem", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer" }}>
                      <X style={{ width: "0.875rem", height: "0.875rem" }} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "16rem", overflowY: "auto" }}>
                  {aiSuggestions.map((item, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.625rem", borderRadius: "0.625rem", cursor: "pointer", border: "1px solid", borderColor: aiSelected.has(i) ? "var(--sage-300)" : "var(--cream-200)", background: aiSelected.has(i) ? "var(--sage-50)" : "white" }}>
                      <input type="checkbox" checked={aiSelected.has(i)} onChange={() => toggleAI(i)} style={{ accentColor: "var(--sage-600)", width: "1rem", height: "1rem", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500 }}>{item.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>×{item.quantity}</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--sage-700)" }}>${(item.estimatedPrice * item.quantity).toFixed(2)}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAIAdd}
                  disabled={aiSelected.size === 0 || aiAdding}
                  className="btn btn--sage"
                  style={{ gap: "0.5rem", alignSelf: "flex-start" }}
                >
                  {aiAdding
                    ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                    : <Plus style={{ width: "1rem", height: "1rem" }} />
                  }
                  Add {aiSelected.size} item{aiSelected.size !== 1 ? "s" : ""} to list
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick add */}
        <div className="card animate-fade-up delay-100">
          <div className="card-header">
            <h3 className="card-title">Add item</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddItem} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                ref={nameRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Item name"
                className="form-input"
                style={{ flex: "1 1 140px", minWidth: 0 }}
                required
              />
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Qty"
                className="form-input"
                style={{ width: "4.5rem", flexShrink: 0 }}
                min={1}
              />
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Price"
                className="form-input"
                style={{ width: "5.5rem", flexShrink: 0 }}
                step="0.01"
                min={0}
              />
              <button type="submit" disabled={addingItem || !newName.trim()} className="btn btn--honey" style={{ gap: "0.375rem", flexShrink: 0 }}>
                {addingItem
                  ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                  : <Plus style={{ width: "1rem", height: "1rem" }} />
                }
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Shopping list */}
        <div className="card animate-fade-up delay-150">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="card-title">Shopping list</h3>
            {planned.length > 0 && (
              <span style={{ fontSize: "0.8125rem", color: "var(--color-muted)" }}>
                est. ${totalPlanned.toFixed(2)}
              </span>
            )}
          </div>
          <div className="card-body">
            {planned.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", textAlign: "center", padding: "1.5rem 0" }}>
                No items yet — use AI or add manually above.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {planned.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem 0",
                      borderBottom: idx < planned.length - 1 ? "1px solid var(--cream-200)" : "none",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCheck(item)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sage-500)", flexShrink: 0, padding: 0, display: "flex" }}
                      aria-label={`Mark ${item.name} as purchased`}
                    >
                      <Circle style={{ width: "1.375rem", height: "1.375rem" }} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-fg)" }}>{item.name}</p>
                      {item.quantity > 1 && (
                        <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>qty {item.quantity}</p>
                      )}
                    </div>
                    {item.estimatedPrice != null && (
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-fg)", whiteSpace: "nowrap" }}>
                        ${(item.estimatedPrice * item.quantity).toFixed(2)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", flexShrink: 0, padding: 0, display: "flex" }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 style={{ width: "1rem", height: "1rem" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Log a receipt */}
        <div className="card animate-fade-up delay-200">
          <div className="card-header">
            <span className="icon-pill icon-pill--honey icon-pill--sm" style={{ marginRight: "0.5rem" }}>
              <Receipt style={{ width: "1rem", height: "1rem" }} />
            </span>
            <h3 className="card-title" style={{ display: "inline" }}>Log a receipt</h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "0.75rem" }}>
              Already shopped? Log your total to track it against your grocery budget.
            </p>
            <form onSubmit={handleReceipt} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input
                type="text"
                value={receiptStore}
                onChange={(e) => setReceiptStore(e.target.value)}
                placeholder="Store name (optional)"
                className="form-input"
                style={{ flex: "1 1 140px", minWidth: 0 }}
              />
              <div className="form-input-wrap" style={{ width: "8rem", flexShrink: 0 }}>
                <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-muted)", fontSize: "0.9375rem", pointerEvents: "none" }}>$</span>
                <input
                  type="number"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  placeholder="0.00"
                  className="form-input form-input--icon-left"
                  step="0.01"
                  min={0}
                  required
                />
              </div>
              <button type="submit" disabled={receiptLogging || !receiptAmount} className="btn btn--honey" style={{ gap: "0.375rem", flexShrink: 0 }}>
                {receiptLogging
                  ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                  : <Plus style={{ width: "1rem", height: "1rem" }} />
                }
                Log
              </button>
            </form>
          </div>
        </div>

        {/* Purchased / logged */}
        {purchased.length > 0 && (
          <div className="card animate-fade-up delay-250" style={{ opacity: 0.85 }}>
            <button
              type="button"
              className="card-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              onClick={() => setShowPurchased((v) => !v)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "var(--sage-600)" }} />
                <h3 className="card-title" style={{ color: "var(--color-muted)" }}>Purchased / logged</h3>
                <span className="badge badge--sage">{purchased.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--sage-700)" }}>${totalPurchased.toFixed(2)}</span>
                {showPurchased ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} /> : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />}
              </div>
            </button>

            {showPurchased && (
              <div className="card-body">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {purchased.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.625rem 0",
                        borderBottom: idx < purchased.length - 1 ? "1px solid var(--cream-200)" : "none",
                        opacity: 0.75,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleCheck(item)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sage-500)", flexShrink: 0, padding: 0, display: "flex" }}
                        aria-label={`Unmark ${item.name}`}
                      >
                        <CheckCircle2 style={{ width: "1.375rem", height: "1.375rem" }} />
                      </button>
                      <p style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500, textDecoration: "line-through", color: "var(--color-muted)" }}>{item.name}</p>
                      {item.estimatedPrice != null && (
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-muted)" }}>
                          ${(item.estimatedPrice * item.quantity).toFixed(2)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", flexShrink: 0, padding: 0, display: "flex" }}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 style={{ width: "1rem", height: "1rem" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
