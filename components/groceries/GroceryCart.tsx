import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShoppingBag } from "lucide-react";

interface GroceryCartProps {
  items: { quantity: number; estimatedPrice: number | null; status: string }[];
  budget: number;
}

export function GroceryCart({ items, budget }: GroceryCartProps) {
  const allItems = items;
  const itemCount = allItems.reduce((sum, i) => sum + i.quantity, 0);
  const total = allItems.reduce(
    (sum, i) => sum + (i.estimatedPrice ?? 0) * i.quantity,
    0
  );
  const remaining = Math.max(0, budget - total);
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const isOver = total > budget && budget > 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <Card className="border-lavender-200 bg-gradient-to-b from-lavender-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-lavender-700">
          <ShoppingBag className="h-5 w-5" />
          Cart Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-lavender-800">{itemCount}</p>
            <p className="text-xs text-muted-foreground">items</p>
          </div>
          <div className="rounded-xl bg-white/70 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground">{fmt(total)}</p>
            <p className="text-xs text-muted-foreground">estimated total</p>
          </div>
        </div>

        {budget > 0 && (
          <div className="space-y-2 rounded-xl bg-white/70 p-3 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-medium">{fmt(budget)}</span>
            </div>
            <Progress
              value={pct}
              className="h-2"
              indicatorClassName={
                isOver ? "bg-blush-500" : pct > 80 ? "bg-amber-400" : "bg-lavender-400"
              }
            />
            <div className="flex items-center justify-between text-sm">
              <span className={isOver ? "font-medium text-blush-600" : "text-muted-foreground"}>
                {isOver ? "Over by" : "Remaining"}
              </span>
              <span
                className={
                  isOver
                    ? "font-semibold text-blush-600"
                    : "font-semibold text-sage-700"
                }
              >
                {isOver ? fmt(total - budget) : fmt(remaining)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
