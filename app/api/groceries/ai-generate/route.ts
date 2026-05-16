import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";
import { getHouseholdContext } from "@/lib/household";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;
import type { MealPlan } from "../meal-plan/route";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!checkRateLimit(user.id, 10, 60 * 60 * 1000))
      return NextResponse.json({ error: "Too many requests — please wait before generating another list." }, { status: 429 });

    const body = await request.json();
    const { mealPlan }: { mealPlan: MealPlan } = body;
    if (!mealPlan) return NextResponse.json({ error: "mealPlan is required" }, { status: 400 });

    const { ownerId } = await getHouseholdContext(user.id);
    const [incomes, bills, budgetSettings] = await Promise.all([
      prisma.income.findMany({ where: { userId: ownerId } }),
      prisma.bill.findMany({ where: { userId: ownerId } }),
      prisma.budgetSettings.findUnique({ where: { userId: ownerId } }),
    ]);

    const monthlyIncome = incomes.reduce((s, i) => s + normalizeToMonthly(i.amount, i.cadence), 0);
    const fixedBills = bills.reduce((s, b) => s + normalizeToMonthly(b.amount, b.cadence), 0);
    const groceryPercent = budgetSettings?.groceryPercent ?? 25;
    const savingsGoal = budgetSettings?.savingsGoal ?? 0;
    const { groceryBudget } = calculateGroceryBudget({ monthlyIncome, fixedBills, savingsGoal, groceryPercent });

    const effectiveBudget = mealPlan.budget ?? (groceryBudget > 0 ? groceryBudget : null);
    const budgetLine = effectiveBudget
      ? `The total grocery budget for this shopping trip is $${effectiveBudget.toFixed(2)}.`
      : "";
    const storeLine = mealPlan.store
      ? `Shopping at ${mealPlan.store} — use realistic pricing for that store.`
      : "Use realistic US grocery store prices.";

    const peopleDesc = [
      mealPlan.adults > 0 ? `${mealPlan.adults} adult${mealPlan.adults > 1 ? "s" : ""}` : "",
      mealPlan.kids > 0 ? `${mealPlan.kids} child${mealPlan.kids > 1 ? "ren" : ""}` : "",
    ].filter(Boolean).join(" and ");

    const mealsText = mealPlan.weeks
      .flatMap((w) => w.days.map((d) => `${d.day}: B: ${d.breakfast} | L: ${d.lunch} | D: ${d.dinner}`))
      .join("\n");

    const budgetRule = effectiveBudget
      ? `\n- CRITICAL BUDGET RULE: The sum of (quantity x estimatedPrice) for ALL items MUST be <= $${effectiveBudget.toFixed(2)}. Before responding, calculate your running total. If you exceed the budget, reduce quantities, swap expensive ingredients for cheaper ones (e.g. chicken thighs instead of breast, canned instead of fresh, store brand), or remove non-essential items. Do NOT return a list that exceeds $${effectiveBudget.toFixed(2)}.`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `You are building a grocery list for ${peopleDesc} based on a ${mealPlan.totalDays}-day meal plan. ${budgetLine} ${storeLine}

Meal plan:
${mealsText}

STEP 1 — For every meal listed above, mentally recall the full recipe: every ingredient, every sauce, every spice, every grain, every produce item, every protein, every dairy item. Treat each meal as if you are writing out the actual recipe.

STEP 2 — Consolidate all ingredients across all meals into a single shopping list.

WHAT TO INCLUDE (default: include everything unless explicitly listed below as a skip):
- All fresh produce, meats, seafood, and dairy called for in the recipes
- Grains, pasta, rice, bread, tortillas, noodles
- Canned goods: diced tomatoes, beans, broth/stock, coconut milk, tomato paste, sauces
- Specific oils needed (sesame oil, coconut oil, olive oil — include if any recipe calls for it)
- ALL spices and seasonings that a recipe specifically calls for (cumin, paprika, turmeric, oregano, thyme, chili powder, garlic powder, onion powder, soy sauce, fish sauce, Worcestershire, hot sauce, etc.)
- Condiments and sauces specific to recipes (salsa, hoisin, oyster sauce, tahini, etc.)
- Baking ingredients for any baked item in the plan
- Fresh aromatics: garlic, onions, ginger, shallots, fresh herbs
- Eggs, butter, cheese if any recipe calls for them

WHAT TO SKIP (only these truly universal items most households already have):
- Table salt and plain black pepper
- Plain water
- Cooking spray (only skip if a neutral oil is already on the list)

Scale all quantities for ${peopleDesc} across the full ${mealPlan.totalDays} days. Consolidate duplicates (e.g. if 5 meals use garlic, one "Garlic (bulb)" entry covers all of them).${budgetRule}

Respond ONLY with a JSON array (no markdown, no explanation):
[{"name": "string", "quantity": number, "estimatedPrice": number}]

- name: clear item with size/weight where helpful (e.g. "Ground Beef 2lb", "Whole Milk 1gal", "Crushed Red Pepper Flakes")
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

    // Server-side budget enforcement: trim until total <= budget
    if (effectiveBudget && suggestions.length > 0) {
      const total = () => suggestions.reduce((s, i) => s + i.quantity * i.estimatedPrice, 0);
      while (total() > effectiveBudget + 0.01 && suggestions.length > 0) {
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
