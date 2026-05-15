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
    <div className="stat-hero stat-hero--lavender">
      <div className="stat-hero-content">
        <div className="stat-hero-row">
          <span className="stat-hero-label">Grocery Budget</span>
          <span className="stat-hero-icon">
            <ShoppingCart style={{ width: "1rem", height: "1rem", color: "white" }} strokeWidth={2} />
          </span>
        </div>
        <p className="stat-hero-value">
          ${remaining.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="stat-hero-sub">
          {isOver ? (
            <strong style={{ color: "white" }}>over budget!</strong>
          ) : (
            `of $${budget.toLocaleString("en-US", { minimumFractionDigits: 0 })} remaining`
          )}
        </p>
        <div style={{ marginTop: "1rem", height: "0.375rem", width: "100%", overflow: "hidden", borderRadius: "9999px", background: "rgba(255,255,255,0.25)" }}>
          <div
            style={{
              height: "100%",
              borderRadius: "9999px",
              width: `${pct}%`,
              transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
              background: isOver ? "rgba(255,255,255,0.9)" : pct > 80 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.6)",
            }}
          />
        </div>
        <p style={{ marginTop: "0.25rem", fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>{pct.toFixed(0)}% used</p>
      </div>
    </div>
  );
}
