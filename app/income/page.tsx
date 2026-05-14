"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ManualIncomeForm } from "@/components/forms/ManualIncomeForm";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, Building2 } from "lucide-react";
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
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "annually":
      return amount / 12;
    default:
      return amount;
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

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

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

  const totalMonthly = incomes.reduce(
    (sum, i) => sum + monthlyAmount(i.amount, i.cadence),
    0
  );

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Income</h1>
          <p className="mt-1 text-muted-foreground">
            Track all your income sources.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200">
            {error}
          </div>
        )}

        {/* Summary */}
        <Card className="border-sage-200 bg-gradient-to-r from-sage-50 to-white">
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm text-muted-foreground">Total monthly income</p>
              <p className="text-3xl font-bold text-sage-800">{fmt(totalMonthly)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {incomes.length} {incomes.length === 1 ? "source" : "sources"}
              </p>
              <Link href="/settings">
                <Button variant="sage" size="sm" className="mt-2 gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Import from bank
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Add form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-sage-700">
              Add an income source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ManualIncomeForm onSuccess={fetchIncomes} />
          </CardContent>
        </Card>

        {/* Income list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your income sources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-sage-400" />
              </div>
            ) : incomes.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <p className="text-4xl">💰</p>
                <p className="mt-2 font-medium">No income sources yet</p>
                <p className="text-sm">
                  Add your first income source above to get started.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {incomes.map((income, i) => (
                  <li key={income.id}>
                    {i > 0 && <Separator className="my-2" />}
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {income.name}
                          </span>
                          {income.source === "plaid" && (
                            <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs text-lavender-700">
                              bank
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {CADENCE_LABEL[income.cadence] ?? income.cadence}
                          {" · "}
                          <span className="text-sage-600 font-medium">
                            {fmt(monthlyAmount(income.amount, income.cadence))}/mo
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {fmt(income.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {CADENCE_LABEL[income.cadence]}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:bg-blush-50 hover:text-blush-600"
                        onClick={() => handleDelete(income.id)}
                        disabled={deletingId === income.id}
                        aria-label="Delete income source"
                      >
                        {deletingId === income.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  );
}
