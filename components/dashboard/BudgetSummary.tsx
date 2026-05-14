interface BudgetSummaryProps {
  monthlyIncome: number;
  fixedBills: number;
  groceryBudget: number;
  groceryPercent: number;
}

export function BudgetSummary({ monthlyIncome, fixedBills, groceryBudget, groceryPercent }: BudgetSummaryProps) {
  const billsPct = monthlyIncome > 0 ? Math.min(100, (fixedBills / monthlyIncome) * 100) : 0;
  const groceryPct = monthlyIncome > 0 ? Math.min(100, (groceryBudget / monthlyIncome) * 100) : 0;
  const flexRemaining = Math.max(0, monthlyIncome - fixedBills - groceryBudget);
  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const bars = [
    { label: "Bills", pct: billsPct, color: "bg-blush-400", value: fmt(fixedBills), textColor: "text-blush-700" },
    { label: `Groceries (${groceryPercent}%)`, pct: groceryPct, color: "bg-lavender-400", value: fmt(groceryBudget), textColor: "text-lavender-700" },
  ];

  return (
    <div className="h-full rounded-2xl bg-white p-5 shadow-card ring-1 ring-cream-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="section-label">Overview</p>
          <span className="text-xs font-bold tabular text-sage-700 bg-sage-50 px-2 py-0.5 rounded-full ring-1 ring-sage-200">
            {fmt(monthlyIncome)} /mo
          </span>
        </div>

        <div className="space-y-3.5">
          {bars.map(({ label, pct, color, value, textColor }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
                <span className={`text-xs font-bold tabular ${textColor}`}>{value}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-cream-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-spring ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-sage-50 px-3 py-2.5 ring-1 ring-sage-100">
        <span className="text-xs font-medium text-sage-700">Flexible left</span>
        <span className="text-sm font-bold tabular text-sage-800">{fmt(flexRemaining)}</span>
      </div>
    </div>
  );
}
