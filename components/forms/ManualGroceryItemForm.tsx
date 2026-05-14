"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    if (price !== undefined && (isNaN(price) || price < 0)) {
      setError("Please enter a valid price.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/groceries/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          quantity: qty,
          estimatedPrice: price ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add item");
      setName("");
      setQuantity("1");
      setEstimatedPrice("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="grocery-name">Item name</Label>
          <Input
            id="grocery-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Almond milk"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grocery-qty">Quantity</Label>
          <Input
            id="grocery-qty"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="grocery-price">Est. price ($)</Label>
          <Input
            id="grocery-price"
            type="number"
            min="0"
            step="0.01"
            value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {error && <p className="text-sm text-blush-600">{error}</p>}

      <Button type="submit" disabled={isLoading} variant="lavender" className="gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add to List
      </Button>
    </form>
  );
}
