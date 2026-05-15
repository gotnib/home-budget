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

    const items = await prisma.groceryItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
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
    const { name, quantity = 1, estimatedPrice, status: reqStatus } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const itemStatus = reqStatus === "purchased" ? "purchased" : "planned";

    // Upsert by name only for planned items
    const existing = itemStatus === "planned"
      ? await prisma.groceryItem.findFirst({ where: { userId: user.id, name, status: "planned" } })
      : null;

    let item;
    if (existing) {
      item = await prisma.groceryItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + (quantity ?? 1),
          estimatedPrice: estimatedPrice ?? existing.estimatedPrice,
        },
      });
    } else {
      item = await prisma.groceryItem.create({
        data: {
          userId: user.id,
          name,
          quantity: quantity ?? 1,
          estimatedPrice: estimatedPrice ?? null,
          status: itemStatus,
        },
      });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Add cart item error:", error);
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, status, quantity } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.groceryItem.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const updateData: { status?: string; quantity?: number } = {};
    if (status !== undefined) updateData.status = status;
    if (quantity !== undefined) updateData.quantity = quantity;

    const item = await prisma.groceryItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Update cart item error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
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

    const existing = await prisma.groceryItem.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.groceryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete cart item error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
