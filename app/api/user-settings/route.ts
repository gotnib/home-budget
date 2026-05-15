import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await prisma.budgetSettings.findUnique({ where: { userId: user.id } });

    return NextResponse.json({
      displayName:     settings?.displayName     ?? null,
      payPeriod:       settings?.payPeriod       ?? "biweekly",
      householdAdults: settings?.householdAdults ?? 2,
      householdKids:   settings?.householdKids   ?? 0,
      preferredStore:  settings?.preferredStore  ?? "",
      savedMealPlan:   settings?.savedMealPlan   ?? null,
      savedLists:      settings?.savedLists      ?? [],
    });
  } catch (error) {
    console.error("GET user-settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const allowed = ["displayName", "payPeriod", "householdAdults", "householdKids", "preferredStore", "savedMealPlan", "savedLists"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    const settings = await prisma.budgetSettings.upsert({
      where:  { userId: user.id },
      update: updates,
      create: {
        userId:          user.id,
        groceryPercent:  25,
        savingsGoal:     0,
        payPeriod:       "biweekly",
        householdAdults: 2,
        householdKids:   0,
        preferredStore:  "",
        ...updates,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("PATCH user-settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
