import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get last 2 months of transactions
    const now = new Date();
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const transactions = await (prisma as any).transaction.findMany({
      where: {
        userId: user.id,
        type: "outflow",
        date: { gte: twoMonthsAgo },
      },
      orderBy: { date: "desc" },
    });

    // Group by category for current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthTxns = transactions.filter((t: any) => new Date(t.date) >= currentMonthStart);
    const prevMonthTxns = transactions.filter((t: any) => new Date(t.date) >= prevMonthStart && new Date(t.date) < currentMonthStart);

    // Category breakdown for current month
    const categoryMap: Record<string, number> = {};
    for (const t of currentMonthTxns) {
      const cat = t.category ?? "Other";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + Math.abs(t.amount);
    }
    const categories = Object.entries(categoryMap)
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

    const currentTotal = currentMonthTxns.reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    const prevTotal = prevMonthTxns.reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

    // Detect potential subscriptions: recurring outflows with same merchant ~monthly
    const merchantMap: Record<string, any[]> = {};
    for (const t of transactions) {
      if (!t.merchantName) continue;
      const key = t.merchantName.toLowerCase();
      if (!merchantMap[key]) merchantMap[key] = [];
      merchantMap[key].push(t);
    }
    const subscriptions = Object.entries(merchantMap)
      .filter(([, txns]) => txns.length >= 2)
      .map(([, txns]) => {
        const sorted = txns.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const avg = sorted.reduce((s: number, t: any) => s + Math.abs(t.amount), 0) / sorted.length;
        return {
          name: sorted[0].merchantName ?? sorted[0].name,
          amount: Math.round(avg * 100) / 100,
          lastDate: sorted[0].date,
          occurrences: sorted.length,
        };
      })
      .filter(s => s.amount > 0)
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
