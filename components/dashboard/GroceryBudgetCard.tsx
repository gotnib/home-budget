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
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-600 p-5 text-white shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
            Grocery Budget
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <ShoppingCart className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
        </div>

        <p className="mt-3 text-3xl font-bold tabular leading-none text-white">
          ${remaining.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="mt-1.5 text-xs text-white/60">
          {isOver ? (
            <span className="text-white font-semibold">over budget!</span>
          ) : (
            `of $${budget.toLocaleString("en-US", { minimumFractionDigits: 0 })} remaining`
          )}
        </p>

        {/* Animated progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full transition-all duration-700 ease-spring"
            style={{
              width: `${pct}%`,
              background: isOver
                ? "rgba(255,255,255,0.9)"
                : pct > 80
                ? "rgba(255,255,255,0.75)"
                : "rgba(255,255,255,0.6)",
            }}
          />
        </div>
        <p className="mt-1 text-[10px] text-white/50">{pct.toFixed(0)}% used</p>
      </div>
    </div>
  );
}
