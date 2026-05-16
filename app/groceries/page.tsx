"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Loader2, Plus, Trash2, CheckCircle2, Circle,
  Sparkles, Receipt, ChevronDown, ChevronUp,
  Users, Baby, Calendar, ArrowRight, RotateCcw,
  UtensilsCrossed, Store, DollarSign, Bookmark, X, BookOpen, ClipboardList,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import type { MealPlan, MealWeek } from "@/app/api/groceries/meal-plan/route";
import type { RecipeData } from "@/app/api/groceries/recipe/route";

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
  { label: "3 days",  days: 3  },
  { label: "5 days",  days: 5  },
  { label: "7 days",  days: 7  },
  { label: "14 days", days: 14 },
  { label: "28 days", days: 28 },
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

function MealWeekCard({ week, onMealClick, onDayRetry }: {
  week: MealWeek;
  onMealClick?: (meal: string) => void;
  onDayRetry?: (weekNum: number, dayName: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [retryingDay, setRetryingDay] = useState<string | null>(null);

  async function handleRetry(dayName: string) {
    if (!onDayRetry || retryingDay) return;
    setRetryingDay(dayName);
    try {
      await onDayRetry(week.week, dayName);
    } finally {
      setRetryingDay(null);
    }
  }

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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--honey-700)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{day.day}</p>
                {onDayRetry && (
                  <button
                    type="button"
                    onClick={() => handleRetry(day.day)}
                    disabled={retryingDay !== null}
                    title={`Regenerate ${day.day}`}
                    style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", fontWeight: 600, color: retryingDay === day.day ? "var(--honey-600)" : "var(--color-muted)", background: "none", border: "none", cursor: retryingDay ? "default" : "pointer", padding: "0.125rem 0.25rem", borderRadius: "0.375rem", transition: "color 0.15s" }}
                  >
                    {retryingDay === day.day
                      ? <Loader2 style={{ width: "0.75rem", height: "0.75rem", animation: "spin 1s linear infinite" }} />
                      : <RotateCcw style={{ width: "0.75rem", height: "0.75rem" }} />
                    }
                    {retryingDay === day.day ? "Retrying…" : "Retry day"}
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gap: "0.25rem", opacity: retryingDay === day.day ? 0.4 : 1, transition: "opacity 0.2s" }}>
                {([["🌅", day.breakfast], ["☀️", day.lunch], ["🌙", day.dinner]] as [string, string][]).map(([emoji, meal]) => (
                  <div key={emoji} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-fg)" }}>
                      <span style={{ marginRight: "0.375rem" }}>{emoji}</span>{meal}
                    </p>
                    {onMealClick && (
                      <button
                        type="button"
                        onClick={() => onMealClick(meal)}
                        className="meal-recipe-btn"
                        title="Get recipe"
                      >
                        <BookOpen style={{ width: "0.75rem", height: "0.75rem" }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GroceriesPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [budget, setBudget] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Add item
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [addingItem, setAddingItem] = useState(false);

  // Paste recipe
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteParsing, setPasteParsing] = useState(false);
  const [pasteIngredients, setPasteIngredients] = useState<{ item: string; amount: string; estimatedPrice: number }[] | null>(null);
  const [pasteSelected, setPasteSelected] = useState<Set<number>>(new Set());
  const [pasteAdding, setPasteAdding] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Honey flow
  const [aiStep, setAiStep] = useState<AIStep>("configure");
  const [aiDays, setAiDays] = useState(7);
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

  // Household role
  const [userRole, setUserRole] = useState<"queen" | "worker" | "hive">("queen");

  // Smart reorder
  const [frequentItems, setFrequentItems] = useState<Record<string, { count: number; lastPrice: number | null }>>({});

  // Collapsible panels
  const [aiPlannerOpen, setAiPlannerOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Nutrition summary
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [nutrition, setNutrition] = useState<import("@/app/api/groceries/nutrition/route").NutritionSummary | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

  // Recipe modal
  const [recipeTarget, setRecipeTarget] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [recipeAddingIngredients, setRecipeAddingIngredients] = useState(false);
  const [recipeSelected, setRecipeSelected] = useState<Set<number>>(new Set());
  const recipeCache = useRef<Map<string, RecipeData>>(new Map());

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
    async function init() {
      await Promise.all([fetchItems(), fetchBudget()]);
      const res = await fetch("/api/user-settings");
      if (res.ok) {
        const s = await res.json();
        setAiAdults(s.householdAdults ?? 2);
        setAiKids(s.householdKids ?? 0);
        setAiStore(s.preferredStore ?? "");
        if (s.savedMealPlan) setSavedMealPlan(s.savedMealPlan);
        if (Array.isArray(s.savedLists) && s.savedLists.length > 0) setSavedLists(s.savedLists);
        if (s.frequentItems && typeof s.frequentItems === "object") setFrequentItems(s.frequentItems);
      }
      const roleRes = await fetch("/api/household");
      if (roleRes.ok) { const rd = await roleRes.json(); setUserRole(rd.role ?? "queen"); }
      setIsLoading(false);
    }
    init();
  }, [fetchItems, fetchBudget]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingItem(true);
    const qty = parseInt(newQty) || 1;
    let estimatedPrice: number | undefined;
    try {
      const pr = await fetch("/api/groceries/estimate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: newName.trim(), quantity: qty }),
      });
      if (pr.ok) { const pd = await pr.json(); estimatedPrice = pd.price; }
    } catch { /* best-effort */ }
    await fetch("/api/groceries/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), quantity: qty, estimatedPrice }),
    });
    setNewName(""); setNewQty("1");
    await fetchItems();
    setAddingItem(false);
    nameRef.current?.focus();
  }

  async function handleParseRecipe() {
    if (!pasteText.trim()) return;
    setPasteError(null);
    setPasteParsing(true);
    setPasteIngredients(null);
    try {
      const res = await fetch("/api/groceries/parse-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeText: pasteText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse");
      setPasteIngredients(data.ingredients ?? []);
      setPasteSelected(new Set(data.ingredients.map((_: unknown, i: number) => i)));
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPasteParsing(false);
    }
  }

  async function handleAddPasteIngredients() {
    if (!pasteIngredients) return;
    const toAdd = pasteIngredients.filter((_, i) => pasteSelected.has(i));
    if (!toAdd.length) return;
    setPasteAdding(true);
    await fetch("/api/groceries/cart/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: toAdd.map((ing) => ({ name: ing.item, quantity: 1, estimatedPrice: ing.estimatedPrice })),
      }),
    });
    await fetchItems();
    setPasteOpen(false);
    setPasteText("");
    setPasteIngredients(null);
    setPasteSelected(new Set());
    setPasteAdding(false);
  }

  function handleCheck(item: GroceryItem) {
    const newStatus = item.status === "planned" ? "purchased" : "planned";
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: newStatus } : i));
    fetch("/api/groceries/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: newStatus }),
    });
    // Track purchase frequency for smart reorder
    if (newStatus === "purchased") {
      fetch("/api/user-settings")
        .then((r) => r.ok ? r.json() : null)
        .then((s) => {
          const freq: Record<string, { count: number; lastPrice: number | null }> = s?.frequentItems ?? {};
          const key = item.name.toLowerCase().trim();
          freq[key] = { count: (freq[key]?.count ?? 0) + 1, lastPrice: item.estimatedPrice };
          fetch("/api/user-settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frequentItems: freq }),
          });
        });
    }
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    fetch("/api/groceries/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function handleBuildMealPlan() {
    setAiError(null);
    setAiStep("loading-plan");
    // Save household prefs so they persist for next time
    fetch("/api/user-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ householdAdults: aiAdults, householdKids: aiKids, preferredStore: aiStore }),
    });
    try {
      const res = await fetch("/api/groceries/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: aiDays, adults: aiAdults, kids: aiKids, notes: aiNotes, store: aiStore, budget: aiBudget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMealPlan(data.mealPlan);
      setAiStep("meal-plan");
      const planWithDate = { ...data.mealPlan, savedAt: new Date().toISOString() };
      setSavedMealPlan(planWithDate);
      setSavedMealPlanOpen(false);
      fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedMealPlan: planWithDate }),
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
      setAiStep("configure");
    }
  }

  async function handleDayRetry(weekNum: number, dayName: string) {
    if (!mealPlan) return;
    // Collect all current meals so Claude avoids repeating them
    const existingMeals = mealPlan.weeks.flatMap((w) =>
      w.days.flatMap((d) => [d.breakfast, d.lunch, d.dinner])
    );
    const res = await fetch("/api/groceries/meal-plan/retry-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayName,
        adults: mealPlan.adults,
        kids: mealPlan.kids,
        store: mealPlan.store,
        budget: mealPlan.budget,
        existingMeals,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to regenerate day");
    // Patch that day in both live view and saved plan, then persist
    const patchWeeks = (weeks: MealPlan["weeks"]) =>
      weeks.map((w) =>
        w.week !== weekNum ? w : {
          ...w,
          days: w.days.map((d) => d.day === dayName ? data.day : d),
        }
      );

    setMealPlan((prev) => prev ? { ...prev, weeks: patchWeeks(prev.weeks) } : prev);

    setSavedMealPlan((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, weeks: patchWeeks(prev.weeks) };
      fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedMealPlan: updated }),
      }).catch(() => {});
      return updated;
    });
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
    await fetch("/api/groceries/cart/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: toAdd }),
    });
    // Auto-save this list for reuse
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
    const updatedLists = [newList, ...savedLists].slice(0, 10);
    setSavedLists(updatedLists);
    fetch("/api/user-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedLists: updatedLists }),
    });

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
    setSavedMealPlan(null);
    fetch("/api/user-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedMealPlan: null }),
    });
  }

  function handleUseSavedMealPlan() {
    if (!savedMealPlan) return;
    setMealPlan(savedMealPlan);
    setAiStep("meal-plan");
    setSavedMealPlanOpen(false);
  }

  async function handleLoadSavedList(list: SavedList) {
    setLoadingListId(list.id);
    await fetch("/api/groceries/cart/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: list.items }),
    });
    await fetchItems();
    setLoadingListId(null);
  }

  function handleDeleteSavedList(id: string) {
    const updated = savedLists.filter((l) => l.id !== id);
    setSavedLists(updated);
    fetch("/api/user-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedLists: updated }),
    });
  }

  async function handleClearPurchased() {
    await fetch("/api/groceries/cart/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "purchased" }),
    });
    await fetchItems();
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

  async function handleGetNutrition() {
    if (!mealPlan) return;
    const meals = mealPlan.weeks.flatMap((w) => w.days.flatMap((d) => [d.breakfast, d.lunch, d.dinner]));
    setNutritionOpen(true);
    if (nutrition) return;
    setNutritionLoading(true);
    setNutritionError(null);
    try {
      const res = await fetch("/api/groceries/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals, adults: aiAdults, kids: aiKids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setNutrition(data.nutrition);
    } catch (err) {
      setNutritionError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setNutritionLoading(false);
    }
  }

  async function handleMealClick(meal: string) {
    setRecipeTarget(meal);
    setRecipeError(null);
    const cached = recipeCache.current.get(meal);
    if (cached) { setRecipe(cached); setRecipeSelected(new Set(cached.ingredients.map((_, i) => i))); return; }
    setRecipe(null);
    setRecipeLoading(true);
    try {
      const res = await fetch("/api/groceries/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal, servings: aiAdults + Math.ceil(aiKids * 0.5) || 2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load recipe");
      recipeCache.current.set(meal, data.recipe);
      setRecipe(data.recipe);
      setRecipeSelected(new Set(data.recipe.ingredients.map((_: unknown, i: number) => i)));
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRecipeLoading(false);
    }
  }

  async function handleAddRecipeIngredients() {
    if (!recipe) return;
    const toAdd = recipe.ingredients.filter((_, i) => recipeSelected.has(i));
    if (!toAdd.length) return;
    setRecipeAddingIngredients(true);
    try {
      await fetch("/api/groceries/cart/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: toAdd.map((ing) => ({ name: ing.item, quantity: 1, estimatedPrice: null })),
        }),
      });
      await fetchItems();
      setRecipeTarget(null);
      setRecipe(null);
    } catch {
      // silently ignore
    } finally {
      setRecipeAddingIngredients(false);
    }
  }

  const planned   = items.filter((i) => i.status === "planned");
  const purchased = items.filter((i) => i.status === "purchased").sort((a, b) => a.name.localeCompare(b.name));
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

  const plannerBodyVisible = aiPlannerOpen || aiStep !== "configure";

  return (
    <div className="app-layout">
      <Navbar />
      <main className="page-container">

        {/* Header */}
        <div className="animate-fade-up">
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>Grocery Planner</p>
          <h1 className="page-title">Grocery List</h1>
        </div>

        {/* ── Your List (unified card) ── */}
        <div className="card animate-fade-up delay-50">
          {/* Budget strip */}
          {budget > 0 && (
            <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", padding:"0.625rem 1.25rem", borderBottom:"1px solid var(--cream-200)", background:"var(--honey-50)" }}>
              <span style={{ fontSize:"0.8125rem", color:"var(--color-muted)" }}>
                Budget <strong style={{ color:"var(--color-fg)" }}>${budget.toFixed(0)}</strong>
              </span>
              <span style={{ fontSize:"0.8125rem", fontWeight:700, color: isOver ? "var(--blush-700)" : "var(--sage-700)" }}>
                {isOver ? `$${(totalPurchased - budget).toFixed(2)} over budget` : `$${remaining?.toFixed(2)} remaining`}
              </span>
            </div>
          )}

          {/* Add form — non-hive only */}
          {userRole !== "hive" && (
            <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid var(--cream-200)" }}>
              <form onSubmit={handleAddItem} style={{ display:"flex", gap:"0.5rem" }}>
                <input ref={nameRef} type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add an item…" className="form-input" style={{ flex:1, minWidth:0 }} required />
                <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="Qty" className="form-input" style={{ width:"4.5rem", flexShrink:0 }} min={1} />
                <button type="submit" disabled={addingItem || !newName.trim()} className="btn btn--honey" style={{ gap:"0.375rem", flexShrink:0 }}>
                  {addingItem
                    ? <><Loader2 style={{ width:"1rem", height:"1rem", animation:"spin 1s linear infinite" }} /> Estimating…</>
                    : <><Plus style={{ width:"1rem", height:"1rem" }} /> Add</>
                  }
                </button>
              </form>
              <p style={{ fontSize:"0.6875rem", color:"var(--color-muted)", marginTop:"0.375rem" }}>
                Price estimated automatically by Honey 🍯
              </p>

              {/* Quick reorder chips — only when there are suggestions */}
              {Object.keys(frequentItems).length > 0 && (() => {
                const topItems = Object.entries(frequentItems).sort(([,a],[,b]) => b.count - a.count).slice(0, 8);
                const plannedNames = new Set(items.filter((i) => i.status === "planned").map((i) => i.name.toLowerCase().trim()));
                const suggestions = topItems.filter(([key]) => !plannedNames.has(key));
                if (!suggestions.length) return null;
                return (
                  <div style={{ marginTop:"0.75rem" }}>
                    <p style={{ fontSize:"0.6875rem", fontWeight:700, color:"var(--color-muted)", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"0.5rem" }}>Quick reorder</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"0.375rem" }}>
                      {suggestions.map(([key, { lastPrice }]) => {
                        const displayName = key.charAt(0).toUpperCase() + key.slice(1);
                        return (
                          <button key={key} type="button"
                            onClick={async () => {
                              await fetch("/api/groceries/cart", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: displayName, quantity:1, estimatedPrice: lastPrice ?? undefined }) });
                              fetchItems();
                            }}
                            style={{ display:"flex", alignItems:"center", gap:"0.25rem", padding:"0.3125rem 0.625rem", borderRadius:"999px", border:"1px solid var(--cream-300)", background:"var(--cream-50)", fontSize:"0.8125rem", fontWeight:500, cursor:"pointer", color:"var(--color-fg)" }}
                          >
                            <Plus style={{ width:"0.625rem", height:"0.625rem", color:"var(--honey-500)" }} />
                            {displayName}
                            {lastPrice != null && <span style={{ color:"var(--color-muted)", fontSize:"0.75rem" }}>${lastPrice.toFixed(2)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Shopping list items */}
          <div className="card-body">
            {planned.length === 0 ? (
              <p style={{ fontSize:"0.875rem", color:"var(--color-muted)", textAlign:"center", padding:"1.5rem 0" }}>
                {userRole === "hive" ? "No items on the list yet." : "Your list is empty — add items above or use the meal planner below."}
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column" }}>
                {planned.map((item, idx) => (
                  <div key={item.id} style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.625rem 0", borderBottom: idx < planned.length - 1 ? "1px solid var(--cream-200)" : "none" }}>
                    <button type="button" onClick={() => handleCheck(item)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--sage-500)", flexShrink:0, padding:"0.5rem", margin:"-0.5rem 0 -0.5rem -0.5rem", display:"flex", borderRadius:"0.5rem" }} aria-label={`Mark ${item.name} as purchased`}>
                      <Circle style={{ width:"1.375rem", height:"1.375rem" }} />
                    </button>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, fontSize:"0.9375rem", color:"var(--color-fg)" }}>{item.name}</p>
                      {item.quantity > 1 && <p style={{ fontSize:"0.75rem", color:"var(--color-muted)" }}>qty {item.quantity}</p>}
                    </div>
                    {item.estimatedPrice != null && (
                      <span style={{ fontWeight:700, fontSize:"0.9375rem", color:"var(--color-fg)", whiteSpace:"nowrap" }}>
                        ${(item.estimatedPrice * item.quantity).toFixed(2)}
                      </span>
                    )}
                    {userRole !== "hive" && (
                      <button type="button" onClick={() => handleDelete(item.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-muted)", flexShrink:0, padding:"0.625rem", margin:"-0.625rem -0.625rem -0.625rem 0", display:"flex", alignItems:"center", justifyContent:"center", minWidth:"2.75rem", minHeight:"2.75rem", borderRadius:"0.5rem" }} aria-label={`Remove ${item.name}`}>
                        <Trash2 style={{ width:"1.125rem", height:"1.125rem" }} />
                      </button>
                    )}
                  </div>
                ))}
                <div style={{ marginTop:"0.625rem", paddingTop:"0.625rem", borderTop:"1px solid var(--cream-200)", display:"flex", justifyContent:"flex-end" }}>
                  <span style={{ fontSize:"0.8125rem", color:"var(--color-muted)" }}>
                    Est. total <strong style={{ color:"var(--color-fg)" }}>${totalPlanned.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Paste a recipe ── */}
        {userRole !== "hive" && (
          <div className="card animate-fade-up delay-75">
            <button
              type="button"
              onClick={() => { setPasteOpen((v) => !v); setPasteIngredients(null); setPasteError(null); }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: pasteOpen ? "1.25rem 1.25rem 0" : "1.25rem" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="icon-pill icon-pill--lavender icon-pill--sm">
                  <ClipboardList style={{ width: "1rem", height: "1rem" }} />
                </span>
                <div>
                  <h3 className="card-title" style={{ display: "inline" }}>Paste a recipe</h3>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>Extract ingredients from any recipe and add them to your list.</p>
                </div>
              </div>
              {pasteOpen
                ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)", flexShrink: 0 }} />
                : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)", flexShrink: 0 }} />
              }
            </button>

            {pasteOpen && (
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {!pasteIngredients ? (
                  <>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Paste your recipe here — ingredients, steps, anything. Honey will find the ingredients."
                      className="form-input"
                      style={{ minHeight: "8rem", resize: "vertical", fontFamily: "inherit", fontSize: "0.875rem", lineHeight: 1.5 }}
                      disabled={pasteParsing}
                    />
                    {pasteError && <div role="alert" className="alert alert--error">{pasteError}</div>}
                    <button
                      type="button"
                      onClick={handleParseRecipe}
                      disabled={pasteParsing || !pasteText.trim()}
                      className="btn btn--honey"
                      style={{ gap: "0.5rem" }}
                    >
                      {pasteParsing
                        ? <><Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> Extracting ingredients…</>
                        : <><Sparkles style={{ width: "1rem", height: "1rem" }} /> Extract ingredients</>
                      }
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-fg)" }}>
                        {pasteIngredients.length} ingredient{pasteIngredients.length !== 1 ? "s" : ""} found
                      </p>
                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => setPasteSelected(
                            pasteSelected.size === pasteIngredients.length
                              ? new Set()
                              : new Set(pasteIngredients.map((_, i) => i))
                          )}
                          style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--honey-700)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          {pasteSelected.size === pasteIngredients.length ? "Deselect all" : "Select all"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPasteIngredients(null); setPasteText(""); }}
                          style={{ fontSize: "0.75rem", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          ← Back
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "16rem", overflowY: "auto" }}>
                      {pasteIngredients.map((ing, i) => (
                        <label
                          key={i}
                          style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.625rem", borderRadius: "0.625rem", cursor: "pointer", border: "1px solid", borderColor: pasteSelected.has(i) ? "var(--honey-300)" : "var(--cream-200)", background: pasteSelected.has(i) ? "var(--honey-50)" : "white" }}
                        >
                          <input
                            type="checkbox"
                            checked={pasteSelected.has(i)}
                            onChange={() => {
                              const next = new Set(pasteSelected);
                              next.has(i) ? next.delete(i) : next.add(i);
                              setPasteSelected(next);
                            }}
                            style={{ accentColor: "var(--honey-500)", width: "1rem", height: "1rem", flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500 }}>{ing.item}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{ing.amount}</span>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--honey-700)" }}>${ing.estimatedPrice.toFixed(2)}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPasteIngredients}
                      disabled={pasteSelected.size === 0 || pasteAdding}
                      className="btn btn--honey"
                      style={{ gap: "0.5rem" }}
                    >
                      {pasteAdding
                        ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                        : <Plus style={{ width: "1rem", height: "1rem" }} />
                      }
                      Add {pasteSelected.size} ingredient{pasteSelected.size !== 1 ? "s" : ""} to list
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Meal Planning section ── */}
        <div style={{ marginTop:"0.25rem" }}>
          <p className="section-label" style={{ padding:"0 0.25rem", marginBottom:"0.75rem" }}>Meal Planning</p>

          {/* Saved meal plan */}
          {savedMealPlan && (
            <div className="card" style={{ borderColor: "var(--honey-200)", background: "var(--honey-50)", marginBottom: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setSavedMealPlanOpen((v) => !v)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: savedMealPlanOpen ? "1.25rem 1.25rem 0" : "1.25rem" }}
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
                      {(savedMealPlan as any).savedAt ? ` · saved ${new Date((savedMealPlan as any).savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}
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
                    <MealWeekCard key={week.week} week={week} onMealClick={handleMealClick} />
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

          {/* AI Planner — collapsible */}
          {userRole !== "hive" && (
            <div className="card" style={{ marginBottom: "0.75rem" }}>
              <button type="button"
                onClick={() => { if (aiStep === "configure") setAiPlannerOpen((v) => !v); }}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", background:"none", border:"none", cursor: aiStep === "configure" ? "pointer" : "default", textAlign:"left", padding: plannerBodyVisible ? "1rem 1.25rem 0" : "1rem 1.25rem" }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <span className="icon-pill icon-pill--honey icon-pill--sm">
                    <Sparkles style={{ width:"1rem", height:"1rem" }} />
                  </span>
                  <div>
                    <h3 className="card-title" style={{ display:"inline" }}>Ask Honey 🍯</h3>
                    {!plannerBodyVisible && (
                      <p style={{ fontSize:"0.8125rem", color:"var(--color-muted)", marginTop:"0.125rem" }}>Build a meal plan and grocery list.</p>
                    )}
                  </div>
                </div>
                {aiStep === "configure" && (
                  plannerBodyVisible
                    ? <ChevronUp style={{ width:"1rem", height:"1rem", color:"var(--color-muted)" }} />
                    : <ChevronDown style={{ width:"1rem", height:"1rem", color:"var(--color-muted)" }} />
                )}
              </button>

              {plannerBodyVisible && (<>
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

                    {/* Duration */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                  <Calendar style={{ width: "1rem", height: "1rem", color: "var(--honey-600)" }} />
                  <label style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-fg)" }}>How long?</label>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {DURATION_OPTIONS.map(({ label, days }) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setAiDays(days)}
                      disabled={isAILoading}
                      style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", border: "1px solid", borderColor: aiDays === days ? "var(--honey-400)" : "var(--cream-300)", background: aiDays === days ? "var(--honey-100)" : "white", fontWeight: 700, fontSize: "0.875rem", color: aiDays === days ? "var(--honey-800)" : "var(--color-muted)", cursor: isAILoading ? "default" : "pointer", transition: "all 0.15s" }}
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
                        <MealWeekCard key={week.week} week={week} onMealClick={handleMealClick} onDayRetry={handleDayRetry} />
                      ))}
                    </div>

                    {aiError && <div role="alert" className="alert alert--error">{aiError}</div>}

                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={handleBuildGroceryList}
                        disabled={aiStep === "loading-list"}
                        className="btn btn--sage"
                        style={{ gap: "0.5rem", flex: 1 }}
                      >
                        {aiStep === "loading-list"
                          ? <><Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> Honey is building your list…</>
                          : <><ArrowRight style={{ width: "1rem", height: "1rem" }} /> Ask Honey to build my list</>
                        }
                      </button>
                      <button
                        type="button"
                        onClick={handleGetNutrition}
                        className="btn btn--soft"
                        style={{ gap: "0.5rem" }}
                        title="Nutrition overview"
                      >
                        <UtensilsCrossed style={{ width: "1rem", height: "1rem" }} />
                        Nutrition
                      </button>
                    </div>
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
              </>)}
            </div>
          )}

          {/* Saved Lists */}
          {savedLists.length > 0 && (
            <div className="card">
              <button
                type="button"
                onClick={() => setSavedListsOpen((v) => !v)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: savedListsOpen ? "1.25rem 1.25rem 0" : "1.25rem" }}
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
        </div>

        {/* ── After Shopping section ── */}
        <div style={{ marginTop:"0.25rem" }}>
          <p className="section-label" style={{ padding:"0 0.25rem", marginBottom:"0.75rem" }}>After Shopping</p>

          {/* Log receipt — collapsible */}
          {userRole !== "hive" && (
            <div className="card" style={{ marginBottom:"0.75rem" }}>
              <button type="button" onClick={() => setReceiptOpen((v) => !v)}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", background:"none", border:"none", cursor:"pointer", textAlign:"left", padding: receiptOpen ? "1.25rem 1.25rem 0" : "1.25rem" }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <span className="icon-pill icon-pill--honey icon-pill--sm">
                    <Receipt style={{ width:"1rem", height:"1rem" }} />
                  </span>
                  <div>
                    <h3 className="card-title">Log a receipt</h3>
                    <p style={{ fontSize:"0.8125rem", color:"var(--color-muted)", marginTop:"0.125rem" }}>Track your spend against your grocery budget.</p>
                  </div>
                </div>
                {receiptOpen
                  ? <ChevronUp style={{ width:"1rem", height:"1rem", color:"var(--color-muted)", flexShrink:0 }} />
                  : <ChevronDown style={{ width:"1rem", height:"1rem", color:"var(--color-muted)", flexShrink:0 }} />
                }
              </button>
              {receiptOpen && (
                <div className="card-body">
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
              )}
            </div>
          )}

          {/* Purchased / logged */}
          {purchased.length > 0 && (
            <div className="card" style={{ opacity: 0.85 }}>
              <button
                type="button"
                onClick={() => setShowPurchased((v) => !v)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: showPurchased ? "1.25rem 1.25rem 0" : "1.25rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 style={{ width: "1rem", height: "1rem", color: "var(--sage-600)" }} />
                  <h3 className="card-title" style={{ color: "var(--color-muted)" }}>Purchased / logged</h3>
                  <span className="badge badge--sage">{purchased.length}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--sage-700)" }}>${totalPurchased.toFixed(2)}</span>
                  {showPurchased
                    ? <ChevronUp style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />
                    : <ChevronDown style={{ width: "1rem", height: "1rem", color: "var(--color-muted)" }} />}
                </div>
              </button>
              {showPurchased && (
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={handleClearPurchased}
                      style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--blush-700)", background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0" }}
                    >
                      Clear all
                    </button>
                  </div>
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
        </div>

      </main>

      {/* Nutrition Modal */}
      {nutritionOpen && (
        <div className="ai-modal-backdrop" onClick={() => setNutritionOpen(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <UtensilsCrossed style={{ width: "1.125rem", height: "1.125rem", color: "var(--sage-500)" }} />
                <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-fg)" }}>Nutrition overview</h2>
              </div>
              <button type="button" onClick={() => setNutritionOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: "0.25rem", display: "flex" }}>
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>
            <div className="ai-modal-body">
              {nutritionLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2rem 0" }}>
                  <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--sage-400)", animation: "spin 1s linear infinite" }} />
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Analyzing your meal plan…</p>
                </div>
              )}
              {nutritionError && <div role="alert" className="alert alert--error">{nutritionError}</div>}
              {nutrition && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <p style={{ fontSize: "0.9375rem", color: "var(--color-fg)", lineHeight: 1.5 }}>{nutrition.overview}</p>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-fg)", marginBottom: "0.625rem" }}>Daily averages per adult</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {Object.entries(nutrition.dailyAverages).map(([key, val]) => (
                        <div key={key} style={{ background: "var(--cream-100)", borderRadius: "0.75rem", padding: "0.625rem 0.875rem" }}>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "capitalize", marginBottom: "0.125rem" }}>{key}</p>
                          <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-fg)" }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {nutrition.highlights.length > 0 && (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-fg)", marginBottom: "0.5rem" }}>Highlights</p>
                      {nutrition.highlights.map((h, i) => (
                        <p key={i} style={{ fontSize: "0.875rem", color: "var(--sage-700)", marginBottom: "0.25rem" }}>✓ {h}</p>
                      ))}
                    </div>
                  )}
                  {nutrition.tips.length > 0 && (
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-fg)", marginBottom: "0.5rem" }}>Tips</p>
                      {nutrition.tips.map((t, i) => (
                        <p key={i} style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>💡 {t}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {recipeTarget && (
        <div className="ai-modal-backdrop" onClick={() => { setRecipeTarget(null); setRecipe(null); setRecipeError(null); }}>
          <div className="ai-modal recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BookOpen style={{ width: "1.125rem", height: "1.125rem", color: "var(--honey-500)" }} />
                <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--color-fg)" }}>
                  {recipe ? recipe.title : recipeTarget}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => { setRecipeTarget(null); setRecipe(null); setRecipeError(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: "0.25rem", display: "flex" }}
              >
                <X style={{ width: "1.25rem", height: "1.25rem" }} />
              </button>
            </div>

            <div className="ai-modal-body">
              {recipeLoading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "2rem 0" }}>
                  <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--honey-400)", animation: "spin 1s linear infinite" }} />
                  <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Honey is fetching the recipe…</p>
                </div>
              )}

              {recipeError && (
                <div role="alert" className="alert alert--error">{recipeError}</div>
              )}

              {recipe && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="recipe-meta-chip">⏱ Prep: {recipe.prepTime}</span>
                    <span className="recipe-meta-chip">🍳 Cook: {recipe.cookTime}</span>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-fg)" }}>Ingredients</p>
                      <button
                        type="button"
                        onClick={() => setRecipeSelected(
                          recipeSelected.size === recipe.ingredients.length
                            ? new Set()
                            : new Set(recipe.ingredients.map((_, i) => i))
                        )}
                        style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--honey-700)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        {recipeSelected.size === recipe.ingredients.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {recipe.ingredients.map((ing, i) => (
                        <label
                          key={i}
                          style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0.5rem", borderRadius: "0.5rem", cursor: "pointer", background: recipeSelected.has(i) ? "var(--honey-50)" : "transparent", transition: "background 0.1s" }}
                        >
                          <input
                            type="checkbox"
                            checked={recipeSelected.has(i)}
                            onChange={() => {
                              const next = new Set(recipeSelected);
                              next.has(i) ? next.delete(i) : next.add(i);
                              setRecipeSelected(next);
                            }}
                            style={{ width: "1rem", height: "1rem", accentColor: "var(--honey-500)", flexShrink: 0, cursor: "pointer" }}
                          />
                          <span className="recipe-ingredient-amount">{ing.amount}</span>
                          <span style={{ fontSize: "0.875rem", color: "var(--color-fg)" }}>{ing.item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-fg)", marginBottom: "0.5rem" }}>Steps</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {recipe.steps.map((step, i) => (
                        <div key={i} className="recipe-step-row">
                          <span className="recipe-step-num">{i + 1}</span>
                          <p style={{ fontSize: "0.875rem", color: "var(--color-fg)", lineHeight: 1.5 }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {recipe && (
              <div className="ai-modal-footer">
                <button
                  type="button"
                  onClick={handleAddRecipeIngredients}
                  disabled={recipeAddingIngredients || recipeSelected.size === 0}
                  className="btn btn--honey"
                  style={{ flex: 1, gap: "0.5rem", fontSize: "0.875rem" }}
                >
                  {recipeAddingIngredients
                    ? <><Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} /> Adding…</>
                    : <><Plus style={{ width: "0.875rem", height: "0.875rem" }} /> Add {recipeSelected.size} ingredient{recipeSelected.size !== 1 ? "s" : ""} to list</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
