import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getHouseholdContext, canWrite } from "@/lib/household";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ownerId, role } = await getHouseholdContext(user.id);
    if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    await prisma.groceryItem.createMany({
      data: items.map((item: { name: string; quantity?: number; estimatedPrice?: number }) => ({
        userId: ownerId,
        name: item.name,
        quantity: item.quantity ?? 1,
        estimatedPrice: item.estimatedPrice ?? null,
        status: "planned",
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Bulk add error:", error);
    return NextResponse.json({ error: "Failed to add items" }, { status: 500 });
  }
}
