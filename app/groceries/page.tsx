"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2, Plus, Trash2, CheckCircle2, Circle,
  Sparkles, Receipt, ChevronDown, ChevronUp,
  Users, Baby, Calendar, ArrowRight, RotateCcw,
  UtensilsCrossed, Store, DollarSign, Bookmark, X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import type { MealPlan, MealWeek } from "@/app/api/groceries/meal-plan/route";

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

interface SavedList {
  id: string;
  name: string;
  store: string;
  createdAt: string;
  items: AISuggestion[];
}

type AIStep = "configure" | "loading-plan" | "meal-plan" | "loading-list" | "list";

const DURATION_OPTIONS = [
  { label: "1 Week",  weeks: 1 },
  { label: "2 Weeks", weeks: 2 },
  { label: "3 Weeks", weeks: 3 },
  { label: "1 Month", weeks: 4 },
];

function Counter({ value, onChange, min = 0, max = 10 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        style={{ width: "2rem", height: "2rem", borderRadius: "0.625rem", border: "1px solid var(--cream-300)", background: "white", fontWeight: 700, fontSize: "1.125rem", cursor: value <= min ? "default" : "pointer", color: value <= min ? "var(--cream-300)" : "var(--color-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >−</button>
      <span style={{ fontWeight: 700, fontSize: "1.125rem", minWidth: "1.5rem", textAlign: "center" }}>{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        style={{ width: "2rem", height: "2rem", borderRadius: "0.625rem", border: "1px solid var(--cream-300)", background: "white", fontWeight: 700, fontSize: "1.125rem", cursor: value >= max ? "default" : "pointer", color: value >= max ? "var(--cream-300)" : "var(--color-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >+</button>
    </div>
  );
}

function MealWeekCard({ week }: { week: MealWeek }) {
  const [open, setOpen] = useState(week.week === 1);
  return (
    <div style={{ border: "1px solid var(--cream-200)", borderRadius: "0.875rem", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0.75rem 1rem", background: "var(--cream-100)", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-fg)" }}>Week {week.week}</span>
        {open
          ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />
          : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />
        }
      </button>
      {open && (
        <div>
          {week.days.map((day, i) => (
            <div key={day.day} style={{ padding: "0.625rem 1rem", borderTop: "1px solid var(--cream-200)", background: i % 2 === 0 ? "white" : "var(--honey-50)" }}>
              <p style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--honey-700)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>{day.day}</p>
              <div style={{ display: "grid", gap: "0.25rem" }}>
                {[["🌅", day.breakfast], ["☀️", day.lunch], ["🌙", day.dinner]].map(([emoji, meal]) => (
                  <p key={emoji} style={{ fontSize: "0.8125rem", color: "var(--color-fg)" }}>
                    <span style={{ marginRight: "0.375rem" }}>{emoji}</span>{meal}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LS_MEAL_PLAN  = "honey-meal-plan";
const LS_SAVED_LISTS = "honey-saved-lists";

export default function GroceriesPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [budget, setBudget] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Add item
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [addingItem, setAddingItem] = useState(false);

  // Honey flow
  const [aiStep, setAiStep] = useState<AIStep>("configure");
  const [aiWeeks, setAiWeeks] = useState(1);
  const [aiAdults, setAiAdults] = useState(2);
  const [aiKids, setAiKids] = useState(0);
  const [aiNotes, setAiNotes] = useState("");
  const [aiStore, setAiStore] = useState("");
  const [aiBudgetInput, setAiBudgetInput] = useState("");
  const [aiBudget, setAiBudget] = useState<number | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [aiSelected, setAiSelected] = useState<Set<number>>(new Set());
  const [aiAdding, setAiAdding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Saved meal plan & lists
  const [savedMealPlan, setSavedMealPlan] = useState<MealPlan | null>(null);
  const [savedMealPlanOpen, setSavedMealPlanOpen] = useState(false);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [savedListsOpen, setSavedListsOpen] = useState(false);
  const [loadingListId, setLoadingListId] = useState<string | null>(null);

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
    try {
      const raw = localStorage.getItem(LS_MEAL_PLAN);
      if (raw) setSavedMealPlan(JSON.parse(raw));
      const listsRaw = localStorage.getItem(LS_SAVED_LISTS);
      if (listsRaw) setSavedLists(JSON.parse(listsRaw));
    } catch { /* ignore */ }
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

  async function handleBuildMealPlan() {
    setAiError(null);
    setAiStep("loading-plan");
    try {
      const res = await fetch("/api/groceries/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks: aiWeeks, adults: aiAdults, kids: aiKids, notes: aiNotes, store: aiStore, budget: aiBudget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMealPlan(data.mealPlan);
      setAiStep("meal-plan");
      // Persist the meal plan
      try {
        localStorage.setItem(LS_MEAL_PLAN, JSON.stringify(data.mealPlan));
        setSavedMealPlan(data.mealPlan);
      } catch { /* ignore */ }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
      setAiStep("configure");
    }
  }

  async function handleBuildGroceryList() {
    if (!mealPlan) return;
    setAiError(null);
    setAiStep("loading-list");
    try {
      const res = await fetch("/api/groceries/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAiSuggestions(data.suggestions ?? []);
      setAiSelected(new Set(data.suggestions.map((_: AISuggestion, i: number) => i)));
      setAiStep("list");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
      setAiStep("meal-plan");
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
    // Auto-save this list for reuse
    try {
      const listName = [
        mealPlan ? `${mealPlan.totalDays} days` : null,
        mealPlan?.store || null,
        new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ].filter(Boolean).join(" · ");
      const newList: SavedList = {
        id: Date.now().toString(),
        name: listName,
        store: mealPlan?.store ?? "",
        createdAt: new Date().toISOString(),
        items: toAdd,
      };
      const updated = [newList, ...savedLists].slice(0, 10);
      setSavedLists(updated);
      localStorage.setItem(LS_SAVED_LISTS, JSON.stringify(updated));
    } catch { /* ignore */ }

    await fetchItems();
    setAiStep("configure");
    setMealPlan(null);
    setAiSuggestions([]);
    setAiNotes("");
    setAiStore("");
    setAiBudgetInput("");
    setAiBudget(null);
    setAiAdding(false);
  }

  function toggleAI(i: number) {
    setAiSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function removeSavedMealPlan() {
    try { localStorage.removeItem(LS_MEAL_PLAN); } catch { /* ignore */ }
    setSavedMealPlan(null);
  }

  function handleUseSavedMealPlan() {
    if (!savedMealPlan) return;
    setMealPlan(savedMealPlan);
    setAiStep("meal-plan");
    setSavedMealPlanOpen(false);
  }

  async function handleLoadSavedList(list: SavedList) {
    setLoadingListId(list.id);
    for (const item of list.items) {
      await fetch("/api/groceries/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
    await fetchItems();
    setLoadingListId(null);
  }

  function handleDeleteSavedList(id: string) {
    const updated = savedLists.filter((l) => l.id !== id);
    setSavedLists(updated);
    try { localStorage.setItem(LS_SAVED_LISTS, JSON.stringify(updated)); } catch { /* ignore */ }
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
      body: JSON.stringify({ name: `Receipt: ${storeName}`, quantity: 1, estimatedPrice: amount, status: "purchased" }),
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

  const isAILoading = aiStep === "loading-plan" || aiStep === "loading-list";

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
                {isOver ? `$${(totalPurchased - budget).toFixed(2)} over` : `$${remaining?.toFixed(2)} remaining`}
              </span>
            </div>
          )}
        </div>

        {/* ── Saved Meal Plan card ── */}
        {savedMealPlan && (
          <div className="card animate-fade-up" style={{ borderColor: "var(--honey-200)", background: "var(--honey-50)" }}>
            <button
              type="button"
              className="card-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              onClick={() => setSavedMealPlanOpen((v) => !v)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span className="icon-pill icon-pill--honey icon-pill--sm">
                  <UtensilsCrossed style={{ width: "1rem", height: "1rem" }} />
                </span>
                <div>
                  <h3 className="card-title">Saved meal plan</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                    {savedMealPlan.totalDays} days
                    {savedMealPlan.store ? ` · ${savedMealPlan.store}` : ""}
                    {savedMealPlan.budget ? ` · $${savedMealPlan.budget} budget` : ""}
                    {" · "}{savedMealPlan.adults} adult{savedMealPlan.adults > 1 ? "s" : ""}
                    {savedMealPlan.kids > 0 ? `, ${savedMealPlan.kids} kid${savedMealPlan.kids > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
              </div>
              {savedMealPlanOpen
                ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)", flexShrink: 0 }} />
                : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)", flexShrink: 0 }} />
              }
            </button>

            {savedMealPlanOpen && (
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {savedMealPlan.weeks.map((week) => (
                  <MealWeekCard key={week.week} week={week} />
                ))}
                <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.25rem" }}>
                  <button type="button" onClick={handleUseSavedMealPlan} className="btn btn--honey" style={{ flex: 1, gap: "0.5rem", fontSize: "0.875rem" }}>
                    <ArrowRight style={{ width: "0.875rem", height: "0.875rem" }} />
                    Build grocery list
                  </button>
                  <button type="button" onClick={removeSavedMealPlan} className="btn btn--ghost" style={{ gap: "0.5rem", fontSize: "0.875rem", color: "var(--blush-700)" }}>
                    <X style={{ width: "0.875rem", height: "0.875rem" }} />
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI Meal Planner ── */}
        <div className="card animate-fade-up delay-50">

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem 1.25rem 0" }}>
            {(["configure", "meal-plan", "list"] as const).map((s, i) => {
              const stepIndex = ["configure","loading-plan","meal-plan","loading-list","list"].indexOf(aiStep);
              const thisIndex = i * 2;
              const done = stepIndex > thisIndex;
              const active = stepIndex === thisIndex || (i === 1 && stepIndex === 3) || (i === 0 && stepIndex === 1);
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: i < 2 ? 1 : undefined }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <div style={{ width: "1.5rem", height: "1.5rem", borderRadius: "50%", background: done ? "var(--sage-500)" : active ? "var(--honey-500)" : "var(--cream-300)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: done || active ? "white" : "var(--color-muted)" }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: active ? "var(--color-fg)" : done ? "var(--sage-700)" : "var(--color-muted)", whiteSpace: "nowrap" }}>
                      {s === "configure" ? "Plan" : s === "meal-plan" ? "Meals" : "List"}
                    </span>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: "1px", background: done ? "var(--sage-300)" : "var(--cream-300)", margin: "0 0.25rem" }} />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Configure */}
          {(aiStep === "configure" || aiStep === "loading-plan") && (
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="icon-pill icon-pill--honey icon-pill--sm">
                  <Sparkles style={{ width: "1rem", height: "1rem" }} />
                </span>
                <div>
                  <h3 className="card-title" style={{ display: "inline" }}>Ask Honey 🍯</h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>Tell Honey about your household and she'll build a meal plan and grocery list.</p>
                </div>
              </div>

              {/* Duration */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  <Calendar style={{ width: "1rem", height: "1rem", color: "var(--honey-600)" }} />
                  <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-fg)" }}>How long?</label>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {DURATION_OPTIONS.map(({ label, weeks }) => (
                    <button
                      key={weeks}
                      type="button"
                      onClick={() => setAiWeeks(weeks)}
                      disabled={isAILoading}
                      style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", border: "1px solid", borderColor: aiWeeks === weeks ? "var(--honey-400)" : "var(--cream-300)", background: aiWeeks === weeks ? "var(--honey-100)" : "white", fontWeight: 700, fontSize: "0.875rem", color: aiWeeks === weeks ? "var(--honey-800)" : "var(--color-muted)", cursor: isAILoading ? "default" : "pointer", transition: "all 0.15s" }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adults */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users style={{ width: "1rem", height: "1rem", color: "var(--sage-600)" }} />
                  <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-fg)" }}>Adults</label>
                </div>
                <Counter value={aiAdults} onChange={setAiAdults} min={1} max={10} />
              </div>

              {/* Kids */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Baby style={{ width: "1rem", height: "1rem", color: "var(--blush-600)" }} />
                  <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-fg)" }}>Kids</label>
                </div>
                <Counter value={aiKids} onChange={setAiKids} min={0} max={10} />
              </div>

              {/* Store + Budget row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
                    <Store style={{ width: "0.875rem", height: "0.875rem", color: "var(--sage-600)" }} />
                    <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-fg)" }}>
                      Store <span style={{ fontWeight: 400, color: "var(--color-muted)" }}>(optional)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={aiStore}
                    onChange={(e) => setAiStore(e.target.value)}
                    placeholder="Food Lion, Walmart…"
                    className="form-input"
                    disabled={isAILoading}
                  />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
                    <DollarSign style={{ width: "0.875rem", height: "0.875rem", color: "var(--honey-600)" }} />
                    <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-fg)" }}>
                      Budget <span style={{ fontWeight: 400, color: "var(--color-muted)" }}>(optional)</span>
                    </label>
                  </div>
                  <div className="form-input-wrap">
                    <span style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-muted)", pointerEvents: "none" }}>$</span>
                    <input
                      type="number"
                      value={aiBudgetInput}
                      onChange={(e) => {
                        setAiBudgetInput(e.target.value);
                        const v = parseFloat(e.target.value);
                        setAiBudget(!isNaN(v) && v > 0 ? v : null);
                      }}
                      onBlur={() => {
                        if (aiBudget !== null) setAiBudgetInput(String(aiBudget));
                        else setAiBudgetInput("");
                      }}
                      placeholder="150"
                      className="form-input form-input--icon-left"
                      min={1}
                      step="1"
                      disabled={isAILoading}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-fg)", display: "block", marginBottom: "0.5rem" }}>
                  Dietary notes <span style={{ fontWeight: 400, color: "var(--color-muted)" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  placeholder='e.g. "no pork, nut allergy, prefer Mediterranean"'
                  className="form-input"
                  disabled={isAILoading}
                />
              </div>

              {aiError && <div role="alert" className="alert alert--error">{aiError}</div>}

              <button
                type="button"
                onClick={handleBuildMealPlan}
                disabled={isAILoading}
                className="btn btn--honey"
                style={{ gap: "0.5rem" }}
              >
                {aiStep === "loading-plan"
                  ? <><Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> Honey is planning…</>
                  : <><UtensilsCrossed style={{ width: "1rem", height: "1rem" }} /> Build meal plan</>
                }
              </button>
            </div>
          )}

          {/* Step 2: Meal Plan */}
          {(aiStep === "meal-plan" || aiStep === "loading-list") && mealPlan && (
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 className="card-title">Your meal plan</h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                    {mealPlan.totalDays} days · {mealPlan.adults} adult{mealPlan.adults > 1 ? "s" : ""}
                    {mealPlan.kids > 0 ? ` · ${mealPlan.kids} kid${mealPlan.kids > 1 ? "s" : ""}` : ""}
                    {mealPlan.store ? ` · ${mealPlan.store}` : ""}
                    {mealPlan.budget ? ` · $${mealPlan.budget} budget` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAiStep("configure"); setMealPlan(null); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  <RotateCcw style={{ width: "0.875rem", height: "0.875rem" }} /> Start over
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {mealPlan.weeks.map((week) => (
                  <MealWeekCard key={week.week} week={week} />
                ))}
              </div>

              {aiError && <div role="alert" className="alert alert--error">{aiError}</div>}

              <button
                type="button"
                onClick={handleBuildGroceryList}
                disabled={aiStep === "loading-list"}
                className="btn btn--sage"
                style={{ gap: "0.5rem" }}
              >
                {aiStep === "loading-list"
                  ? <><Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> Honey is building your list…</>
                  : <><ArrowRight style={{ width: "1rem", height: "1rem" }} /> Ask Honey to build my list</>
                }
              </button>
            </div>
          )}

          {/* Step 3: Grocery List from meal plan */}
          {aiStep === "list" && (
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 className="card-title">
                    Grocery list{mealPlan?.store ? <span style={{ fontWeight: 500, color: "var(--color-muted)" }}> · {mealPlan.store}</span> : ""}
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                    {aiSelected.size} of {aiSuggestions.length} selected · est. <strong>${aiTotal.toFixed(2)}</strong>
                    {mealPlan?.budget ? <span> · <span style={{ color: mealPlan.budget && aiTotal > mealPlan.budget ? "var(--blush-700)" : "var(--sage-700)", fontWeight: 700 }}>${mealPlan.budget} budget</span></span> : ""}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setAiSelected(aiSelected.size === aiSuggestions.length ? new Set() : new Set(aiSuggestions.map((_, i) => i)))}
                    style={{ fontSize: "0.75rem", color: "var(--sage-700)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                  >
                    {aiSelected.size === aiSuggestions.length ? "Deselect all" : "Select all"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiStep("meal-plan")}
                    style={{ fontSize: "0.75rem", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    <RotateCcw style={{ width: "0.75rem", height: "0.75rem" }} /> Meals
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "18rem", overflowY: "auto" }}>
                {aiSuggestions.map((item, i) => (
                  <label
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.5rem 0.625rem", borderRadius: "0.625rem", cursor: "pointer",
                      border: "1px solid",
                      borderColor: aiSelected.has(i) ? "var(--sage-300)" : "var(--cream-200)",
                      background: aiSelected.has(i) ? "var(--sage-50)" : "white",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={aiSelected.has(i)}
                      onChange={() => toggleAI(i)}
                      style={{ accentColor: "var(--sage-600)", width: "1rem", height: "1rem", flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500 }}>{item.name}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>×{item.quantity}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--sage-700)" }}>
                      ${(item.estimatedPrice * item.quantity).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAIAdd}
                disabled={aiSelected.size === 0 || aiAdding}
                className="btn btn--honey"
                style={{ gap: "0.5rem" }}
              >
                {aiAdding
                  ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                  : <Plus style={{ width: "1rem", height: "1rem" }} />
                }
                Add {aiSelected.size} item{aiSelected.size !== 1 ? "s" : ""} to my list
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", textAlign: "center", marginTop: "-0.5rem" }}>
                This list will be saved to My Saved Lists automatically.
              </p>
            </div>
          )}
        </div>

        {/* ── My Saved Lists ── */}
        {savedLists.length > 0 && (
          <div className="card animate-fade-up delay-75">
            <button
              type="button"
              className="card-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              onClick={() => setSavedListsOpen((v) => !v)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="icon-pill icon-pill--lavender icon-pill--sm">
                  <Bookmark style={{ width: "1rem", height: "1rem" }} />
                </span>
                <h3 className="card-title">My Saved Lists</h3>
                <span className="badge badge--sage">{savedLists.length}</span>
              </div>
              {savedListsOpen
                ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />
                : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />
              }
            </button>

            {savedListsOpen && (
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {savedLists.map((list) => (
                  <div
                    key={list.id}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--cream-200)", background: "white" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{list.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                        {list.items.length} items · ${list.items.reduce((s, i) => s + i.estimatedPrice * i.quantity, 0).toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadSavedList(list)}
                      disabled={loadingListId === list.id}
                      className="btn btn--sage"
                      style={{ fontSize: "0.8125rem", padding: "0.4375rem 0.875rem", gap: "0.375rem", flexShrink: 0 }}
                    >
                      {loadingListId === list.id
                        ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                        : <Plus style={{ width: "0.875rem", height: "0.875rem" }} />
                      }
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedList(list.id)}
                      aria-label={`Delete ${list.name}`}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", flexShrink: 0, padding: "0.625rem", margin: "-0.625rem -0.375rem -0.625rem 0", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "2.75rem", minHeight: "2.75rem", borderRadius: "0.5rem" }}
                    >
                      <Trash2 style={{ width: "1rem", height: "1rem" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                No items yet — use AI planner or add manually above.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {planned.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.625rem 0",
                      borderBottom: idx < planned.length - 1 ? "1px solid var(--cream-200)" : "none",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleCheck(item)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sage-500)", flexShrink: 0, padding: "0.5rem", margin: "-0.5rem 0 -0.5rem -0.5rem", display: "flex", borderRadius: "0.5rem" }}
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
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", flexShrink: 0, padding: "0.625rem", margin: "-0.625rem -0.625rem -0.625rem 0", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "2.75rem", minHeight: "2.75rem", borderRadius: "0.5rem" }}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 style={{ width: "1.125rem", height: "1.125rem" }} />
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
                {showPurchased
                  ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />
                  : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />}
              </div>
            </button>
            {showPurchased && (
              <div className="card-body">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {purchased.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.625rem 0",
                        borderBottom: idx < purchased.length - 1 ? "1px solid var(--cream-200)" : "none",
                        opacity: 0.75,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleCheck(item)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sage-500)", flexShrink: 0, padding: "0.5rem", margin: "-0.5rem 0 -0.5rem -0.5rem", display: "flex", borderRadius: "0.5rem" }}
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
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", flexShrink: 0, padding: "0.625rem", margin: "-0.625rem -0.625rem -0.625rem 0", display: "flex", alignItems: "center", justifyContent: "center", minWidth: "2.75rem", minHeight: "2.75rem", borderRadius: "0.5rem" }}
                      >
                        <Trash2 style={{ width: "1.125rem", height: "1.125rem" }} />
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
