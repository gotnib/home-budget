import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entries = await (prisma as any).incomeEntry.findMany({
      where: { userId: user.id },
      orderBy: { receivedAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Income history GET error:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sourceName, amount, receivedAt, note } = await request.json();
    if (!sourceName || amount == null || !receivedAt) {
      return NextResponse.json({ error: "sourceName, amount, and receivedAt are required" }, { status: 400 });
    }

    const entry = await (prisma as any).incomeEntry.create({
      data: {
        userId: user.id,
        sourceName,
        amount: parseFloat(amount),
        receivedAt: new Date(receivedAt),
        note: note || null,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Income history POST error:", error);
    return NextResponse.json({ error: "Failed to log paycheck" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await (prisma as any).incomeEntry.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Income history DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
