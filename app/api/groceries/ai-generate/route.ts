import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";
import type { MealPlan } from "../meal-plan/route";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Suggestion = {
  name: string;
  quantity: number;
  estimatedPrice: number;
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mealPlan }: { mealPlan: MealPlan } = body;
    if (!mealPlan) return NextResponse.json({ error: "mealPlan is required" }, { status: 400 });
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const [incomes, bills, budgetSettings] = await Promise.all([
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.bill.findMany({ where: { userId: user.id } }),
      prisma.budgetSettings.findUnique({ where: { userId: user.id } }),
    ]);

    const monthlyIncome = incomes.reduce(
      (s, i) => s + normalizeToMonthly(i.amount, i.cadence),
      0
    );

    const fixedBills = bills.reduce(
      (s, b) => s + normalizeToMonthly(b.amount, b.cadence),
      0
    );

    const groceryPercent = budgetSettings?.groceryPercent ?? 25;
    const savingsGoal = budgetSettings?.savingsGoal ?? 0;

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
    const { groceryBudget } = calculateGroceryBudget({
      monthlyIncome,
      fixedBills,
      savingsGoal,
      groceryPercent,
    });

    const budgetContext =
      groceryBudget > 0
        ? `The household has a monthly grocery budget of $${groceryBudget.toFixed(2)}.`
        : "No specific grocery budget is set.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1200,
      system:
        "You are a practical family grocery planner inside HoneyCart. Return only valid JSON. Do not use markdown.",
      messages: [
        {
          role: "user",
          content: `Use this budget context: ${budgetContext}

User request: ${prompt}

Build a realistic grocery list.

Return ONLY a JSON array in this exact format:
[{"name":"string","quantity":1,"estimatedPrice":1.99}]

Rules:
- Include 10 to 20 items.
- Use specific amount of people if mentioned as a reference.
- Use realistic current US grocery prices.
- Make the list cohesive and realistic.
- Keep names short and clear.
- estimatedPrice is price per unit.
- quantity must be a number.
- Do not include markdown.
- If request is not related to grocery list, respond with "invalid entry".
- Do not include explanation.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");

    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No text response from Claude" }, { status: 500 });
    }

    const raw = textBlock.text.trim();
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");

    if (start === -1 || end === -1) {
      return NextResponse.json({ error: "Claude returned invalid JSON" }, { status: 500 });
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
    const parsed = JSON.parse(raw.slice(start, end + 1));

    const suggestions: Suggestion[] = Array.isArray(parsed)
      ? parsed
          .filter(
            (item) =>
              item &&
              typeof item.name === "string" &&
              typeof item.quantity === "number" &&
              typeof item.estimatedPrice === "number"
          )
          .slice(0, 20)
      : [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Honey generate error:", error);
    return NextResponse.json({ error: "Failed to generate list" }, { status: 500 });
  }
}
