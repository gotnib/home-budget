"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetData {
  monthlyIncome: number;
  fixedBills: number;
  savingsGoal: number;
  flexibleBudget: number;
  groceryBudget: number;
  groceryPercent: number;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function BudgetPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [groceryPercent, setGroceryPercent] = useState(25);
  const [savingsGoal, setSavingsGoal] = useState(0);

  const fetchBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/budget");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setGroceryPercent(json.groceryPercent);
      setSavingsGoal(json.savingsGoal);
    } catch {
      setError("Failed to load budget data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const monthlyIncome = data?.monthlyIncome ?? 0;
  const fixedBills = data?.fixedBills ?? 0;
  const flexible = Math.max(0, monthlyIncome - fixedBills - savingsGoal);
  const groceryBudget = Math.max(0, flexible * (groceryPercent / 100));

  const billsPct = monthlyIncome > 0 ? Math.min(100, (fixedBills / monthlyIncome) * 100) : 0;
  const savingsPct = monthlyIncome > 0 ? Math.min(100, (savingsGoal / monthlyIncome) * 100) : 0;
  const groceryPct = monthlyIncome > 0 ? Math.min(100, (groceryBudget / monthlyIncome) * 100) : 0;

  async function handleSave() {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groceryPercent, savingsGoal }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSaveSuccess(true);
      await fetchBudget();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen page-gradient">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-honey-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-gradient">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 space-y-4">

        <div className="animate-fade-up">
          <p className="section-label mb-1">Finance</p>
          <h1 className="page-title">Budget</h1>
          <p className="mt-1 text-sm text-muted-foreground">Adjust your savings and grocery allocation.</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200 animate-slide-up">
            {error}
          </div>
        )}

        {/* Income */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 p-5 text-white shadow-soft animate-fade-up delay-50">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 90% 10%, white 0%, transparent 60%)" }}
          />
          <div className="relative">
            <p className="section-label text-white/70">Monthly income</p>
            <p className="mt-2 text-4xl font-bold tabular text-white">{fmt(monthlyIncome)}</p>
            <p className="mt-1 text-sm text-white/60">Calculated from your income sources</p>
          </div>
        </div>

        {/* Bills */}
        <Card className="animate-fade-up delay-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blush-700">Fixed bills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold tabular text-blush-800">{fmt(fixedBills)}</p>
              <span className="text-sm text-muted-foreground">{billsPct.toFixed(0)}% of income</span>
            </div>
            <Progress value={billsPct} className="h-2" indicatorClassName="bg-blush-400" />
          </CardContent>
        </Card>

        {/* Savings Goal */}
        <Card className="animate-fade-up delay-150">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-lavender-700">Monthly savings goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium">$</span>
              <Input
                type="number"
                min="0"
                step="10"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-36 text-lg font-bold"
              />
              <span className="text-sm text-muted-foreground">
                ({savingsPct.toFixed(0)}% of income)
              </span>
            </div>
            <Progress value={savingsPct} className="h-2" indicatorClassName="bg-lavender-400" />
          </CardContent>
        </Card>

        {/* Grocery % */}
        <Card className="animate-fade-up delay-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-honey-700">Grocery allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="grocery-pct" className="text-sm text-muted-foreground">
                  % of flexible budget for groceries
                </Label>
                <span className="text-xl font-bold tabular text-honey-700">{groceryPercent}%</span>
              </div>
              <input
                id="grocery-pct"
                type="range"
                min={0} max={100} step={1}
                value={groceryPercent}
                onChange={(e) => setGroceryPercent(parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-full accent-honey-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground/60">
                <span>0%</span><span>100%</span>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-2xl bg-gradient-to-r from-honey-50 to-lavender-50 p-4 ring-1 ring-honey-200">
              <p className="section-label mb-1">Your grocery budget</p>
              <p className="text-4xl font-bold tabular text-foreground">{fmt(groceryBudget)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {groceryPercent}% × {fmt(flexible)} flexible = {fmt(groceryBudget)}/mo
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-spring"
                  style={{
                    width: `${groceryPct}%`,
                    background: "linear-gradient(to right, #f9cf6b, #c9b8e8)",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card className="animate-fade-up delay-250">
          <CardContent className="pt-5">
            <p className="section-label mb-3">Monthly breakdown</p>
            <div className="space-y-2 text-sm">
              {[
                { label: "Income",         amount: monthlyIncome,                              color: "bg-sage-400",    positive: true },
                { label: "Fixed bills",    amount: -fixedBills,                                color: "bg-blush-400",   positive: false },
                { label: "Savings goal",   amount: -savingsGoal,                               color: "bg-lavender-400",positive: false },
                { label: "Grocery budget", amount: -groceryBudget,                             color: "bg-honey-400",   positive: false },
                { label: "Other flexible", amount: Math.max(0, flexible - groceryBudget),      color: "bg-cream-400",   positive: true },
              ].map(({ label, amount, color, positive }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", color)} />
                    {label}
                  </span>
                  <span className={cn("font-semibold tabular", positive ? "text-sage-700" : "text-foreground")}>
                    {amount < 0 ? "-" : "+"}{fmt(Math.abs(amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="space-y-3 animate-fade-up delay-300">
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-2xl bg-sage-50 px-4 py-3 text-sm text-sage-700 ring-1 ring-sage-200 animate-scale-in">
              <CheckCircle2 className="h-4 w-4 text-sage-500" />
              Budget settings saved!
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="w-full gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Budget Settings
          </Button>
        </div>
      </main>
    </div>
  );
}
