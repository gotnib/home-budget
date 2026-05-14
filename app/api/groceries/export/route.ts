import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { walmartAdapter } from "@/lib/walmart-adapter";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plannedItems = await prisma.groceryItem.findMany({
      where: { userId: user.id, status: "planned" },
      orderBy: { createdAt: "asc" },
    });

    if (plannedItems.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        checkoutUrl: "https://www.walmart.com/cart",
        message: "No planned items to export.",
      });
    }

    const groceryItems = plannedItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      estimatedPrice: item.estimatedPrice ?? undefined,
    }));

    const cart = await walmartAdapter.createCart(groceryItems);
    const order = await walmartAdapter.submitCart(cart.cartId);

    return NextResponse.json({
      items: cart.items,
      total: cart.total,
      checkoutUrl: order.checkoutUrl ?? "https://www.walmart.com/cart",
      message: order.message,
    });
  } catch (error) {
    console.error("Grocery export error:", error);
    return NextResponse.json(
      { error: "Failed to export grocery list" },
      { status: 500 }
    );
  }
}
