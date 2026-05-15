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
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { Building2, ChevronRight, PiggyBank, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [incomes, bills, groceryItems, plaidItems, budgetSettings] = await Promise.all([
    prisma.income.findMany({ where: { userId: user.id } }),
    prisma.bill.findMany({ where: { userId: user.id } }),
    prisma.groceryItem.findMany({ where: { userId: user.id } }),
    prisma.plaidItem.findMany({ where: { userId: user.id } }),
    prisma.budgetSettings.findUnique({ where: { userId: user.id } }),
  ]);

  const monthlyIncome  = incomes.reduce((s, i) => s + normalizeToMonthly(i.amount, i.cadence), 0);
  const fixedBills     = bills.reduce((s, b) => s + normalizeToMonthly(b.amount, b.cadence), 0);
  const groceryPercent = budgetSettings?.groceryPercent ?? 25;
  const savingsGoal    = budgetSettings?.savingsGoal ?? 0;
  const { groceryBudget } = calculateGroceryBudget({ monthlyIncome, fixedBills, savingsGoal, groceryPercent });

  const grocerySpent  = groceryItems.filter((g) => g.status === "purchased").reduce((s, g) => s + (g.estimatedPrice ?? 0) * g.quantity, 0);
  const flexibleLeft  = Math.max(0, monthlyIncome - fixedBills - groceryBudget);
  const groceryProgress = groceryBudget > 0 ? Math.min(100, (grocerySpent / groceryBudget) * 100) : 0;
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const userName    = user.email?.split("@")[0] ?? null;
  const billsForCard = bills.map((b) => ({ name: b.name, amount: normalizeToMonthly(b.amount, b.cadence), dueDay: b.dueDay }));
  const plannedCount = groceryItems.filter((g) => g.status === "planned").length;

  const quickLinks = [
    { href: "/groceries", emoji: "🛒", variant: "lavender" as const, label: "Build grocery list",  sub: `${plannedCount} item${plannedCount === 1 ? "" : "s"} planned` },
    { href: "/bills",     emoji: "📋", variant: "blush"    as const, label: "Tidy up bills",       sub: `${bills.length} recurring bill${bills.length === 1 ? "" : "s"}` },
    { href: "/budget",    emoji: "🍯", variant: "honey"    as const, label: "Tune budget jars",    sub: `Groceries set to ${groceryPercent}%` },
  ];

  const heroStats = [
    { label: "Income jar",       value: fmt(monthlyIncome), variant: "sage"  as const },
    { label: "Bills tucked away", value: fmt(fixedBills),   variant: "blush" as const },
    { label: "Flexible honey",   value: fmt(flexibleLeft),  variant: "honey" as const },
  ];

  return (
    <div className="app-layout">
      <Navbar userEmail={user.email} />

      <main className="page-container">
        {/* Hero panel */}
        <section className="cute-panel animate-fade-up">
          <div className="dash-hero dash-hero-grid">
            <div>
              <div className="dash-hero-tag">
                <Sparkles style={{ width: "0.875rem", height: "0.875rem" }} />
                Cozy honey budget
              </div>

              <DashboardGreeting fallbackName={userName} />
              <p className="dash-hero-sub">
                A warm snapshot of what is coming in, what is already spoken for, and how much honey is still flexible this month.
              </p>

              <div className="dash-stats-grid">
                {heroStats.map((stat) => (
                  <div key={stat.label} className={`stat-mini stat-mini--${stat.variant}`}>
                    <p className="stat-mini-label">{stat.label}</p>
                    <p className="stat-mini-value">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grocery-jar">
              <div className="grocery-jar-head">
                <div>
                  <p className="section-label">Grocery jar</p>
                  <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "var(--color-muted)" }}>
                    Spent {fmt(grocerySpent)} of {fmt(groceryBudget)}
                  </p>
                </div>
                <span className="icon-pill icon-pill--honey icon-pill--md">
                  <PiggyBank style={{ width: "1.25rem", height: "1.25rem" }} />
                </span>
              </div>
              <div className="progress-track progress-track--lg">
                <div className="progress-fill progress-fill--honey-blush" style={{ width: `${groceryProgress}%` }} />
              </div>
              <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                {plannedCount} planned item{plannedCount === 1 ? "" : "s"} waiting in your cart.
              </p>
            </div>
          </div>
        </section>

        {/* Bank connect banner */}
        {plaidItems.length === 0 && (
          <Link href="/settings" className="bank-banner animate-fade-up delay-50">
            <div className="bank-banner-left">
              <span className="icon-pill icon-pill--lavender icon-pill--md" style={{ transition: "transform 0.3s" }}>
                <Building2 style={{ width: "1.25rem", height: "1.25rem" }} />
              </span>
              <div>
                <p className="bank-banner-title">Connect your bank to auto-import</p>
                <p className="bank-banner-sub">Plaid securely syncs income and recurring bills</p>
              </div>
            </div>
            <ChevronRight style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0, color: "var(--lavender-400)", transition: "transform 0.2s" }} />
          </Link>
        )}

        {/* Stat cards */}
        <div className="stat-grid">
          <div className="animate-fade-up delay-100"><IncomeCard amount={monthlyIncome} count={incomes.length} /></div>
          <div className="animate-fade-up delay-150"><BillCard total={fixedBills} bills={billsForCard} /></div>
          <div className="animate-fade-up delay-200"><GroceryBudgetCard budget={groceryBudget} spent={grocerySpent} /></div>
          <div className="stat-grid-wide animate-fade-up delay-250">
            <BudgetSummary monthlyIncome={monthlyIncome} fixedBills={fixedBills} groceryBudget={groceryBudget} groceryPercent={groceryPercent} />
          </div>
        </div>

        {/* Quick links */}
        <section className="animate-fade-up delay-300">
          <div style={{ marginBottom: "0.75rem" }}>
            <p className="section-label">Quick actions</p>
            <h2 style={{ marginTop: "0.25rem", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "-0.025em", color: "var(--color-fg)" }}>Keep the hive tidy</h2>
          </div>
          <div className="quick-links-grid">
            {quickLinks.map(({ href, emoji, variant, label, sub }) => (
              <Link key={href} href={href} className={`quick-link quick-link--${variant}`}>
                <span className={`quick-link-icon quick-link-icon--${variant}`}>{emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <p className="quick-link-label">{label}</p>
                  <p className="quick-link-sub">{sub}</p>
                </div>
                <ChevronRight className="quick-link-arrow" style={{ width: "1rem", height: "1rem" }} />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
