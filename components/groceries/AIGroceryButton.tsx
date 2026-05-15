"use client";

import { useState } from "react";
import { Loader2, Sparkles, Plus, X } from "lucide-react";

interface Suggestion {
  name: string;
  quantity: number;
  estimatedPrice: number;
}

interface AIGroceryButtonProps {
  onAddItems: (items: { name: string; quantity: number; estimatedPrice: number }[]) => Promise<void>;
}

export function AIGroceryButton({ onAddItems }: AIGroceryButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSelected(new Set());
    setOpen(true);
    try {
      const res = await fetch("/api/groceries/ai-generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate");
      setSuggestions(data.suggestions ?? []);
      setSelected(new Set(data.suggestions.map((_: Suggestion, i: number) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleAddSelected() {
    const toAdd = suggestions.filter((_, i) => selected.has(i));
    if (toAdd.length === 0) return;
    setAdding(true);
    try {
      await onAddItems(toAdd);
      setOpen(false);
      setSuggestions([]);
    } catch {
      setError("Failed to add items");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        className="btn btn--sage"
        style={{ gap: "0.5rem", fontSize: "0.875rem" }}
        disabled={loading}
      >
        {loading
          ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
          : <Sparkles style={{ width: "1rem", height: "1rem" }} />
        }
        AI Suggest
      </button>

      {open && (
        <div className="ai-modal-backdrop" onClick={() => !loading && !adding && setOpen(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span className="icon-pill icon-pill--sage icon-pill--sm">
                  <Sparkles style={{ width: "1rem", height: "1rem" }} />
                </span>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-fg)" }}>AI Grocery Suggestions</h3>
                  {!loading && suggestions.length > 0 && (
                    <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                      Select items to add to your list
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}
                aria-label="Close"
              >
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>

            <div className="ai-modal-body">
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2rem 0", color: "var(--color-muted)" }}>
                  <Loader2 style={{ width: "2rem", height: "2rem", color: "var(--sage-500)", animation: "spin 1s linear infinite" }} />
                  <p style={{ fontSize: "0.875rem" }}>Generating suggestions…</p>
                </div>
              )}

              {error && (
                <div role="alert" className="alert alert--error">{error}</div>
              )}

              {!loading && suggestions.length > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{selected.size} of {suggestions.length} selected</span>
                    <button
                      type="button"
                      onClick={() => setSelected(selected.size === suggestions.length ? new Set() : new Set(suggestions.map((_, i) => i)))}
                      style={{ fontSize: "0.75rem", color: "var(--sage-700)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      {selected.size === suggestions.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {suggestions.map((item, i) => (
                      <label
                        key={i}
                        className={`ai-suggestion-row${selected.has(i) ? " selected" : ""}`}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "0.75rem", cursor: "pointer", border: "1px solid", borderColor: selected.has(i) ? "var(--sage-300)" : "var(--cream-200)", background: selected.has(i) ? "var(--sage-50)" : "white", transition: "all 0.15s" }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(i)}
                          onChange={() => toggleItem(i)}
                          style={{ accentColor: "var(--sage-600)", width: "1rem", height: "1rem", flexShrink: 0 }}
                        />
                        <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600, color: "var(--color-fg)" }}>{item.name}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>×{item.quantity}</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--sage-700)" }}>${item.estimatedPrice.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {!loading && suggestions.length > 0 && (
              <div className="ai-modal-footer">
                <button type="button" onClick={() => setOpen(false)} className="btn btn--outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSelected}
                  disabled={selected.size === 0 || adding}
                  className="btn btn--sage"
                  style={{ flex: 1, gap: "0.5rem" }}
                >
                  {adding
                    ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                    : <Plus style={{ width: "1rem", height: "1rem" }} />
                  }
                  Add {selected.size} item{selected.size !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
