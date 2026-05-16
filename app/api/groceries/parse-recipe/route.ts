import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!checkRateLimit(user.id, 20, 60 * 60 * 1000))
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const { recipeText } = await request.json();
    if (!recipeText?.trim()) return NextResponse.json({ error: "recipeText is required" }, { status: 400 });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Extract all ingredients from this recipe and estimate a realistic US grocery store price for each.

Recipe:
${(recipeText as string).slice(0, 4000)}

Respond ONLY with JSON (no markdown):
{"ingredients": [{"item": "Chicken breast", "amount": "2 lbs", "estimatedPrice": 7.99}, ...]}

Rules:
- item: plain ingredient name only (e.g. "Chicken breast", "Olive oil", "Garlic")
- amount: exact quantity from recipe (e.g. "2 lbs", "1 cup", "3 cloves")
- estimatedPrice: realistic US price in dollars for that amount (number, not string)
- Skip water; include everything else even if pantry staples
- Combine duplicate ingredients`,
      }],
    });

    let result: { ingredients: { item: string; amount: string; estimatedPrice: number }[] } | null = null;
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          result = JSON.parse(raw.slice(start, end + 1));
        }
        break;
      }
    }

    if (!result?.ingredients) return NextResponse.json({ error: "Failed to parse recipe" }, { status: 500 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Parse recipe error:", error);
    return NextResponse.json({ error: "Failed to parse recipe" }, { status: 500 });
  }
}
