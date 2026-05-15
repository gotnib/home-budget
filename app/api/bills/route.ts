import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bills = await prisma.bill.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("Get bills error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, amount, dueDay, cadence } = body;

    if (!name || !amount || !cadence) {
      return NextResponse.json(
        { error: "name, amount, and cadence are required" },
        { status: 400 }
      );
    }

    const validCadences = ["weekly", "biweekly", "monthly", "annually"];
    if (!validCadences.includes(cadence)) {
      return NextResponse.json(
        { error: "cadence must be one of: weekly, biweekly, monthly, annually" },
        { status: 400 }
      );
    }

    if (dueDay !== undefined && dueDay !== null) {
      const day = Number(dueDay);
      if (isNaN(day) || day < 1 || day > 31) {
        return NextResponse.json(
          { error: "dueDay must be between 1 and 31" },
          { status: 400 }
        );
      }
    }

    const bill = await prisma.bill.create({
      data: {
        userId: user.id,
        name,
        amount: Number(amount),
        dueDay: dueDay ? Number(dueDay) : null,
        cadence,
        source: "manual",
      },
    });

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Create bill error:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, name, amount, dueDay, cadence } = body;

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const existing = await prisma.bill.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (amount !== undefined) updates.amount = Number(amount);
    if (dueDay !== undefined) updates.dueDay = dueDay === null || dueDay === "" ? null : Number(dueDay);
    if (cadence !== undefined) {
      const validCadences = ["weekly", "biweekly", "monthly", "annually"];
      if (!validCadences.includes(cadence)) {
        return NextResponse.json({ error: "Invalid cadence" }, { status: 400 });
      }
      updates.cadence = cadence;
    }

    const bill = await prisma.bill.update({ where: { id }, data: updates });
    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Update bill error:", error);
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.bill.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    await prisma.bill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete bill error:", error);
    return NextResponse.json(
      { error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}
