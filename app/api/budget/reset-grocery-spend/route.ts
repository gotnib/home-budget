import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getHouseholdContext, canWrite } from "@/lib/household";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ownerId, role } = await getHouseholdContext(user.id);
    if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.budgetSettings.upsert({
      where: { userId: ownerId },
      update: { grocerySpentAccumulated: 0 },
      create: { userId: ownerId, grocerySpentAccumulated: 0 },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reset grocery spend error:", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
