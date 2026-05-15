"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { GrocerySearch } from "@/components/groceries/GrocerySearch";
import { GroceryList } from "@/components/groceries/GroceryList";
import { GroceryCart } from "@/components/groceries/GroceryCart";
import { WalmartExportButton } from "@/components/groceries/WalmartExportButton";
import { ManualGroceryItemForm } from "@/components/forms/ManualGroceryItemForm";
import { AIGroceryButton } from "@/components/groceries/AIGroceryButton";

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

  async function handleAddItem(item: { name: string; quantity: number; estimatedPrice: number }) {
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
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...json.item } : item)));
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

  const plannedItems   = items.filter((i) => i.status === "planned");
  const purchasedItems = items.filter((i) => i.status === "purchased");
  const totalEstimated = items.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);
  const remaining      = Math.max(0, budget - totalEstimated);
  const isOver         = totalEstimated > budget && budget > 0;

  if (isLoading) {
    return (
      <div className="app-layout">
        <Navbar />
        <div className="loading-center">
          <div className="loading-col">
            <Loader2 style={{ width: "2rem", height: "2rem", color: "var(--honey-400)", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Loading your list…</p>
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }} className="animate-fade-up">
          <div>
            <p className="section-label" style={{ marginBottom: "0.25rem" }}>Grocery Planner</p>
            <h1 className="page-title">Grocery List</h1>
            <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>Build your list, track your budget, export to Walmart.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <AIGroceryButton onAddItems={async (items) => { for (const item of items) await handleAddItem(item); }} />
            <div style={{ display: "none" }} className="animate-fade-in delay-200" id="walmart-desktop">
              <WalmartExportButton />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem" }} id="groceries-layout">
          {/* Main column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            <div className="card animate-fade-up delay-100">
              <div className="card-header">
                <h3 className="card-title">🔍 Search items</h3>
              </div>
              <div className="card-body">
                <GrocerySearch onAddItem={handleAddItem} />
              </div>
            </div>

            <div className="card animate-fade-up delay-150">
              <div className="card-header">
                <h3 className="card-title">✏️ Add manually</h3>
              </div>
              <div className="card-body">
                <ManualGroceryItemForm onSuccess={fetchItems} />
              </div>
            </div>

            {plannedItems.length > 0 ? (
              <div className="card animate-fade-up delay-200">
                <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 className="card-title">To buy</h3>
                  <span className="badge badge--honey">{plannedItems.length}</span>
                </div>
                <div className="card-body">
                  <GroceryList items={plannedItems} onUpdate={handleUpdate} onDelete={handleDelete} />
                </div>
              </div>
            ) : (
              <div className="empty-state animate-fade-up delay-200">
                <span style={{ fontSize: "3rem" }}>🛒</span>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--color-fg)" }}>Your list is empty</p>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>Search above or add items manually.</p>
                </div>
              </div>
            )}

            {purchasedItems.length > 0 && (
              <div className="card animate-fade-up delay-250" style={{ opacity: 0.75 }}>
                <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 className="card-title" style={{ color: "var(--color-muted)" }}>In cart</h3>
                  <span className="badge badge--sage">{purchasedItems.length}</span>
                </div>
                <div className="card-body">
                  <GroceryList items={purchasedItems} onUpdate={handleUpdate} onDelete={handleDelete} />
                </div>
              </div>
            )}

            {/* Mobile export */}
            <div className="animate-fade-up delay-300" style={{ display: "block" }} id="walmart-mobile">
              <WalmartExportButton />
            </div>
          </div>

          {/* Desktop sidebar — hidden on mobile via CSS */}
          <div style={{ display: "none" }} id="groceries-sidebar">
            <GroceryCart items={items} budget={budget} />
          </div>
        </div>
      </main>

      {/* Floating cart pill (mobile) */}
      {items.length > 0 && (
        <div className={`floating-cart${isOver ? " floating-cart--over" : " floating-cart--ok"}`} style={{ display: "flex" }} id="floating-cart">
          <ShoppingBag style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
          <span>
            {items.reduce((s, i) => s + i.quantity, 0)} items ·{" "}
            <span className={isOver ? "floating-cart-amount--over" : "floating-cart-amount--ok"}>
              {isOver ? `-$${(totalEstimated - budget).toFixed(0)} over` : `$${remaining.toFixed(0)} left`}
            </span>
          </span>
        </div>
      )}

      <style>{`
        @media (min-width: 640px) {
          #walmart-desktop { display: block !important; }
          #walmart-mobile  { display: none !important; }
        }
        @media (min-width: 1024px) {
          #groceries-layout { grid-template-columns: 1fr 280px; }
          #groceries-sidebar { display: flex !important; flex-direction: column; gap: 1rem; }
          #floating-cart { display: none !important; }
        }
      `}</style>
    </div>
  );
}
