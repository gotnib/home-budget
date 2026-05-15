import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface NutritionSummary {
  overview: string;
  dailyAverages: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  highlights: string[];
  tips: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { meals, adults = 2, kids = 0 } = await request.json();
    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      return NextResponse.json({ error: "meals array is required" }, { status: 400 });
    }

    const mealList = meals.join(", ");
    const people = adults + kids;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Estimate the nutritional profile for this meal plan for ${people} people (${adults} adults${kids > 0 ? `, ${kids} kids` : ""}): ${mealList}

Respond ONLY with a single JSON object (no markdown):
{
  "overview": "One sentence describing the overall nutritional balance.",
  "dailyAverages": {
    "calories": "~2,000 per adult",
    "protein": "~80g per adult",
    "carbs": "~250g per adult",
    "fat": "~70g per adult"
  },
  "highlights": ["2-3 notable nutrition wins, e.g. high fiber, good protein"],
  "tips": ["1-2 simple improvement suggestions"]
}`,
      }],
    });

    let nutrition: NutritionSummary | null = null;
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          nutrition = JSON.parse(raw.slice(start, end + 1));
        }
        break;
      }
    }

    if (!nutrition) return NextResponse.json({ error: "Failed to parse nutrition" }, { status: 500 });
    return NextResponse.json({ nutrition });
  } catch (error) {
    console.error("Nutrition error:", error);
    return NextResponse.json({ error: "Failed to generate nutrition summary" }, { status: 500 });
  }
}
