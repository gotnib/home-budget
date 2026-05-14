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
import { Building2, ChevronRight, PiggyBank, Sparkles } from "lucide-react";

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
  const flexibleLeft = Math.max(0, monthlyIncome - fixedBills - groceryBudget);
  const groceryProgress = groceryBudget > 0 ? Math.min(100, (grocerySpent / groceryBudget) * 100) : 0;
  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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
      label: "Build grocery list",
      sub: `${plannedCount} item${plannedCount === 1 ? "" : "s"} planned`,
    },
    {
      href: "/bills",
      emoji: "📋",
      bg: "bg-blush-100",
      ring: "ring-blush-200",
      hover: "hover:ring-blush-300 hover:bg-blush-50",
      label: "Tidy up bills",
      sub: `${bills.length} recurring bill${bills.length === 1 ? "" : "s"}`,
    },
    {
      href: "/budget",
      emoji: "🍯",
      bg: "bg-honey-100",
      ring: "ring-honey-200",
      hover: "hover:ring-honey-300 hover:bg-honey-50",
      label: "Tune budget jars",
      sub: `Groceries set to ${groceryPercent}%`,
    },
  ];

  const heroStats = [
    { label: "Income jar", value: fmt(monthlyIncome), tone: "bg-white/70 text-sage-800 ring-sage-200" },
    { label: "Bills tucked away", value: fmt(fixedBills), tone: "bg-white/70 text-blush-800 ring-blush-200" },
    { label: "Flexible honey", value: fmt(flexibleLeft), tone: "bg-white/70 text-honey-800 ring-honey-200" },
  ];

  return (
    <div className="min-h-screen page-gradient">
      <Navbar userEmail={user.email} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="cute-panel p-5 sm:p-7 lg:p-8 animate-fade-up">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-honey-700 ring-1 ring-honey-200 shadow-soft">
                <Sparkles className="h-3.5 w-3.5" />
                Cozy honey budget
              </div>

              <div>
                <p className="font-serif text-lg italic text-muted-foreground">{getGreeting()}</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  {userName ? `${userName}'s` : "Your"} money hive is buzzing 🐝
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  A warm snapshot of what is coming in, what is already spoken for, and how much honey is still flexible this month.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className={`rounded-2xl p-4 shadow-soft ring-1 backdrop-blur-sm ${stat.tone}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black tabular tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white/80 p-5 shadow-soft ring-1 ring-cream-200/80 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="section-label">Grocery jar</p>
                  <p className="mt-1 text-sm text-muted-foreground">Spent {fmt(grocerySpent)} of {fmt(groceryBudget)}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-honey-100 text-honey-700 ring-1 ring-honey-200">
                  <PiggyBank className="h-5 w-5" />
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-cream-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-honey-300 via-honey-400 to-blush-400 transition-all duration-700 ease-spring"
                  style={{ width: `${groceryProgress}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                {plannedCount} planned item{plannedCount === 1 ? "" : "s"} waiting in your cart.
              </p>
            </div>
          </div>
        </section>

        {/* Bank connect banner */}
        {plaidItems.length === 0 && (
          <Link
            href="/settings"
            className="group flex items-center justify-between rounded-[1.5rem] bg-white/90 px-5 py-4 shadow-soft ring-1 ring-lavender-200 transition-all duration-250 hover:-translate-y-0.5 hover:shadow-soft-lg hover:ring-lavender-300 animate-fade-up delay-50"
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
        <section className="animate-fade-up delay-300">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Quick actions</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">Keep the hive tidy</h2>
            </div>
          </div>
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
        </section>
      </main>
    </div>
  );
}
