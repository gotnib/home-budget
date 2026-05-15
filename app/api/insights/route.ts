import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getHouseholdContext, canWrite } from "@/lib/household";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { ownerId, role } = await getHouseholdContext(user.id);
    if (!canWrite(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Transactions are stored with type "debit" (outflow) / "credit" (inflow)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: ownerId,
        type: "debit",
        date: { gte: twoMonthsAgo },
      },
      orderBy: { date: "desc" },
    });

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthTxns = transactions.filter((t) => new Date(t.date) >= currentMonthStart);
    const prevMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= prevMonthStart && d < currentMonthStart;
    });

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    for (const t of currentMonthTxns) {
      const cat = t.category ?? "Other";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + Math.abs(t.amount);
    }
    const categories = Object.entries(categoryMap)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const currentTotal = currentMonthTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
    const prevTotal = prevMonthTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

    // Subscription detection: same merchant appearing in both months
    const groupKey = (t: (typeof transactions)[0]) =>
      (t.merchantName ?? t.name).toLowerCase().replace(/\s+/g, " ").trim();

    const merchantMap: Record<string, (typeof transactions)> = {};
    for (const t of transactions) {
      const key = groupKey(t);
      if (!merchantMap[key]) merchantMap[key] = [];
      merchantMap[key].push(t);
    }

    const subscriptions = Object.entries(merchantMap)
      .filter(([, txns]) => txns.length >= 2)
      .map(([, txns]) => {
        const sorted = [...txns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const avg = sorted.reduce((s, t) => s + Math.abs(t.amount), 0) / sorted.length;
        return {
          name: sorted[0].merchantName ?? sorted[0].name,
          amount: Math.round(avg * 100) / 100,
          lastDate: sorted[0].date,
          occurrences: sorted.length,
        };
      })
      .filter((s) => s.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15);

    return NextResponse.json({
      categories,
      currentTotal: Math.round(currentTotal * 100) / 100,
      prevTotal: Math.round(prevTotal * 100) / 100,
      subscriptions,
      hasTransactions: transactions.length > 0,
    });
  } catch (error) {
    console.error("Insights error:", error);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
