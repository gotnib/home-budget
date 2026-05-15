import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function makeCode() {
  return randomBytes(4).toString("hex").toUpperCase(); // 8-char code
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user owns a household
    const owned = await prisma.household.findUnique({
      where: { ownerId: user.id },
      include: { members: { select: { id: true, email: true, householdRole: true } } },
    });
    if (owned) {
      return NextResponse.json({ household: owned, role: "queen" });
    }

    // Check if user is a member
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      select: { householdId: true, householdRole: true },
    });
    if (profile?.householdId) {
      const household = await prisma.household.findUnique({
        where: { id: profile.householdId },
        include: { owner: { select: { email: true } } },
      });
      return NextResponse.json({ household, role: profile.householdRole });
    }

    return NextResponse.json({ household: null, role: "queen" });
  } catch (error) {
    console.error("Household GET error:", error);
    return NextResponse.json({ error: "Failed to load household" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Must not already own or belong to a household
    const existing = await prisma.household.findUnique({ where: { ownerId: user.id } });
    if (existing) return NextResponse.json({ household: existing, role: "queen" });

    const household = await prisma.household.create({
      data: {
        ownerId: user.id,
        workerCode: makeCode(),
        hiveCode: makeCode(),
      },
    });

    return NextResponse.json({ household, role: "queen" }, { status: 201 });
  } catch (error) {
    console.error("Household POST error:", error);
    return NextResponse.json({ error: "Failed to create household" }, { status: 500 });
  }
}

// Regenerate invite codes
export async function PATCH() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const household = await prisma.household.update({
      where: { ownerId: user.id },
      data: { workerCode: makeCode(), hiveCode: makeCode() },
    });

    return NextResponse.json({ household });
  } catch (error) {
    console.error("Household PATCH error:", error);
    return NextResponse.json({ error: "Failed to refresh codes" }, { status: 500 });
  }
}

// Remove a member
export async function DELETE() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Remove self from household (leave)
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { householdId: null, householdRole: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Household DELETE error:", error);
    return NextResponse.json({ error: "Failed to leave household" }, { status: 500 });
  }
}
