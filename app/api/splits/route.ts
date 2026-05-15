import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const splits = await (prisma as any).splitExpense.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ splits });
  } catch (error) {
    console.error("Splits GET error:", error);
    return NextResponse.json({ error: "Failed to load splits" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, total, yourShare, paidBy = "me", people = [] } = await request.json();
    if (!name || total == null) return NextResponse.json({ error: "name and total are required" }, { status: 400 });

    const split = await (prisma as any).splitExpense.create({
      data: {
        userId: user.id,
        name,
        total: parseFloat(total),
        yourShare: parseFloat(yourShare ?? total),
        paidBy,
        people,
      },
    });
    return NextResponse.json({ split }, { status: 201 });
  } catch (error) {
    console.error("Splits POST error:", error);
    return NextResponse.json({ error: "Failed to create split" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, settled } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const existing = await (prisma as any).splitExpense.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const split = await (prisma as any).splitExpense.update({
      where: { id },
      data: { settled: settled ?? !existing.settled },
    });
    return NextResponse.json({ split });
  } catch (error) {
    console.error("Splits PATCH error:", error);
    return NextResponse.json({ error: "Failed to update split" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await (prisma as any).splitExpense.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Splits DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete split" }, { status: 500 });
  }
}
