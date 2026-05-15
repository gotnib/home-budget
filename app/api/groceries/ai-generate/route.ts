import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";
import type { MealPlan } from "../meal-plan/route";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { mealPlan }: { mealPlan: MealPlan } = body;
    if (!mealPlan) return NextResponse.json({ error: "mealPlan is required" }, { status: 400 });

    const [incomes, bills, budgetSettings] = await Promise.all([
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.bill.findMany({ where: { userId: user.id } }),
      prisma.budgetSettings.findUnique({ where: { userId: user.id } }),
    ]);

    const monthlyIncome = incomes.reduce((s, i) => s + normalizeToMonthly(i.amount, i.cadence), 0);
    const fixedBills = bills.reduce((s, b) => s + normalizeToMonthly(b.amount, b.cadence), 0);
    const groceryPercent = budgetSettings?.groceryPercent ?? 25;
    const savingsGoal = budgetSettings?.savingsGoal ?? 0;
    const { groceryBudget } = calculateGroceryBudget({ monthlyIncome, fixedBills, savingsGoal, groceryPercent });

    const budgetContext = groceryBudget > 0
      ? `The household grocery budget is approximately $${groceryBudget.toFixed(0)}/month.`
      : "";

    const mealsText = mealPlan.weeks.flatMap((w) =>
      w.days.map((d) => `${d.day}: B: ${d.breakfast} | L: ${d.lunch} | D: ${d.dinner}`)
    ).join("\n");

    const peopleDesc = [
      mealPlan.adults > 0 ? `${mealPlan.adults} adult${mealPlan.adults > 1 ? "s" : ""}` : "",
      mealPlan.kids > 0 ? `${mealPlan.kids} child${mealPlan.kids > 1 ? "ren" : ""}` : "",
    ].filter(Boolean).join(" and ");

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Generate a consolidated grocery shopping list for ${peopleDesc} based on this ${mealPlan.totalDays}-day meal plan. ${budgetContext}

Meal plan:
${mealsText}

Rules:
- Consolidate ingredients across all meals (e.g. one "Pasta 2lb" not separate entries per meal)
- Include staples and pantry items needed (oils, spices, condiments)
- Realistic US grocery quantities and prices
- 20-35 items total

Respond ONLY with a JSON array (no markdown, no explanation):
[{"name": "string", "quantity": number, "estimatedPrice": number}]

- name: clear grocery item (e.g. "Ground Beef 2lb", "Pasta 1lb", "Olive Oil")
- quantity: units to buy
- estimatedPrice: price per unit in USD`,
        },
      ],
    });

    let suggestions: { name: string; quantity: number; estimatedPrice: number }[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const start = raw.indexOf("[");
        const end = raw.lastIndexOf("]");
        if (start !== -1 && end !== -1) {
          suggestions = JSON.parse(raw.slice(start, end + 1));
        }
        break;
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json({ error: "Failed to generate list" }, { status: 500 });
  }
}
