import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
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

    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
    });

    if (plaidItems.length === 0) {
      return NextResponse.json({ incomes: [], bills: [] });
    }

    const allIncomes: Array<{
      name: string;
      amount: number;
      cadence: string;
    }> = [];
    const allBills: Array<{
      name: string;
      amount: number;
      dueDay: number | null;
      cadence: string;
    }> = [];

    for (const item of plaidItems) {
      const response = await plaidClient.transactionsRecurringGet({
        access_token: item.accessToken,
      });

      const { inflow_streams, outflow_streams } = response.data;

      // Process inflow (income) streams
      for (const stream of inflow_streams) {
        const cadence = mapFrequencyToCadence(stream.frequency);
        const amount = Math.abs(stream.average_amount?.amount ?? 0);
        const name = stream.merchant_name ?? stream.description ?? "Income";

        await prisma.income.upsert({
          where: {
            // We use a compound lookup on userId + name + source
            // Since Prisma doesn't have a unique on this, we use findFirst then create/update
            id: (
              await prisma.income.findFirst({
                where: { userId: user.id, name, source: "plaid" },
              })
            )?.id ?? "new",
          },
          update: { amount, cadence },
          create: {
            userId: user.id,
            name,
            amount,
            cadence,
            source: "plaid",
          },
        });

        allIncomes.push({ name, amount, cadence });
      }

      // Process outflow (bills) streams
      for (const stream of outflow_streams) {
        const cadence = mapFrequencyToCadence(stream.frequency);
        const amount = Math.abs(stream.average_amount?.amount ?? 0);
        const name =
          stream.merchant_name ?? stream.description ?? "Recurring Bill";
        const lastDate = stream.last_date
          ? new Date(stream.last_date).getDate()
          : null;

        await prisma.bill.upsert({
          where: {
            id: (
              await prisma.bill.findFirst({
                where: { userId: user.id, name, source: "plaid" },
              })
            )?.id ?? "new",
          },
          update: { amount, cadence, dueDay: lastDate },
          create: {
            userId: user.id,
            name,
            amount,
            dueDay: lastDate,
            cadence,
            source: "plaid",
          },
        });

        allBills.push({ name, amount, dueDay: lastDate, cadence });
      }
    }

    return NextResponse.json({ incomes: allIncomes, bills: allBills });
  } catch (error) {
    console.error("Recurring sync error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring transactions" },
      { status: 500 }
    );
  }
}

function mapFrequencyToCadence(frequency: string): string {
  switch (frequency) {
    case "WEEKLY":
      return "weekly";
    case "BIWEEKLY":
      return "biweekly";
    case "SEMI_MONTHLY":
      return "biweekly";
    case "MONTHLY":
      return "monthly";
    case "ANNUALLY":
      return "annually";
    default:
      return "monthly";
  }
}
