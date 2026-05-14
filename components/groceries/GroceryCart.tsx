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
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const barColor = isOver
    ? "linear-gradient(to right, #ef7a9a, #f4a7b9)"
    : pct > 80
    ? "linear-gradient(to right, #f5b83a, #e8a44a)"
    : "linear-gradient(to right, #9acba0, #7fb685)";

  return (
    <div className="cart-sidebar">
      <div className="cart-sidebar-head">
        <span className="icon-pill icon-pill--lavender icon-pill--sm">
          <ShoppingBag style={{ width: "1rem", height: "1rem" }} />
        </span>
        <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--lavender-800)" }}>Cart Summary</p>
      </div>

      <div className="cart-summary-grid">
        <div className="cart-stat-mini">
          <p className="cart-stat-mini-val">{itemCount}</p>
          <p className="cart-stat-mini-label">items</p>
        </div>
        <div className="cart-stat-mini">
          <p className="cart-stat-mini-val" style={{ fontSize: "1.125rem" }}>{fmt(total)}</p>
          <p className="cart-stat-mini-label">est. total</p>
        </div>
      </div>

      {budget > 0 && (
        <div className="cart-budget-box">
          <div className="cart-budget-row">
            <span className="cart-budget-label">Budget</span>
            <span className="cart-budget-val">{fmt(budget)}</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>

          <div className="cart-budget-row">
            <span className={`cart-remaining-label${isOver ? " cart-remaining-label--over" : " cart-remaining-label--ok"}`}>
              {isOver ? (
                "⚠ Over by"
              ) : (
                <>
                  <TrendingDown style={{ width: "0.75rem", height: "0.75rem", color: "var(--sage-500)" }} />
                  Remaining
                </>
              )}
            </span>
            <span className={isOver ? "cart-remaining-val--over" : "cart-remaining-val--ok"}>
              {isOver ? fmt(total - budget) : fmt(remaining)}
            </span>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "rgba(154,126,90,0.6)", paddingTop: "0.5rem" }}>
          Add items to see your totals
        </p>
      )}
    </div>
  );
}
