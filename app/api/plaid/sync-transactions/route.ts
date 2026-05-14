import { NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
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
      return NextResponse.json({ synced: 0 });
    }

    let totalSynced = 0;

    for (const item of plaidItems) {
      let cursor: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await plaidClient.transactionsSync({
          access_token: item.accessToken,
          cursor,
        });

        const { added, modified, removed, next_cursor, has_more } =
          response.data;

        // Upsert added/modified transactions
        for (const txn of [...added, ...modified]) {
          await prisma.transaction.upsert({
            where: { plaidId: txn.transaction_id },
            update: {
              name: txn.name,
              amount: txn.amount,
              date: new Date(txn.date),
              category: txn.personal_finance_category?.primary ?? null,
              merchantName: txn.merchant_name ?? null,
              type: txn.amount > 0 ? "debit" : "credit",
              source: "plaid",
            },
            create: {
              userId: user.id,
              plaidId: txn.transaction_id,
              name: txn.name,
              amount: txn.amount,
              date: new Date(txn.date),
              category: txn.personal_finance_category?.primary ?? null,
              merchantName: txn.merchant_name ?? null,
              type: txn.amount > 0 ? "debit" : "credit",
              source: "plaid",
            },
          });
          totalSynced++;
        }

        // Delete removed transactions
        for (const removedTxn of removed) {
          await prisma.transaction
            .delete({
              where: { plaidId: removedTxn.transaction_id },
            })
            .catch(() => {
              // Ignore if not found
            });
        }

        cursor = next_cursor;
        hasMore = has_more;
      }
    }

    return NextResponse.json({ synced: totalSynced });
  } catch (error) {
    console.error("Transaction sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
