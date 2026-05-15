import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";
import { getHouseholdContext } from "@/lib/household";
import { Navbar } from "@/components/layout/Navbar";
import { BudgetSummary } from "@/components/dashboard/BudgetSummary";
import { IncomeCard } from "@/components/dashboard/IncomeCard";
import { BillCard } from "@/components/dashboard/BillCard";
import { GroceryBudgetCard } from "@/components/dashboard/GroceryBudgetCard";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { Building2, ChevronRight, PiggyBank, Sparkles, AlertTriangle, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { role } = await getHouseholdContext(user.id);
  if (role === "hive") redirect("/groceries");

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
  const { groceryBudget, flexibleBudget } = calculateGroceryBudget({ monthlyIncome, fixedBills, savingsGoal, groceryPercent });
  const safeToSpend    = Math.max(0, flexibleBudget - groceryBudget);

  const grocerySpent    = groceryItems.filter((g) => g.status === "purchased").reduce((s, g) => s + (g.estimatedPrice ?? 0) * g.quantity, 0);
  const groceryProgress = groceryBudget > 0 ? Math.min(100, (grocerySpent / groceryBudget) * 100) : 0;
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Upcoming bills (due within 7 days, monthly only, not yet paid)
  const today = new Date();
  const todayDate = today.getDate();
  const upcomingBills = bills
    .filter((b) => {
      if (b.cadence !== "monthly" || b.dueDay == null) return false;
      if (b.paidAt) {
        const p = new Date(b.paidAt);
        if (p.getMonth() === today.getMonth() && p.getFullYear() === today.getFullYear()) return false;
      }
      const daysUntil = b.dueDay - todayDate;
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0));

  const overdueBills = bills.filter((b) => {
    if (b.cadence !== "monthly" || b.dueDay == null) return false;
    if (b.paidAt) {
      const p = new Date(b.paidAt);
      if (p.getMonth() === today.getMonth() && p.getFullYear() === today.getFullYear()) return false;
    }
    return b.dueDay < todayDate;
  });

  const userName     = user.email?.split("@")[0] ?? null;
  const billsForCard = bills.map((b) => ({ name: b.name, amount: normalizeToMonthly(b.amount, b.cadence), dueDay: b.dueDay }));
  const plannedCount = groceryItems.filter((g) => g.status === "planned").length;

  const quickLinks = [
    { href: "/groceries", emoji: "🛒", variant: "lavender" as const, label: "Build grocery list", sub: `${plannedCount} item${plannedCount === 1 ? "" : "s"} planned` },
    { href: "/bills",     emoji: "📋", variant: "blush"    as const, label: "Tidy up bills",      sub: `${bills.length} recurring bill${bills.length === 1 ? "" : "s"}` },
    { href: "/budget",    emoji: "💰", variant: "sage"     as const, label: "Review budget",      sub: "Income, bills & savings" },
  ];

  const heroStats = [
    { label: "Income jar",       value: fmt(monthlyIncome), variant: "sage"  as const },
    { label: "Bills tucked away", value: fmt(fixedBills),   variant: "blush" as const },
    { label: "Safe to spend",    value: fmt(safeToSpend),   variant: "honey" as const },
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

              <DashboardGreeting displayName={budgetSettings?.displayName ?? null} fallbackName={userName} />
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
              {savingsGoal > 0 && (
                <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <TrendingUp style={{ width: "0.875rem", height: "0.875rem", color: "var(--sage-600)" }} />
                  <p style={{ fontSize: "0.75rem", color: "var(--sage-700)", fontWeight: 600 }}>
                    Saving {fmt(savingsGoal)}/mo
                  </p>
                </div>
              )}
              <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                {plannedCount} planned item{plannedCount === 1 ? "" : "s"} waiting in your cart.
              </p>
            </div>
          </div>
        </section>

        {/* Overdue / upcoming bills strip */}
        {(overdueBills.length > 0 || upcomingBills.length > 0) && (
          <Link href="/bills" style={{ textDecoration: "none" }}>
            <section className="animate-fade-up delay-50" style={{
              background: overdueBills.length > 0 ? "var(--blush-50)" : "var(--honey-50)",
              border: `1px solid ${overdueBills.length > 0 ? "var(--blush-200)" : "var(--honey-200)"}`,
              borderRadius: "1rem",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <AlertTriangle style={{
                width: "1.125rem", height: "1.125rem", flexShrink: 0,
                color: overdueBills.length > 0 ? "var(--blush-600)" : "var(--honey-600)",
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {overdueBills.length > 0 && (
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--blush-800)" }}>
                    {overdueBills.length} overdue bill{overdueBills.length > 1 ? "s" : ""}: {overdueBills.slice(0, 2).map(b => b.name).join(", ")}{overdueBills.length > 2 ? ` +${overdueBills.length - 2} more` : ""}
                  </p>
                )}
                {upcomingBills.length > 0 && (
                  <p style={{ fontSize: "0.875rem", fontWeight: overdueBills.length > 0 ? 400 : 700, color: overdueBills.length > 0 ? "var(--blush-600)" : "var(--honey-800)", marginTop: overdueBills.length > 0 ? "0.125rem" : 0 }}>
                    {upcomingBills.length} bill{upcomingBills.length > 1 ? "s" : ""} due this week: {upcomingBills.slice(0, 2).map(b => `${b.name} (${(b.dueDay ?? 0) < todayDate + 1 ? "today" : `in ${(b.dueDay ?? 0) - todayDate}d`})`).join(", ")}{upcomingBills.length > 2 ? ` +${upcomingBills.length - 2} more` : ""}
                  </p>
                )}
              </div>
              <ChevronRight style={{ width: "1rem", height: "1rem", flexShrink: 0, color: "var(--color-muted)" }} />
            </section>
          </Link>
        )}

        {/* Bank connect banner */}
        {plaidItems.length === 0 && (
          <Link href="/settings" className="bank-banner animate-fade-up delay-50">
            <div className="bank-banner-left">
              <span className="icon-pill icon-pill--lavender icon-pill--md" style={{ transition: "transform 0.3s" }}>
                <Building2 style={{ width: "1.25rem", height: "1.25rem" }} />
              </span>
              <div>
                <p className="bank-banner-title">Connect your bank or add income manually</p>
                <p className="bank-banner-sub">Link via Plaid for auto-sync, or enter income on the Budget page</p>
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
