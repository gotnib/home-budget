import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface Bill {
  name: string;
  amount: number;
  dueDay?: number | null;
}

interface BillCardProps {
  total: number;
  bills: Bill[];
}

function isDueSoon(dueDay?: number | null) {
  if (dueDay == null) return false;
  const diff = dueDay - new Date().getDate();
  return diff >= 0 && diff <= 7;
}

function isOverdue(dueDay?: number | null) {
  if (dueDay == null) return false;
  return dueDay < new Date().getDate();
}

export function BillCard({ total, bills }: BillCardProps) {
  const upcoming = bills
    .filter((b) => b.dueDay != null)
    .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0))
    .slice(0, 3);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blush-400 to-blush-600 p-5 text-white shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5">
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">
            Monthly Bills
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Receipt className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
        </div>

        <p className="mt-3 text-3xl font-bold tabular leading-none text-white">
          ${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="mt-1.5 text-xs text-white/60 mb-3">
          {bills.length} recurring bill{bills.length === 1 ? "" : "s"}
        </p>

        {upcoming.length > 0 && (
          <ul className="space-y-1.5 border-t border-white/20 pt-3">
            {upcoming.map((bill, i) => {
              const over = isOverdue(bill.dueDay);
              const soon = !over && isDueSoon(bill.dueDay);
              return (
                <li key={i} className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-xs font-medium truncate",
                    over ? "text-white" : soon ? "text-white/90" : "text-white/70"
                  )}>
                    {over && <span className="mr-1">⚠</span>}
                    {bill.name}
                  </span>
                  <span className="text-[10px] text-white/60 whitespace-nowrap">
                    {bill.dueDay ? `due ${bill.dueDay}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
