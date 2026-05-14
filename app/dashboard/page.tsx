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
import { Building2, ChevronRight } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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

  const plannedCount = groceryItems.filter((g) => g.status === "planned").length;

  const quickLinks = [
    {
      href: "/groceries",
      emoji: "🛒",
      bg: "bg-lavender-100",
      label: "Build Grocery List",
      sub: `${plannedCount} item${plannedCount === 1 ? "" : "s"} planned`,
    },
    {
      href: "/bills",
      emoji: "📋",
      bg: "bg-blush-100",
      label: "Manage Bills",
      sub: `${bills.length} recurring bill${bills.length === 1 ? "" : "s"}`,
    },
    {
      href: "/budget",
      emoji: "💰",
      bg: "bg-sage-100",
      label: "Adjust Budget",
      sub: `Grocery at ${groceryPercent}% of flexible`,
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <Navbar userEmail={user.email} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {getGreeting()}{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Here&apos;s your cozy budget check.
          </p>
        </div>

        {/* Bank connection banner */}
        {plaidItems.length === 0 && (
          <Link
            href="/settings"
            className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-lavender-50 to-lavender-100 px-5 py-4 ring-1 ring-lavender-200 hover:ring-lavender-300 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender-200 text-lavender-700 flex-shrink-0">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-lavender-900 text-sm sm:text-base">
                  Connect your bank to auto-import
                </p>
                <p className="text-xs text-lavender-600 sm:text-sm">
                  Plaid securely syncs income and recurring bills
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-lavender-400 group-hover:text-lavender-600 transition-colors flex-shrink-0" />
          </Link>
        )}

        {/* Stat cards — 2-col on mobile, 4-col on lg */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <IncomeCard amount={monthlyIncome} count={incomes.length} />
          <BillCard total={fixedBills} bills={billsForCard} />
          <GroceryBudgetCard budget={groceryBudget} spent={grocerySpent} />
          <div className="col-span-2 lg:col-span-1">
            <BudgetSummary
              monthlyIncome={monthlyIncome}
              fixedBills={fixedBills}
              groceryBudget={groceryBudget}
              groceryPercent={groceryPercent}
            />
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Quick actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickLinks.map(({ href, emoji, bg, label, sub }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-cream-200 transition-all hover:shadow-md hover:ring-cream-300 active:scale-[0.98]"
              >
                <span
                  className={[
                    "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl transition-transform group-hover:scale-110",
                    bg,
                  ].join(" ")}
                >
                  {emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
