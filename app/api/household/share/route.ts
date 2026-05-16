import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let settings = await prisma.budgetSettings.findUnique({ where: { userId: user.id } });

    // Generate token if none exists
    if (!settings?.shareToken) {
      const token = randomBytes(12).toString("hex");
      settings = await prisma.budgetSettings.upsert({
        where: { userId: user.id },
        update: { shareToken: token },
        create: {
          userId: user.id,
          shareToken: token,
        },
      });
    }

    return NextResponse.json({ token: settings?.shareToken ?? null });
  } catch (error) {
    console.error("Share token GET error:", error);
    return NextResponse.json({ error: "Failed to get share token" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.budgetSettings.update({
      where: { userId: user.id },
      data: { shareToken: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Share token DELETE error:", error);
    return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 });
  }
}
