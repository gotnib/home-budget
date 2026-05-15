interface BudgetSummaryProps {
  monthlyIncome: number;
  fixedBills: number;
  groceryBudget: number;
  groceryPercent: number;
}

export function BudgetSummary({ monthlyIncome, fixedBills, groceryBudget, groceryPercent }: BudgetSummaryProps) {
  const billsPct    = monthlyIncome > 0 ? Math.min(100, (fixedBills    / monthlyIncome) * 100) : 0;
  const groceryPct  = monthlyIncome > 0 ? Math.min(100, (groceryBudget / monthlyIncome) * 100) : 0;
  const flexRemaining = Math.max(0, monthlyIncome - fixedBills - groceryBudget);
  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="overview-card">
      <div>
        <div className="overview-head">
          <p className="section-label">Overview</p>
          <span className="overview-income-badge">{fmt(monthlyIncome)} /mo</span>
        </div>

        <div className="overview-bar-row">
          <div className="overview-bar-item">
            <div className="overview-bar-labels">
              <span className="overview-bar-name">Bills</span>
              <span className="overview-bar-val-blush">{fmt(fixedBills)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-fill--blush" style={{ width: `${billsPct}%` }} />
            </div>
          </div>

          <div className="overview-bar-item">
            <div className="overview-bar-labels">
              <span className="overview-bar-name">Groceries ({groceryPercent}%)</span>
              <span className="overview-bar-val-lavender">{fmt(groceryBudget)}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill progress-fill--lavender" style={{ width: `${groceryPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="overview-flex-row">
        <span className="overview-flex-label">Flexible left</span>
        <span className="overview-flex-val">{fmt(flexRemaining)}</span>
      </div>
    </div>
  );
}
