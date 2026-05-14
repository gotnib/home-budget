import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BudgetSummaryProps {
  monthlyIncome: number;
  fixedBills: number;
  groceryBudget: number;
  groceryPercent: number;
}

export function BudgetSummary({
  monthlyIncome,
  fixedBills,
  groceryBudget,
  groceryPercent,
}: BudgetSummaryProps) {
  const billsPercent = monthlyIncome > 0 ? (fixedBills / monthlyIncome) * 100 : 0;
  const groceryPctOfIncome = monthlyIncome > 0 ? (groceryBudget / monthlyIncome) * 100 : 0;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="border-cream-200">
      <CardContent className="pt-6">
        <h3 className="mb-4 text-base font-semibold text-foreground">
          Budget Overview
        </h3>
        <div className="space-y-4">
          {/* Income */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-sage-400" />
              Monthly Income
            </span>
            <span className="font-semibold text-sage-700">${fmt(monthlyIncome)}</span>
          </div>

          {/* Bills */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-blush-400" />
                Fixed Bills
              </span>
              <span className="font-semibold text-blush-700">${fmt(fixedBills)}</span>
            </div>
            <Progress
              value={billsPercent}
              className="h-1.5"
              indicatorClassName="bg-blush-400"
            />
          </div>

          {/* Grocery */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-lavender-400" />
                Grocery Budget ({groceryPercent}%)
              </span>
              <span className="font-semibold text-lavender-700">${fmt(groceryBudget)}</span>
            </div>
            <Progress
              value={groceryPctOfIncome}
              className="h-1.5"
              indicatorClassName="bg-lavender-400"
            />
          </div>

          {/* Remaining */}
          <div className="border-t border-cream-200 pt-3">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-foreground">Flexible Remaining</span>
              <span className="text-sage-700">
                ${fmt(Math.max(0, monthlyIncome - fixedBills - groceryBudget))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
