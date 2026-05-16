import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 15;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!checkRateLimit(user.id, 100, 60 * 60 * 1000))
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const { item, quantity = 1 } = await request.json();
    if (!item?.trim()) return NextResponse.json({ error: "item is required" }, { status: 400 });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 20,
      messages: [{
        role: "user",
        content: `Typical US grocery store price for: "${item}" (quantity: ${quantity}). Reply with ONLY a decimal number, e.g. 3.49`,
      }],
    });

    let price: number | null = null;
    for (const block of response.content) {
      if (block.type === "text") {
        const num = parseFloat(block.text.trim());
        if (!isNaN(num) && num > 0) price = Math.round(num * 100) / 100;
        break;
      }
    }

    if (price === null) return NextResponse.json({ error: "Could not estimate price" }, { status: 500 });
    return NextResponse.json({ price });
  } catch (error) {
    console.error("Estimate price error:", error);
    return NextResponse.json({ error: "Failed to estimate price" }, { status: 500 });
  }
}
