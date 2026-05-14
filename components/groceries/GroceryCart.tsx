import { ShoppingBag, TrendingDown } from "lucide-react";

interface GroceryCartProps {
  items: { quantity: number; estimatedPrice: number | null; status: string }[];
  budget: number;
}

export function GroceryCart({ items, budget }: GroceryCartProps) {
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);
  const remaining = Math.max(0, budget - total);
  const pct = budget > 0 ? Math.min(100, (total / budget) * 100) : 0;
  const isOver = total > budget && budget > 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="rounded-2xl bg-gradient-to-b from-lavender-50 to-white p-5 ring-1 ring-lavender-200 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender-100">
          <ShoppingBag className="h-4 w-4 text-lavender-600" />
        </span>
        <p className="font-semibold text-sm text-lavender-800">Cart Summary</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-xl bg-white p-3 shadow-soft ring-1 ring-cream-200 text-center">
          <p className="text-2xl font-bold tabular text-lavender-800">{itemCount}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-0.5">items</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-soft ring-1 ring-cream-200 text-center">
          <p className="text-lg font-bold tabular text-foreground leading-tight">{fmt(total)}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-0.5">est. total</p>
        </div>
      </div>

      {budget > 0 && (
        <div className="rounded-xl bg-white p-3.5 shadow-soft ring-1 ring-cream-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Budget</span>
            <span className="font-bold tabular text-foreground">{fmt(budget)}</span>
          </div>

          <div className="h-2 w-full rounded-full bg-cream-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-spring"
              style={{
                width: `${pct}%`,
                background: isOver
                  ? "linear-gradient(to right, #ef7a9a, #f4a7b9)"
                  : pct > 80
                  ? "linear-gradient(to right, #f5b83a, #e8a44a)"
                  : "linear-gradient(to right, #9acba0, #7fb685)",
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-1 font-medium ${isOver ? "text-blush-600" : "text-muted-foreground"}`}>
              {isOver ? "⚠ Over by" : (
                <>
                  <TrendingDown className="h-3 w-3 text-sage-500" />
                  Remaining
                </>
              )}
            </span>
            <span className={`font-bold tabular ${isOver ? "text-blush-600" : "text-sage-700"}`}>
              {isOver ? fmt(total - budget) : fmt(remaining)}
            </span>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p className="text-center text-xs text-muted-foreground/60 py-2">
          Add items to see your totals
        </p>
      )}
    </div>
  );
}
