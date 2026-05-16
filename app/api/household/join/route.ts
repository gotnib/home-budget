import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: "code is required" }, { status: 400 });

    const normalizedCode = code.trim().toUpperCase();

    // Find household by code
    const household = await prisma.household.findFirst({
      where: {
        OR: [
          { workerCode: normalizedCode },
          { hiveCode: normalizedCode },
        ],
      },
    });

    if (!household) return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    if (household.ownerId === user.id) return NextResponse.json({ error: "You own this household" }, { status: 400 });

    const role = household.workerCode === normalizedCode ? "worker" : "hive";

    await prisma.userProfile.update({
      where: { id: user.id },
      data: { householdId: household.id, householdRole: role },
    });

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    console.error("Household join error:", error);
    return NextResponse.json({ error: "Failed to join household" }, { status: 500 });
  }
}

// Remove a member (Queen only)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { memberId } = await request.json();
    if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

    // Verify caller owns the household this member belongs to
    const member = await prisma.userProfile.findUnique({
      where: { id: memberId },
      select: { householdId: true },
    });
    if (!member?.householdId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const household = await prisma.household.findFirst({
      where: { id: member.householdId, ownerId: user.id },
    });
    if (!household) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.userProfile.update({
      where: { id: memberId },
      data: { householdId: null, householdRole: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
