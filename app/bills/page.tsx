"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Trash2, Building2, Receipt } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ManualBillForm } from "@/components/forms/ManualBillForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number | null;
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

function isDueSoon(dueDay: number | null): boolean {
  if (dueDay == null) return false;
  const diff = dueDay - new Date().getDate();
  return diff >= 0 && diff <= 7;
}

function isOverdue(dueDay: number | null): boolean {
  if (dueDay == null) return false;
  return dueDay < new Date().getDate();
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bills");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBills(data.bills);
    } catch {
      setError("Failed to load bills.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch("/api/bills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("Failed to delete bill.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalMonthly = bills.reduce((s, b) => s + monthlyAmount(b.amount, b.cadence), 0);

  return (
    <div className="min-h-screen page-gradient">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-4">

        {/* Header */}
        <div className="animate-fade-up">
          <p className="section-label mb-1">Expenses</p>
          <h1 className="page-title">Bills</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your recurring expenses and due dates.</p>
        </div>

        {error && (
          <div className="rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200 animate-slide-up">
            {error}
          </div>
        )}

        {/* Summary hero card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blush-400 to-blush-600 p-5 text-white shadow-soft animate-fade-up delay-50">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 90% 10%, white 0%, transparent 60%)" }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
                Total monthly
              </p>
              <p className="mt-2 text-4xl font-bold tabular text-white">
                ${totalMonthly.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="mt-1 text-sm text-white/60">
                {bills.length} recurring bill{bills.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Receipt className="h-6 w-6 text-white" />
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
            <CardTitle className="text-sm font-semibold text-blush-700">Add a bill</CardTitle>
          </CardHeader>
          <CardContent>
            <ManualBillForm onSuccess={fetchBills} />
          </CardContent>
        </Card>

        {/* Bills list */}
        <Card className="animate-fade-up delay-150">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <span>Your bills</span>
              {bills.length > 0 && (
                <span className="rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-bold text-blush-700 ring-1 ring-blush-200">
                  {bills.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-blush-400" />
              </div>
            ) : bills.length === 0 ? (
              <div className="empty-state gap-3">
                <span className="text-4xl">📋</span>
                <div>
                  <p className="font-semibold text-foreground">No bills yet</p>
                  <p className="text-sm text-muted-foreground">Add your first bill above.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {bills.map((bill, i) => {
                  const over = isOverdue(bill.dueDay);
                  const soon = !over && isDueSoon(bill.dueDay);
                  return (
                    <li key={bill.id}>
                      {i > 0 && <Separator className="my-1.5 bg-cream-100" />}
                      <div className="group flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-cream-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-foreground text-sm truncate">{bill.name}</span>
                            {bill.source === "plaid" && (
                              <span className="chip bg-lavender-50 text-lavender-700 ring-lavender-200">bank</span>
                            )}
                            {over && (
                              <span className="chip bg-blush-50 text-blush-600 ring-blush-200">overdue</span>
                            )}
                            {soon && (
                              <span className="chip bg-honey-50 text-honey-700 ring-honey-200">due soon</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {CADENCE_LABEL[bill.cadence] ?? bill.cadence}
                            {bill.dueDay != null && ` · due the ${bill.dueDay}th`}
                            {" · "}
                            <span className={cn("font-semibold", over ? "text-blush-600" : "text-foreground")}>
                              ${monthlyAmount(bill.amount, bill.cadence).toFixed(0)}/mo
                            </span>
                          </p>
                        </div>
                        <p className="font-bold tabular text-sm text-foreground whitespace-nowrap">
                          ${bill.amount.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          disabled={deletingId === bill.id}
                          aria-label="Delete bill"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-blush-50 hover:text-blush-500 disabled:opacity-30"
                        >
                          {deletingId === bill.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
