"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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

  // Editable state
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

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  // Live calculation
  const monthlyIncome = data?.monthlyIncome ?? 0;
  const fixedBills = data?.fixedBills ?? 0;
  const flexible = Math.max(0, monthlyIncome - fixedBills - savingsGoal);
  const groceryBudget = Math.max(0, flexible * (groceryPercent / 100));

  const billsPercent = monthlyIncome > 0 ? Math.min(100, (fixedBills / monthlyIncome) * 100) : 0;
  const savingsPercent = monthlyIncome > 0 ? Math.min(100, (savingsGoal / monthlyIncome) * 100) : 0;
  const groceryPercOfIncome = monthlyIncome > 0 ? Math.min(100, (groceryBudget / monthlyIncome) * 100) : 0;

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
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Budget</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust your savings and grocery allocation.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Income summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-sage-700">Monthly Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-sage-800">{fmt(monthlyIncome)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Calculated from your income sources. Add or edit income on the bills page.
              </p>
            </CardContent>
          </Card>

          {/* Bills summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-blush-700">Fixed Bills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end justify-between">
                <p className="text-4xl font-bold text-blush-800">{fmt(fixedBills)}</p>
                <span className="text-sm text-muted-foreground">
                  {billsPercent.toFixed(0)}% of income
                </span>
              </div>
              <Progress value={billsPercent} className="h-2" indicatorClassName="bg-blush-400" />
            </CardContent>
          </Card>

          {/* Savings Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-lavender-700">Monthly Savings Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-36 text-lg font-semibold"
                />
                <span className="text-sm text-muted-foreground">
                  ({savingsPercent.toFixed(0)}% of income)
                </span>
              </div>
              <Progress value={savingsPercent} className="h-2" indicatorClassName="bg-lavender-400" />
            </CardContent>
          </Card>

          {/* Grocery Percent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-foreground">Grocery Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grocery-pct">
                    % of flexible budget for groceries
                  </Label>
                  <span className="text-lg font-bold text-lavender-700">
                    {groceryPercent}%
                  </span>
                </div>
                <input
                  id="grocery-pct"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={groceryPercent}
                  onChange={(e) => setGroceryPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-blush-400"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <Separator />

              {/* Grocery budget result */}
              <div className="rounded-2xl bg-gradient-to-r from-blush-50 to-lavender-50 p-4">
                <p className="text-sm text-muted-foreground">Your grocery budget</p>
                <p className="mt-1 text-4xl font-bold text-foreground">{fmt(groceryBudget)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {groceryPercent}% × {fmt(flexible)} flexible = {fmt(groceryBudget)}/mo
                </p>
                <Progress
                  value={groceryPercOfIncome}
                  className="mt-3 h-2.5"
                  indicatorClassName="bg-gradient-to-r from-blush-400 to-lavender-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardContent className="pt-5">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Monthly Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Income", amount: monthlyIncome, color: "bg-sage-400" },
                  { label: "Fixed Bills", amount: -fixedBills, color: "bg-blush-400" },
                  { label: "Savings Goal", amount: -savingsGoal, color: "bg-lavender-400" },
                  { label: "Grocery Budget", amount: -groceryBudget, color: "bg-amber-300" },
                  {
                    label: "Other Flexible",
                    amount: Math.max(0, flexible - groceryBudget),
                    color: "bg-cream-300",
                  },
                ].map(({ label, amount, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                      {label}
                    </span>
                    <span className={`font-medium ${amount < 0 ? "text-blush-700" : "text-sage-700"}`}>
                      {amount < 0 ? "-" : "+"}{fmt(Math.abs(amount))}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          {saveSuccess && (
            <div className="rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700 ring-1 ring-sage-200">
              Settings saved!
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2 bg-blush-400 text-white hover:bg-blush-500"
            size="lg"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Budget Settings
          </Button>
        </div>
      </main>
    </div>
  );
}
