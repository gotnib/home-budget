import { TrendingUp } from "lucide-react";

interface IncomeCardProps {
  amount: number;
  count: number;
}

export function IncomeCard({ amount, count }: IncomeCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 p-5 text-white shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
            Monthly Income
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <TrendingUp className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
        </div>

        <p className="mt-3 text-3xl font-bold tabular leading-none text-white">
          ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="mt-1.5 text-xs text-white/60">
          {count} source{count === 1 ? "" : "s"} · per month
        </p>
      </div>
    </div>
  );
}
