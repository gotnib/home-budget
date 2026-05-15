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
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { weeks = 1, adults = 2, kids = 0, notes = "" } = body;

    const totalDays = Math.min(weeks * 7, 28);
    const peopleDesc = [
      adults > 0 ? `${adults} adult${adults > 1 ? "s" : ""}` : "",
      kids > 0 ? `${kids} child${kids > 1 ? "ren" : ""}` : "",
    ].filter(Boolean).join(" and ");

    const dayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Create a ${totalDays}-day meal plan for a household of ${peopleDesc}.${notes ? ` Additional notes: ${notes}` : ""}

Requirements:
- Practical family-friendly meals
- Variety across the plan (avoid repeating the same meal)
- Mix of quick weekday meals and more involved weekend meals
- Kid-friendly options when children are present

Respond ONLY with a JSON array (no markdown, no explanation) covering exactly ${totalDays} days:
[
  {"day": "Monday", "breakfast": "Scrambled Eggs & Toast", "lunch": "Turkey Sandwiches", "dinner": "Spaghetti Bolognese"},
  ...
]

Keep meal names short and clear (3-5 words max each).`,
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

    // Group into weeks
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

    const mealPlan: MealPlan = { weeks: mealWeeks, totalDays, adults, kids };
    return NextResponse.json({ mealPlan });
  } catch (error) {
    console.error("Meal plan error:", error);
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 500 });
  }
}
