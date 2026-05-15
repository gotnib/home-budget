import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { normalizeToMonthly, calculateGroceryBudget } from "@/lib/budget";

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
    console.error("AI generate error:", error);
    return NextResponse.json({ error: "Failed to generate list" }, { status: 500 });
  }
}
