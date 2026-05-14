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
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [incomes, bills, groceryItems, plaidItems, budgetSettings] =
    await Promise.all([
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.bill.findMany({ where: { userId: user.id } }),
      prisma.groceryItem.findMany({ where: { userId: user.id } }),
      prisma.plaidItem.findMany({ where: { userId: user.id } }),
      prisma.budgetSettings.findUnique({ where: { userId: user.id } }),
    ]);

  const monthlyIncome = incomes.reduce((s, i) => s + normalizeToMonthly(i.amount, i.cadence), 0);
  const fixedBills = bills.reduce((s, b) => s + normalizeToMonthly(b.amount, b.cadence), 0);
  const groceryPercent = budgetSettings?.groceryPercent ?? 25;
  const savingsGoal = budgetSettings?.savingsGoal ?? 0;

  const { groceryBudget } = calculateGroceryBudget({ monthlyIncome, fixedBills, savingsGoal, groceryPercent });

  const grocerySpent = groceryItems
    .filter((g) => g.status === "purchased")
    .reduce((s, g) => s + (g.estimatedPrice ?? 0) * g.quantity, 0);

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
      ring: "ring-lavender-200",
      hover: "hover:ring-lavender-300 hover:bg-lavender-50",
      label: "Build Grocery List",
      sub: `${plannedCount} item${plannedCount === 1 ? "" : "s"} planned`,
    },
    {
      href: "/bills",
      emoji: "📋",
      bg: "bg-blush-100",
      ring: "ring-blush-200",
      hover: "hover:ring-blush-300 hover:bg-blush-50",
      label: "Manage Bills",
      sub: `${bills.length} recurring bill${bills.length === 1 ? "" : "s"}`,
    },
    {
      href: "/budget",
      emoji: "💰",
      bg: "bg-honey-100",
      ring: "ring-honey-200",
      hover: "hover:ring-honey-300 hover:bg-honey-50",
      label: "Adjust Budget",
      sub: `Grocery at ${groceryPercent}% of flexible`,
    },
  ];

  return (
    <div className="min-h-screen page-gradient">
      <Navbar userEmail={user.email} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">

        {/* Greeting */}
        <div className="animate-fade-up">
          <p className="section-label mb-1">Dashboard</p>
          <h1 className="page-title">
            {getGreeting()}{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your cozy budget check.
          </p>
        </div>

        {/* Bank connect banner */}
        {plaidItems.length === 0 && (
          <Link
            href="/settings"
            className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-lavender-50 to-lavender-100/70 px-5 py-4 ring-1 ring-lavender-200 transition-all duration-250 hover:shadow-soft hover:ring-lavender-300 animate-fade-up delay-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-lavender-200 text-lavender-700 transition-transform duration-300 group-hover:scale-110">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-lavender-900 text-sm sm:text-base">
                  Connect your bank to auto-import
                </p>
                <p className="text-xs text-lavender-600 sm:text-sm">
                  Plaid securely syncs income and recurring bills
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-lavender-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-lavender-600" />
          </Link>
        )}

        {/* Stat cards — staggered entrance */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="animate-fade-up delay-100">
            <IncomeCard amount={monthlyIncome} count={incomes.length} />
          </div>
          <div className="animate-fade-up delay-150">
            <BillCard total={fixedBills} bills={billsForCard} />
          </div>
          <div className="animate-fade-up delay-200">
            <GroceryBudgetCard budget={groceryBudget} spent={grocerySpent} />
          </div>
          <div className="col-span-2 lg:col-span-1 animate-fade-up delay-250">
            <BudgetSummary
              monthlyIncome={monthlyIncome}
              fixedBills={fixedBills}
              groceryBudget={groceryBudget}
              groceryPercent={groceryPercent}
            />
          </div>
        </div>

        {/* Quick links */}
        <div className="animate-fade-up delay-300">
          <p className="section-label mb-3">Quick actions</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickLinks.map(({ href, emoji, bg, ring, hover, label, sub }, i) => (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3.5 rounded-2xl bg-white p-4 ring-1 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 ${ring} ${hover}`}
                style={{ animationDelay: `${300 + i * 50}ms` }}
              >
                <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110 ${bg}`}>
                  {emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-muted-foreground/70" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
