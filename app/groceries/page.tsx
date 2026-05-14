"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { GrocerySearch } from "@/components/groceries/GrocerySearch";
import { GroceryList } from "@/components/groceries/GroceryList";
import { GroceryCart } from "@/components/groceries/GroceryCart";
import { WalmartExportButton } from "@/components/groceries/WalmartExportButton";
import { ManualGroceryItemForm } from "@/components/forms/ManualGroceryItemForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number | null;
  status: string;
}

export default function GroceriesPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [budget, setBudget] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/groceries/cart");
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
    } catch {
      setError("Failed to load grocery list.");
    }
  }, []);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/budget");
      const data = await res.json();
      if (res.ok) setBudget(data.groceryBudget ?? 0);
    } catch {
      // budget not critical
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchItems(), fetchBudget()]).finally(() => setIsLoading(false));
  }, [fetchItems, fetchBudget]);

  async function handleAddItem(item: {
    name: string;
    quantity: number;
    estimatedPrice: number;
  }) {
    const res = await fetch("/api/groceries/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (res.ok) await fetchItems();
  }

  async function handleUpdate(id: string, data: { status?: string; quantity?: number }) {
    const res = await fetch("/api/groceries/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (res.ok) {
      const json = await res.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...json.item } : item))
      );
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/groceries/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const plannedItems = items.filter((i) => i.status === "planned");
  const purchasedItems = items.filter((i) => i.status === "purchased");

  const totalEstimated = items.reduce(
    (sum, i) => sum + (i.estimatedPrice ?? 0) * i.quantity,
    0
  );
  const remaining = Math.max(0, budget - totalEstimated);
  const isOver = totalEstimated > budget && budget > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-blush-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Grocery List
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Build your list, track your budget, export to Walmart.
            </p>
          </div>
          <div className="hidden sm:block">
            <WalmartExportButton />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Main column */}
          <div className="space-y-4">
            {/* Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Search items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GrocerySearch onAddItem={handleAddItem} />
              </CardContent>
            </Card>

            {/* Manual add */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Add manually
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ManualGroceryItemForm onSuccess={fetchItems} />
              </CardContent>
            </Card>

            {/* Planned list */}
            {plannedItems.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    <span>To buy · {plannedItems.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GroceryList
                    items={plannedItems}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-300 bg-white/50 py-12 text-center">
                <span className="text-4xl mb-3">🛒</span>
                <p className="font-medium text-foreground">Your list is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search above or add items manually.
                </p>
              </div>
            )}

            {/* Purchased */}
            {purchasedItems.length > 0 && (
              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">
                    In cart · {purchasedItems.length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GroceryList
                    items={purchasedItems}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mobile export button */}
            <div className="sm:hidden">
              <WalmartExportButton />
            </div>
          </div>

          {/* Sidebar – hidden on mobile (see floating pill below) */}
          <div className="hidden lg:block space-y-4">
            <GroceryCart items={items} budget={budget} />
          </div>
        </div>
      </main>

      {/* Mobile floating cart summary pill */}
      {items.length > 0 && (
        <div className="fixed bottom-[calc(56px+env(safe-area-inset-bottom)+8px)] left-1/2 -translate-x-1/2 z-40 lg:hidden">
          <div
            className={[
              "flex items-center gap-3 rounded-full px-5 py-3 shadow-lg ring-1 text-sm font-medium backdrop-blur-sm",
              isOver
                ? "bg-blush-500/90 text-white ring-blush-400"
                : "bg-white/90 text-foreground ring-cream-200",
            ].join(" ")}
          >
            <ShoppingBag className="h-4 w-4 flex-shrink-0" />
            <span>
              {items.reduce((s, i) => s + i.quantity, 0)} items ·{" "}
              <span className={isOver ? "font-bold" : "font-bold text-sage-700"}>
                {isOver
                  ? `-$${(totalEstimated - budget).toFixed(0)} over`
                  : `$${remaining.toFixed(0)} left`}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
