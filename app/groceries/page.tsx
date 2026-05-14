"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
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

interface BudgetData {
  groceryBudget: number;
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
      const data: BudgetData = await res.json();
      if (res.ok) setBudget(data.groceryBudget ?? 0);
    } catch {
      // budget not critical
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchItems(), fetchBudget()]).finally(() =>
      setIsLoading(false)
    );
  }, [fetchItems, fetchBudget]);

  async function handleAddItem(item: {
    name: string;
    quantity: number;
    estimatedPrice: number;
  }) {
    try {
      const res = await fetch("/api/groceries/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (res.ok) await fetchItems();
    } catch {
      setError("Failed to add item.");
    }
  }

  async function handleUpdate(
    id: string,
    data: { status?: string; quantity?: number }
  ) {
    try {
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
    } catch {
      setError("Failed to update item.");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/groceries/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Failed to remove item.");
    }
  }

  const plannedItems = items.filter((i) => i.status === "planned");
  const purchasedItems = items.filter((i) => i.status === "purchased");

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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Grocery List</h1>
            <p className="mt-1 text-muted-foreground">
              Build your list, track your budget, and export to Walmart.
            </p>
          </div>
          <WalmartExportButton />
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main column */}
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Search items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GrocerySearch onAddItem={handleAddItem} />
              </CardContent>
            </Card>

            {/* Manual add */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Add item manually
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ManualGroceryItemForm onSuccess={fetchItems} />
              </CardContent>
            </Card>

            {/* Planned list */}
            {plannedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>To buy ({plannedItems.length})</span>
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
            )}

            {/* Empty state */}
            {plannedItems.length === 0 && (
              <GroceryList
                items={[]}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            )}

            {/* Purchased items */}
            {purchasedItems.length > 0 && (
              <Card className="opacity-80">
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">
                    In cart ({purchasedItems.length})
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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <GroceryCart items={items} budget={budget} />
          </div>
        </div>
      </main>
    </div>
  );
}
