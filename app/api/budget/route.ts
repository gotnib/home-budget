import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [incomes, bills, budgetSettings] = await Promise.all([
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.bill.findMany({ where: { userId: user.id } }),
      prisma.budgetSettings.findUnique({ where: { userId: user.id } }),
    ]);

    const monthlyIncome = incomes.reduce(
      (sum, income) => sum + normalizeToMonthly(income.amount, income.cadence),
      0
    );

    const fixedBills = bills.reduce(
      (sum, bill) => sum + normalizeToMonthly(bill.amount, bill.cadence),
      0
    );

    const groceryPercent = budgetSettings?.groceryPercent ?? 25;
    const savingsGoal = budgetSettings?.savingsGoal ?? 0;

    const { flexibleBudget, groceryBudget } = calculateGroceryBudget({
      monthlyIncome,
      fixedBills,
      savingsGoal,
      groceryPercent,
    });

    return NextResponse.json({
      monthlyIncome,
      fixedBills,
      savingsGoal,
      flexibleBudget,
      groceryBudget,
      groceryPercent,
    });
  } catch (error) {
    console.error("Budget GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { groceryPercent, savingsGoal } = body;

    const updateData: { groceryPercent?: number; savingsGoal?: number } = {};
    if (groceryPercent !== undefined) {
      const pct = Number(groceryPercent);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json(
          { error: "groceryPercent must be between 0 and 100" },
          { status: 400 }
        );
      }
      updateData.groceryPercent = pct;
    }
    if (savingsGoal !== undefined) {
      const goal = Number(savingsGoal);
      if (isNaN(goal) || goal < 0) {
        return NextResponse.json(
          { error: "savingsGoal must be a non-negative number" },
          { status: 400 }
        );
      }
      updateData.savingsGoal = goal;
    }

    const settings = await prisma.budgetSettings.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        groceryPercent: updateData.groceryPercent ?? 25,
        savingsGoal: updateData.savingsGoal ?? 0,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Budget POST error:", error);
    return NextResponse.json(
      { error: "Failed to update budget settings" },
      { status: 500 }
    );
  }
}
