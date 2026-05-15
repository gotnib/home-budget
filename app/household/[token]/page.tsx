import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";
import { PiggyBank, Receipt, TrendingUp, Wallet, ShoppingCart, DollarSign } from "lucide-react";

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default async function HouseholdSharePage({ params }: { params: { token: string } }) {
  const { token } = params;

  const settings = await prisma.budgetSettings.findFirst({ where: { shareToken: token } });
  if (!settings) notFound();

  const userId = settings.userId;
  const [incomes, bills] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.bill.findMany({ where: { userId } }),
  ]);

  const monthlyIncome = incomes.reduce((s, i) => s + normalizeToMonthly(i.amount, i.cadence), 0);
  const fixedBills    = bills.reduce((s, b) => s + normalizeToMonthly(b.amount, b.cadence), 0);
  const { groceryBudget, flexibleBudget } = calculateGroceryBudget({
    monthlyIncome,
    fixedBills,
    savingsGoal: settings.savingsGoal,
    groceryPercent: settings.groceryPercent,
  });
  const safeToSpend = Math.max(0, flexibleBudget - groceryBudget);

  const householdName = settings.displayName ?? "Our household";

  const stats = [
    { label: "Monthly income",  value: fmt(monthlyIncome), icon: TrendingUp,   color: "var(--sage-600)" },
    { label: "Fixed bills",     value: fmt(fixedBills),    icon: Receipt,       color: "var(--blush-600)" },
    { label: "Grocery budget",  value: fmt(groceryBudget), icon: ShoppingCart,  color: "var(--honey-600)" },
    { label: "Savings goal",    value: fmt(settings.savingsGoal), icon: PiggyBank, color: "var(--lavender-600)" },
    { label: "Safe to spend",   value: fmt(safeToSpend),   icon: DollarSign,    color: "var(--sage-700)" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--cream-50)", fontFamily: "inherit" }}>
      <header style={{
        background: "white",
        borderBottom: "1px solid var(--cream-200)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}>
        <span style={{ width: "2rem", height: "2rem", background: "var(--honey-400)", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wallet style={{ width: "1rem", height: "1rem", color: "white" }} />
        </span>
        <div>
          <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-fg)", lineHeight: 1.2 }}>HoneyCart</p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>Shared budget snapshot</p>
        </div>
      </header>

      <main style={{ maxWidth: "480px", margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--honey-600)", marginBottom: "0.25rem" }}>
            Household budget
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--color-fg)", letterSpacing: "-0.025em" }}>{householdName}</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>
            Read-only monthly snapshot · {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{
              background: "white",
              borderRadius: "1rem",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <span style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem", background: "var(--cream-100)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: "1.25rem", height: "1.25rem", color }} />
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--color-fg)", letterSpacing: "-0.02em" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--honey-50)", borderRadius: "0.75rem", border: "1px solid var(--honey-200)" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--honey-700)", textAlign: "center" }}>
            This is a read-only view shared from HoneyCart. Numbers update automatically.
          </p>
        </div>
      </main>
    </div>
  );
}
