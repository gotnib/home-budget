import { TrendingUp } from "lucide-react";

interface IncomeCardProps {
  amount: number;
  count: number;
}

export function IncomeCard({ amount, count }: IncomeCardProps) {
  return (
    <div className="stat-hero stat-hero--sage">
      <div className="stat-hero-content">
        <div className="stat-hero-row">
          <span className="stat-hero-label">Monthly Income</span>
          <span className="stat-hero-icon">
            <TrendingUp style={{ width: "1rem", height: "1rem", color: "white" }} strokeWidth={2} />
          </span>
        </div>
        <p className="stat-hero-value">
          ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="stat-hero-sub">{count} source{count === 1 ? "" : "s"} · per month</p>
      </div>
    </div>
  );
}
