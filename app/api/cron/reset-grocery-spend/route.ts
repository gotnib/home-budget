import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Accumulate all current purchased items into each user's total before clearing
    const purchased = await prisma.groceryItem.findMany({
      where: { status: "purchased" },
      select: { userId: true, estimatedPrice: true, quantity: true },
    });

    // Group by userId and sum
    const spendByUser = new Map<string, number>();
    for (const item of purchased) {
      const val = (item.estimatedPrice ?? 0) * item.quantity;
      spendByUser.set(item.userId, (spendByUser.get(item.userId) ?? 0) + val);
    }

    // Reset accumulator to 0 and clear purchased items for all users
    await Promise.all([
      prisma.budgetSettings.updateMany({
        data: { grocerySpentAccumulated: 0 },
      }),
      prisma.groceryItem.deleteMany({ where: { status: "purchased" } }),
    ]);

    return NextResponse.json({ ok: true, usersReset: spendByUser.size });
  } catch (error) {
    console.error("Monthly grocery reset error:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
