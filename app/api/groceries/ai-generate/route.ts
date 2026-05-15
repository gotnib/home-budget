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

    // Use the user-supplied budget if provided, otherwise fall back to calculated budget
    const effectiveBudget = mealPlan.budget ?? (groceryBudget > 0 ? groceryBudget : null);
    const budgetLine = effectiveBudget ? `The total grocery budget for this shopping trip is $${effectiveBudget.toFixed(2)}.` : "";
    const storeLine  = mealPlan.store ? `Shopping at ${mealPlan.store} — use realistic pricing for that store.` : "Use realistic US grocery store prices.";

    const peopleDesc = [
      mealPlan.adults > 0 ? `${mealPlan.adults} adult${mealPlan.adults > 1 ? "s" : ""}` : "",
      mealPlan.kids > 0 ? `${mealPlan.kids} child${mealPlan.kids > 1 ? "ren" : ""}` : "",
    ].filter(Boolean).join(" and ");

    const mealsText = mealPlan.weeks.flatMap((w) =>
      w.days.map((d) => `${d.day}: B: ${d.breakfast} | L: ${d.lunch} | D: ${d.dinner}`)
    ).join("\n");

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Generate a consolidated grocery shopping list for ${peopleDesc} based on this ${mealPlan.totalDays}-day meal plan. ${budgetLine} ${storeLine}

Meal plan:
${mealsText}

Rules:
- Consolidate ingredients across all meals (e.g. one "Pasta 1lb" not separate entries per meal)
- Include essential staples and pantry items needed (oils, spices, condiments, basics)
- Scale quantities to the household size (${peopleDesc})
- 20-35 items total${effectiveBudget ? `
- CRITICAL BUDGET RULE: The sum of (quantity × estimatedPrice) for ALL items MUST be ≤ $${effectiveBudget.toFixed(2)}. Before responding, calculate your running total. If you exceed the budget, reduce quantities, swap expensive ingredients for cheaper ones (e.g. chicken thighs instead of breast, canned instead of fresh, store brand), or remove non-essential items. Do NOT return a list that exceeds $${effectiveBudget.toFixed(2)}.` : ""}

Respond ONLY with a JSON array (no markdown, no explanation):
[{"name": "string", "quantity": number, "estimatedPrice": number}]

- name: clear item with size/weight where helpful (e.g. "Ground Beef 2lb", "Whole Milk 1gal")
- quantity: number of units to buy
- estimatedPrice: price per unit in USD (realistic for ${mealPlan.store || "a US grocery store"})`,
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

    // Server-side budget enforcement: trim list until total ≤ budget
    if (effectiveBudget && suggestions.length > 0) {
      const total = () => suggestions.reduce((s, i) => s + i.quantity * i.estimatedPrice, 0);
      while (total() > effectiveBudget + 0.01 && suggestions.length > 0) {
        // Sort by line total descending so we reduce the most expensive item first
        suggestions.sort((a, b) => b.quantity * b.estimatedPrice - a.quantity * a.estimatedPrice);
        const top = suggestions[0];
        if (top.quantity > 1) {
          top.quantity--;
        } else {
          suggestions.shift();
        }
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Honey generate error:", error);
    return NextResponse.json({ error: "Failed to generate list" }, { status: 500 });
  }
}
