import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CountryCode } from "plaid";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { public_token } = await request.json();
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = exchangeRes.data;

    // Fetch institution name right after connecting
    let institutionName: string | null = null;
    try {
      const itemRes = await plaidClient.itemGet({ access_token });
      const institutionId = itemRes.data.item.institution_id;
      if (institutionId) {
        const instRes = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: [CountryCode.Us],
        });
        institutionName = instRes.data.institution.name ?? null;
      }
    } catch {
      // Non-fatal — item will show generic name
    }

    await prisma.plaidItem.create({
      data: {
        userId: user.id,
        accessToken: access_token,
        itemId: item_id,
        institutionName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 500 });
  }
}

