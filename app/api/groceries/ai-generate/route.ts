import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { prompt } = body;
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

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
      ? `The household has a monthly grocery budget of $${groceryBudget.toFixed(2)}.`
      : "No specific grocery budget is set.";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a helpful family grocery planner. ${budgetContext}

The user's request: "${prompt}"

Build a practical grocery list based on this request. Include realistic quantities and current US grocery store prices.

Respond ONLY with a JSON array (no markdown, no explanation) in this exact format:
[{"name": "string", "quantity": number, "estimatedPrice": number}]

- name: short and clear (e.g. "Whole Milk 1gal", "Chicken Breast 2lb", "Bananas")
- quantity: number of units to buy
- estimatedPrice: price per unit in USD (realistic grocery store price)
- Keep total within any budget mentioned in the request
- Include 10-20 items covering a realistic shopping trip`,
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
