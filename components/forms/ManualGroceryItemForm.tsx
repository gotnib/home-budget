"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface ManualGroceryItemFormProps {
  onSuccess: () => void;
}

export function ManualGroceryItemForm({ onSuccess }: ManualGroceryItemFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Please enter an item name."); return; }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) { setError("Quantity must be at least 1."); return; }
    const price = estimatedPrice ? parseFloat(estimatedPrice) : undefined;
    if (price !== undefined && (isNaN(price) || price < 0)) { setError("Please enter a valid price."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/groceries/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), quantity: qty, estimatedPrice: price ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add item");
      setName(""); setQuantity("1"); setEstimatedPrice("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="form-grid-3">
        <div className="form-field">
          <label className="form-label" htmlFor="grocery-name">Item name</label>
          <input id="grocery-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Almond milk" required />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="grocery-qty">Quantity</label>
          <input id="grocery-qty" className="form-input" type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="grocery-price">Est. price ($)</label>
          <input id="grocery-price" className="form-input" type="number" min="0" step="0.01" value={estimatedPrice} onChange={(e) => setEstimatedPrice(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      {error && <p style={{ fontSize: "0.875rem", color: "var(--blush-600)" }}>{error}</p>}

      <button type="submit" disabled={isLoading} className="btn btn--lavender" style={{ alignSelf: "flex-start" }}>
        {isLoading ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: "1rem", height: "1rem" }} />}
        Add to List
      </button>
    </form>
  );
}
