import { TrendingUp } from "lucide-react";

interface IncomeCardProps {
  amount: number;
  count: number;
}

export function IncomeCard({ amount, count }: IncomeCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-sage-50 via-white to-sage-50/50 p-4 ring-1 ring-sage-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-sage-600">
          Income
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-100">
          <TrendingUp className="h-4 w-4 text-sage-600" />
        </span>
      </div>
      <p className="text-2xl font-bold tabular text-sage-900 leading-none">
        ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {count} source{count === 1 ? "" : "s"} · monthly
      </p>
    </div>
  );
}
