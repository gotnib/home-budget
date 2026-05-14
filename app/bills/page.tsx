"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Trash2, Building2 } from "lucide-react";
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
    case "weekly": return (amount * 52) / 12;
    case "biweekly": return (amount * 26) / 12;
    case "annually": return amount / 12;
    default: return amount;
  }
}

function isDueSoon(dueDay: number | null): boolean {
  if (dueDay == null) return false;
  const today = new Date().getDate();
  return dueDay >= today && dueDay - today <= 7;
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

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

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

  const totalMonthly = bills.reduce(
    (sum, b) => sum + monthlyAmount(b.amount, b.cadence),
    0
  );

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Bills</h1>
          <p className="mt-1 text-muted-foreground">
            Track your recurring expenses and due dates.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200">
            {error}
          </div>
        )}

        {/* Summary */}
        <Card className="mb-6 border-blush-200 bg-gradient-to-r from-blush-50 to-white">
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm text-muted-foreground">Total monthly bills</p>
              <p className="text-3xl font-bold text-blush-800">
                ${totalMonthly.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{bills.length} bills</p>
              <Link href="/settings">
                <Button variant="soft" size="sm" className="mt-2 gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Import from bank
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Add form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base text-blush-700">Add a Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <ManualBillForm onSuccess={fetchBills} />
          </CardContent>
        </Card>

        {/* Bills list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Bills</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-blush-400" />
              </div>
            ) : bills.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <p className="text-4xl">📋</p>
                <p className="mt-2 font-medium">No bills yet</p>
                <p className="text-sm">Add your first bill above.</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {bills.map((bill, i) => (
                  <li key={bill.id}>
                    {i > 0 && <Separator className="my-2" />}
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {bill.name}
                          </span>
                          {bill.source === "plaid" && (
                            <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs text-lavender-700">
                              bank
                            </span>
                          )}
                          {isOverdue(bill.dueDay) && (
                            <span className="rounded-full bg-blush-100 px-2 py-0.5 text-xs font-medium text-blush-600">
                              overdue
                            </span>
                          )}
                          {!isOverdue(bill.dueDay) && isDueSoon(bill.dueDay) && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              due soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {CADENCE_LABEL[bill.cadence] ?? bill.cadence}
                          {bill.dueDay && ` · due the ${bill.dueDay}th`}
                          {" · "}
                          <span className="text-blush-600 font-medium">
                            ${monthlyAmount(bill.amount, bill.cadence).toFixed(2)}/mo
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ${bill.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {CADENCE_LABEL[bill.cadence]}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 flex-shrink-0 text-muted-foreground hover:bg-blush-50 hover:text-blush-600",
                          deletingId === bill.id && "opacity-50"
                        )}
                        onClick={() => handleDelete(bill.id)}
                        disabled={deletingId === bill.id}
                        aria-label="Delete bill"
                      >
                        {deletingId === bill.id ? (
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
    </div>
  );
}
