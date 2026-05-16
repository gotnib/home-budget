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

    const avoidList = (existingMeals as string[]).filter(Boolean).slice(0, 60).join(", ");
    const budgetLine = budget ? ` Keep costs appropriate for a $${Number(budget).toFixed(0)} weekly grocery budget.` : "";
    const storeLine  = store  ? ` Shopping at ${store}.` : "";
    const avoidLine  = avoidList
      ? `\n\nMeals already in the plan (do NOT repeat any of these, and avoid using the same main protein as more than two of them):\n${avoidList}`
      : "";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Suggest 3 completely different meals for ${dayName} for a household of ${peopleDesc}.${budgetLine}${storeLine}${avoidLine}

Rules:
- NEVER repeat a meal name from the existing plan list above
- NEVER use "Leftovers" or any leftover variation
- NEVER suggest homemade pizza requiring scratch dough — if pizza is included it must use store-bought/premade dough and must say so in the name; otherwise skip pizza
- Breakfast: pick a style not already dominant (if eggs appear 2+ times already, try oatmeal, pancakes, yogurt parfait, avocado toast, french toast, smoothie bowl, breakfast burrito, etc.)
- Lunch: use a different format from existing lunches (if sandwiches dominate, choose a salad, soup, grain bowl, quesadilla, stir-fry, etc.)
- Dinner: use a cuisine style not already overrepresented (Italian, Mexican, Asian, Mediterranean, American, Indian, Greek, etc.)
- Practical, family-friendly meals

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
