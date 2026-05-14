import { Progress } from "@/components/ui/progress";
import { ShoppingCart } from "lucide-react";

interface GroceryBudgetCardProps {
  budget: number;
  spent: number;
}

export function GroceryBudgetCard({ budget, spent }: GroceryBudgetCardProps) {
  const remaining = Math.max(0, budget - spent);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const isOver = spent > budget && budget > 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-lavender-50 via-white to-lavender-50/50 p-4 ring-1 ring-lavender-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-lavender-600">
          Groceries
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lavender-100">
          <ShoppingCart className="h-4 w-4 text-lavender-600" />
        </span>
      </div>
      <p className="text-2xl font-bold tabular text-lavender-900 leading-none">
        ${remaining.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {isOver ? (
          <span className="text-blush-500 font-medium">over budget!</span>
        ) : (
          `of $${budget.toLocaleString("en-US", { minimumFractionDigits: 0 })} left`
        )}
      </p>
      <div className="mt-3">
        <Progress
          value={pct}
          className="h-1.5"
          indicatorClassName={
            isOver
              ? "bg-blush-400"
              : pct > 80
              ? "bg-amber-400"
              : "bg-lavender-400"
          }
        />
      </div>
    </div>
  );
}
