import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MealDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface MealWeek {
  week: number;
  days: MealDay[];
}

export interface MealPlan {
  weeks: MealWeek[];
  totalDays: number;
  adults: number;
  kids: number;
  budget: number | null;
  store: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!checkRateLimit(user.id, 10, 60 * 60 * 1000))
      return NextResponse.json({ error: "Too many requests — please wait before generating another plan." }, { status: 429 });

    const body = await request.json();
    const { days = 7, adults = 2, kids = 0, notes = "", budget = null, store = "" } = body;

    const totalDays = Math.min(Math.max(1, Number(days)), 28);
    const weeks = Math.ceil(totalDays / 7);
    const peopleDesc = [
      adults > 0 ? `${adults} adult${adults > 1 ? "s" : ""}` : "",
      kids > 0 ? `${kids} child${kids > 1 ? "ren" : ""}` : "",
    ].filter(Boolean).join(" and ");

    const budgetLine = budget ? ` The grocery budget for this period is $${Number(budget).toFixed(2)}.` : "";
    const storeLine  = store  ? ` Shopping at ${store}.` : "";
    const dayNames   = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Create a ${totalDays}-day meal plan for a household of ${peopleDesc}.${budgetLine}${storeLine}${notes ? ` Additional notes: ${notes}` : ""}

VARIETY RULES (strictly enforced):
- NO meal name may appear more than once across the entire plan
- NO main protein (chicken, tuna, beef, pork, shrimp, eggs, etc.) more than twice per week
- Breakfast must rotate through at least 4 different base styles (e.g. eggs, oatmeal, pancakes/waffles, yogurt/fruit, smoothie, avocado toast, french toast, breakfast burritos, muffins/pastries) — never eggs two days in a row
- Lunch must vary daily — no sandwiches or wraps more than twice per week, and no two consecutive days of the same format
- Dinner must include at least 3 different cuisine styles per week (e.g. Italian, Mexican, Asian, Mediterranean, American, Indian, Greek)
- Across a 2-week plan: each dinner protein used in week 1 should not be the dominant protein in the same weekday slot of week 2

GENERAL RULES:
- Practical family-friendly meals scaled to the household size
- Every meal freshly prepared — NEVER use "Leftovers" or any variation
- NEVER suggest homemade pizza or any pizza that requires making dough from scratch — if pizza is included it must use store-bought/premade dough and the meal name must say "Premade Dough Pizza" or similar to make that clear; otherwise skip pizza entirely
- Mix of quick weekday meals and more involved weekend meals
- Kid-friendly options when children are present${budget ? `\n- STRICT BUDGET: Stay within $${budget} total. Use economical proteins, pantry staples, and ingredient-sharing across meals.` : ""}${store ? `\n- Prefer ingredients commonly available at ${store}` : ""}

Respond ONLY with a JSON array (no markdown, no explanation) covering exactly ${totalDays} days:
[
  {"day": "Monday", "breakfast": "Scrambled Eggs & Toast", "lunch": "Turkey Sandwiches", "dinner": "Spaghetti Bolognese"},
  ...
]

Keep meal names short and clear (3-5 words max each). Never include the word "Leftover" in any meal name.`,
        },
      ],
    });

    let parsedDays: MealDay[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const start = raw.indexOf("[");
        const end = raw.lastIndexOf("]");
        if (start !== -1 && end !== -1) {
          parsedDays = JSON.parse(raw.slice(start, end + 1));
        }
        break;
      }
    }

    const mealWeeks: MealWeek[] = [];
    for (let w = 0; w < weeks; w++) {
      mealWeeks.push({
        week: w + 1,
        days: parsedDays.slice(w * 7, (w + 1) * 7).map((d, i) => ({
          ...d,
          day: dayNames[i] ?? d.day,
        })),
      });
    }

    const mealPlan: MealPlan = { weeks: mealWeeks, totalDays, adults, kids, budget: budget ? Number(budget) : null, store };
    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error("Meal plan error:", error);
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 500 });
  }
}
