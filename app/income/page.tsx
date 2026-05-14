"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManualIncomeForm } from "@/components/forms/ManualIncomeForm";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Income {
  id: string;
  name: string;
  amount: number;
  cadence: string;
  source: string;
}

const CADENCE_LABEL: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  annually: "Annually",
};

function monthlyAmount(amount: number, cadence: string): number {
  switch (cadence) {
    case "weekly":   return (amount * 52) / 12;
    case "biweekly": return (amount * 26) / 12;
    case "annually": return amount / 12;
    default:         return amount;
  }
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchIncomes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/income");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIncomes(data.incomes ?? []);
    } catch {
      setError("Failed to load income sources.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchIncomes(); }, [fetchIncomes]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/income", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setIncomes((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Failed to delete income source.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalMonthly = incomes.reduce((s, i) => s + monthlyAmount(i.amount, i.cadence), 0);

  return (
    <div className="min-h-screen page-gradient">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-4">

        <div className="animate-fade-up">
          <p className="section-label mb-1">Finance</p>
          <h1 className="page-title">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track all your income sources.</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200 animate-slide-up">
            {error}
          </div>
        )}

        {/* Hero stat */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 p-5 text-white shadow-soft animate-fade-up delay-50">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 90% 10%, white 0%, transparent 60%)" }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="section-label text-white/70">Total monthly income</p>
              <p className="mt-2 text-4xl font-bold tabular text-white">{fmt(totalMonthly)}</p>
              <p className="mt-1 text-sm text-white/60">
                {incomes.length} source{incomes.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </span>
              <Link href="/settings">
                <button className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-[0.97]">
                  <Building2 className="h-3.5 w-3.5" />
                  Import from bank
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Add form */}
        <Card className="animate-fade-up delay-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-sage-700">Add an income source</CardTitle>
          </CardHeader>
          <CardContent>
            <ManualIncomeForm onSuccess={fetchIncomes} />
          </CardContent>
        </Card>

        {/* List */}
        <Card className="animate-fade-up delay-150">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span>Your income sources</span>
              {incomes.length > 0 && (
                <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-bold text-sage-700 ring-1 ring-sage-200">
                  {incomes.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-sage-400" />
              </div>
            ) : incomes.length === 0 ? (
              <div className="empty-state gap-3">
                <span className="text-4xl">💰</span>
                <div>
                  <p className="font-semibold text-foreground">No income sources yet</p>
                  <p className="text-sm text-muted-foreground">Add your first income source above.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {incomes.map((income, i) => (
                  <li key={income.id}>
                    {i > 0 && <Separator className="my-1.5 bg-cream-100" />}
                    <div className="group flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-cream-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-sm text-foreground truncate">{income.name}</span>
                          {income.source === "plaid" && (
                            <span className="chip bg-lavender-50 text-lavender-700 ring-lavender-200">bank</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {CADENCE_LABEL[income.cadence] ?? income.cadence}
                          {" · "}
                          <span className="font-semibold text-sage-700">
                            {fmt(monthlyAmount(income.amount, income.cadence))}/mo
                          </span>
                        </p>
                      </div>
                      <p className="font-bold tabular text-sm text-foreground whitespace-nowrap">
                        {fmt(income.amount)}
                      </p>
                      <button
                        onClick={() => handleDelete(income.id)}
                        disabled={deletingId === income.id}
                        aria-label="Delete income source"
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-blush-50 hover:text-blush-500 disabled:opacity-30"
                      >
                        {deletingId === income.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
