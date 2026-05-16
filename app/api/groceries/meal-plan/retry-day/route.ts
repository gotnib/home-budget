import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";
import type { MealDay } from "../route";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!checkRateLimit(user.id, 40, 60 * 60 * 1000))
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const body = await request.json();
    const { dayName, adults = 2, kids = 0, store = "", budget = null, existingMeals = [] } = body;
    if (!dayName) return NextResponse.json({ error: "dayName is required" }, { status: 400 });

    const peopleDesc = [
      adults > 0 ? `${adults} adult${adults > 1 ? "s" : ""}` : "",
      kids > 0 ? `${kids} child${kids > 1 ? "ren" : ""}` : "",
    ].filter(Boolean).join(" and ");

    const avoidList = (existingMeals as string[]).filter(Boolean).slice(0, 30).join(", ");
    const budgetLine = budget ? ` Keep costs appropriate for a $${Number(budget).toFixed(0)} weekly grocery budget.` : "";
    const storeLine  = store  ? ` Shopping at ${store}.` : "";
    const avoidLine  = avoidList ? `\n\nAvoid repeating these meals already in the plan: ${avoidList}.` : "";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Suggest 3 fresh meals for ${dayName} for a household of ${peopleDesc}.${budgetLine}${storeLine}${avoidLine}

Rules:
- Never use "Leftovers" or any leftover variation
- Practical, family-friendly meals
- Variety: one breakfast, one lunch, one dinner

Respond ONLY with JSON (no markdown):
{"breakfast": "...", "lunch": "...", "dinner": "..."}

Keep meal names short (3-5 words max each).`,
      }],
    });

    let day: Omit<MealDay, "day"> | null = null;
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const start = raw.indexOf("{");
        const end   = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          day = JSON.parse(raw.slice(start, end + 1));
        }
        break;
      }
    }

    if (!day) return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });

    return NextResponse.json({ day: { ...day, day: dayName } });
  } catch (error) {
    console.error("Retry day error:", error);
    return NextResponse.json({ error: "Failed to regenerate day" }, { status: 500 });
  }
}
