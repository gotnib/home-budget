import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface RecipeData {
  title: string;
  prepTime: string;
  cookTime: string;
  ingredients: { amount: string; item: string }[];
  steps: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!checkRateLimit(user.id, 30, 60 * 60 * 1000))
      return NextResponse.json({ error: "Too many requests — please wait before fetching another recipe." }, { status: 429 });

    const { meal, servings = 4 } = await request.json();
    if (!meal) return NextResponse.json({ error: "meal is required" }, { status: 400 });

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: `Give me a practical home-cooking recipe for "${meal}", scaled for ${servings} ${servings === 1 ? "person" : "people"}.

Respond ONLY with a single JSON object (no markdown, no explanation):
{
  "title": "${meal}",
  "prepTime": "X mins",
  "cookTime": "X mins",
  "ingredients": [
    { "amount": "500g", "item": "ground beef" }
  ],
  "steps": [
    "Step description here."
  ]
}

Keep steps clear and concise (1-2 sentences each). Use common household measurements.`,
      }],
    });

    let recipe: RecipeData | null = null;
    for (const block of response.content) {
      if (block.type === "text") {
        const raw = block.text.trim();
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          recipe = JSON.parse(raw.slice(start, end + 1));
        }
        break;
      }
    }

    if (!recipe) return NextResponse.json({ error: "Failed to parse recipe" }, { status: 500 });

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("Recipe error:", error);
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 });
  }
}
