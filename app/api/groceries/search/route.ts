import { NextRequest, NextResponse } from "next/server";
import { walmartAdapter } from "@/lib/walmart-adapter";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await walmartAdapter.searchItems(q.trim());
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Grocery search error:", error);
    return NextResponse.json(
      { error: "Failed to search groceries" },
      { status: 500 }
    );
  }
}
