import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart } from "lucide-react";

interface GroceryBudgetCardProps {
  budget: number;
  spent: number;
}

export function GroceryBudgetCard({ budget, spent }: GroceryBudgetCardProps) {
  const remaining = Math.max(0, budget - spent);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const isOver = spent > budget;

  return (
    <Card className="border-lavender-200 bg-gradient-to-br from-lavender-50 to-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-lavender-700">
          Grocery Budget
        </CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lavender-100 text-lavender-600">
          <ShoppingCart className="h-5 w-5" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-lavender-800">
          ${remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          remaining of ${budget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} budget
        </p>
        <div className="mt-3 space-y-1">
          <Progress
            value={pct}
            className="h-2"
            indicatorClassName={
              isOver
                ? "bg-blush-500"
                : pct > 80
                ? "bg-amber-400"
                : "bg-lavender-400"
            }
          />
          <p className="text-xs text-muted-foreground">
            {pct.toFixed(0)}% used
            {isOver && (
              <span className="ml-1 font-medium text-blush-500">
                (over budget!)
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
