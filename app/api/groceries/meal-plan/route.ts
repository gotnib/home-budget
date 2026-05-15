import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

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

    const body = await request.json();
    const { weeks = 1, adults = 2, kids = 0, notes = "", budget = null, store = "" } = body;

    const totalDays = Math.min(weeks * 7, 28);
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

Requirements:
- Practical family-friendly meals scaled to the household size
- Every meal must be freshly prepared — NEVER use "Leftovers", "Leftover [X]", or any variation as a meal. Plan the right portions so there are no designated leftover nights.
- Variety across the plan (avoid repeating the same meal)
- Mix of quick weekday meals and more involved weekend meals
- Kid-friendly options when children are present${budget ? `\n- STRICT BUDGET: Design meals so the total grocery cost stays within $${budget}. Choose economical proteins, use pantry staples, and plan meals that share ingredients to reduce cost.` : ""}${store ? `\n- Prefer ingredients commonly available at ${store}` : ""}

Respond ONLY with a JSON array (no markdown, no explanation) covering exactly ${totalDays} days:
[
  {"day": "Monday", "breakfast": "Scrambled Eggs & Toast", "lunch": "Turkey Sandwiches", "dinner": "Spaghetti Bolognese"},
  ...
]

Keep meal names short and clear (3-5 words max each). Never include the word "Leftover" in any meal name.`,
        },
      ],
    });

    let days: MealDay[] = [];
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const start = raw.indexOf("[");
        const end = raw.lastIndexOf("]");
        if (start !== -1 && end !== -1) {
          days = JSON.parse(raw.slice(start, end + 1));
        }
        break;
      }
    }

    const mealWeeks: MealWeek[] = [];
    for (let w = 0; w < weeks; w++) {
      mealWeeks.push({
        week: w + 1,
        days: days.slice(w * 7, (w + 1) * 7).map((d, i) => ({
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
