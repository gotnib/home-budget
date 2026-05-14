import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";
import { Navbar } from "@/components/layout/Navbar";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { IncomeCard } from "@/components/dashboard/IncomeCard";
import { BillCard } from "@/components/dashboard/BillCard";
import { GroceryBudgetCard } from "@/components/dashboard/GroceryBudgetCard";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

function getGreeting(name: string | null | undefined) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const displayName = name ?? "there";
  return `Good ${part}, ${displayName}!`;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [incomes, bills, groceryItems, plaidItems, budgetSettings] =
    await Promise.all([
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.bill.findMany({ where: { userId: user.id } }),
      prisma.groceryItem.findMany({ where: { userId: user.id } }),
      prisma.plaidItem.findMany({ where: { userId: user.id } }),
      prisma.budgetSettings.findUnique({ where: { userId: user.id } }),
    ]);

  const monthlyIncome = incomes.reduce(
    (sum, i) => sum + normalizeToMonthly(i.amount, i.cadence),
    0
  );
  const fixedBills = bills.reduce(
    (sum, b) => sum + normalizeToMonthly(b.amount, b.cadence),
    0
  );

  const groceryPercent = budgetSettings?.groceryPercent ?? 25;
  const savingsGoal = budgetSettings?.savingsGoal ?? 0;

  const { groceryBudget } = calculateGroceryBudget({
    monthlyIncome,
    fixedBills,
    savingsGoal,
    groceryPercent,
  });

  const grocerySpent = groceryItems
    .filter((g) => g.status === "purchased")
    .reduce((sum, g) => sum + (g.estimatedPrice ?? 0) * g.quantity, 0);

  const userName = user.email?.split("@")[0] ?? null;

  const billsForCard = bills.map((b) => ({
    name: b.name,
    amount: normalizeToMonthly(b.amount, b.cadence),
    dueDay: b.dueDay,
  }));

  return (
    <div className="min-h-screen bg-cream">
      <Navbar userEmail={user.email} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {getGreeting(userName)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s your cozy budget check.
          </p>
        </div>

        {/* Bank connection banner */}
        {plaidItems.length === 0 && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-lavender-50 px-5 py-4 ring-1 ring-lavender-200">
            <div>
              <p className="font-medium text-lavender-800">
                Connect your bank to auto-import transactions
              </p>
              <p className="text-sm text-lavender-600">
                Plaid securely syncs your income and recurring bills.
              </p>
            </div>
            <Link href="/settings">
              <Button variant="lavender" className="gap-2 whitespace-nowrap">
                <Building2 className="h-4 w-4" />
                Connect Bank
              </Button>
            </Link>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <IncomeCard amount={monthlyIncome} count={incomes.length} />
          <BillCard total={fixedBills} bills={billsForCard} />
          <GroceryBudgetCard budget={groceryBudget} spent={grocerySpent} />
          <div className="sm:col-span-2 lg:col-span-1">
            <BudgetSummary
              monthlyIncome={monthlyIncome}
              fixedBills={fixedBills}
              groceryBudget={groceryBudget}
              groceryPercent={groceryPercent}
            />
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link
            href="/groceries"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200 transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender-100 text-xl">
              🛒
            </span>
            <div>
              <p className="font-medium text-foreground">Build Grocery List</p>
              <p className="text-sm text-muted-foreground">
                {groceryItems.filter((g) => g.status === "planned").length} items planned
              </p>
            </div>
          </Link>
          <Link
            href="/bills"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200 transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush-100 text-xl">
              📋
            </span>
            <div>
              <p className="font-medium text-foreground">Manage Bills</p>
              <p className="text-sm text-muted-foreground">
                {bills.length} recurring bills
              </p>
            </div>
          </Link>
          <Link
            href="/budget"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200 transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-xl">
              💰
            </span>
            <div>
              <p className="font-medium text-foreground">Adjust Budget</p>
              <p className="text-sm text-muted-foreground">
                Grocery at {groceryPercent}% of flexible
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
