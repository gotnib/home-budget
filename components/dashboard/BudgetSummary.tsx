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
  const billsPct = monthlyIncome > 0 ? Math.min(100, (fixedBills / monthlyIncome) * 100) : 0;
  const groceryPct = monthlyIncome > 0 ? Math.min(100, (groceryBudget / monthlyIncome) * 100) : 0;
  const flexRemaining = Math.max(0, monthlyIncome - fixedBills - groceryBudget);

  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const rows = [
    {
      label: "Income",
      value: fmt(monthlyIncome),
      dot: "bg-sage-400",
      color: "text-sage-700",
      pct: null as number | null,
      bar: null as string | null,
    },
    {
      label: "Bills",
      value: fmt(fixedBills),
      dot: "bg-blush-400",
      color: "text-blush-700",
      pct: billsPct,
      bar: "bg-blush-400",
    },
    {
      label: `Groceries (${groceryPercent}%)`,
      value: fmt(groceryBudget),
      dot: "bg-lavender-400",
      color: "text-lavender-700",
      pct: groceryPct,
      bar: "bg-lavender-400",
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-cream-200 shadow-sm h-full">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
        Overview
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <span className={["inline-block h-2 w-2 rounded-full flex-shrink-0", row.dot].join(" ")} />
                {row.label}
              </span>
              <span className={["font-semibold text-xs tabular", row.color].join(" ")}>
                {row.value}
              </span>
            </div>
            {row.pct !== null && row.bar && (
              <Progress value={row.pct} className="h-1.5" indicatorClassName={row.bar} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-cream-200 pt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Flexible left</span>
        <span className="text-sm font-bold text-sage-700 tabular">{fmt(flexRemaining)}</span>
      </div>
    </div>
  );
}
