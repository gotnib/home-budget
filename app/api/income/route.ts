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

    const incomes = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ incomes });
  } catch (error) {
    console.error("Get incomes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch incomes" },
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
    const { name, amount, cadence } = body;

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

    const income = await prisma.income.create({
      data: {
        userId: user.id,
        name,
        amount: Number(amount),
        cadence,
        source: "manual",
      },
    });

    return NextResponse.json({ income });
  } catch (error) {
    console.error("Create income error:", error);
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 }
    );
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

    const existing = await prisma.income.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Income not found" }, { status: 404 });

    await prisma.income.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete income error:", error);
    return NextResponse.json(
      { error: "Failed to delete income" },
      { status: 500 }
    );
  }
}
