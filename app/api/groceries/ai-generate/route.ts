import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [cartItems, incomes, bills, budgetSettings] = await Promise.all([
      prisma.groceryItem.findMany({ where: { userId: user.id, status: "planned" } }),
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.bill.findMany({ where: { userId: user.id } }),
      prisma.budgetSettings.findUnique({ where: { userId: user.id } }),
    ]);

    const monthlyIncome = incomes.reduce(
      (sum, inc) => sum + normalizeToMonthly(inc.amount, inc.cadence), 0
    );
    const fixedBills = bills.reduce(
      (sum, b) => sum + normalizeToMonthly(b.amount, b.cadence), 0
    );
    const groceryPercent = budgetSettings?.groceryPercent ?? 25;
    const savingsGoal = budgetSettings?.savingsGoal ?? 0;
    const { groceryBudget } = calculateGroceryBudget({ monthlyIncome, fixedBills, savingsGoal, groceryPercent });

    const currentItems = cartItems.map((i) => `${i.name} (qty: ${i.quantity})`).join(", ") || "none";
    const budgetStr = groceryBudget > 0 ? `$${groceryBudget.toFixed(2)}` : "unknown";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a helpful family grocery planner. The user has a monthly grocery budget of ${budgetStr}.
Their current grocery list already contains: ${currentItems}.

Suggest 8-12 essential grocery items they likely still need for a typical family month. Focus on staples like produce, dairy, proteins, pantry items, and household essentials. Do NOT repeat items already in their list.

Respond ONLY with a JSON array (no markdown, no explanation) in this exact format:
[{"name": "string", "quantity": number, "estimatedPrice": number}]

Keep estimatedPrice realistic in USD. Keep names short and common (e.g. "Whole Milk", "Chicken Breast", "Bananas").`,
        },
      ],
    });

    let suggestions: { name: string; quantity: number; estimatedPrice: number }[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const jsonStr = raw.startsWith("[") ? raw : raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
        suggestions = JSON.parse(jsonStr);
        break;
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
