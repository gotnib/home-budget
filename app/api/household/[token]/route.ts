import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const settings = await prisma.budgetSettings.findFirst({ where: { shareToken: token } });
    if (!settings) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const userId = settings.userId;
    const [incomes, bills] = await Promise.all([
      prisma.income.findMany({ where: { userId } }),
      prisma.bill.findMany({ where: { userId } }),
    ]);

    const monthlyIncome = incomes.reduce((s, i) => s + normalizeToMonthly(i.amount, i.cadence), 0);
    const fixedBills = bills.reduce((s, b) => s + normalizeToMonthly(b.amount, b.cadence), 0);
    const { groceryBudget, flexibleBudget } = calculateGroceryBudget({
      monthlyIncome,
      fixedBills,
      savingsGoal: settings.savingsGoal,
      groceryPercent: settings.groceryPercent,
    });
    const safeToSpend = Math.max(0, flexibleBudget - groceryBudget);

    return NextResponse.json({
      displayName: settings.displayName,
      monthlyIncome: Math.round(monthlyIncome),
      fixedBills: Math.round(fixedBills),
      savingsGoal: settings.savingsGoal,
      groceryBudget: Math.round(groceryBudget),
      safeToSpend: Math.round(safeToSpend),
      billCount: bills.length,
      incomeCount: incomes.length,
    });
  } catch (error) {
    console.error("Household share GET error:", error);
    return NextResponse.json({ error: "Failed to load household" }, { status: 500 });
  }
}
