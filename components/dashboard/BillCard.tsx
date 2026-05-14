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

function isDueSoon(dueDay: number | null | undefined): boolean {
  if (dueDay == null) return false;
  const today = new Date();
  const diff = dueDay - today.getDate();
  return diff >= 0 && diff <= 7;
}

function isOverdue(dueDay: number | null | undefined): boolean {
  if (dueDay == null) return false;
  return dueDay < new Date().getDate();
}

export function BillCard({ total, bills }: BillCardProps) {
  const upcoming = bills
    .filter((b) => b.dueDay != null)
    .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0))
    .slice(0, 3);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blush-50 via-white to-blush-50/50 p-4 ring-1 ring-blush-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-blush-600">
          Bills
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blush-100">
          <Receipt className="h-4 w-4 text-blush-600" />
        </span>
      </div>
      <p className="text-2xl font-bold tabular text-blush-900 leading-none">
        ${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground mb-3">
        {bills.length} recurring bill{bills.length === 1 ? "" : "s"}
      </p>
      {upcoming.length > 0 && (
        <ul className="space-y-1.5">
          {upcoming.map((bill, i) => {
            const overdue = isOverdue(bill.dueDay);
            const soon = !overdue && isDueSoon(bill.dueDay);
            return (
              <li key={i} className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-medium truncate",
                    overdue ? "text-blush-600" : soon ? "text-amber-600" : "text-foreground"
                  )}
                >
                  {bill.name}
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {overdue && <span className="text-blush-500 mr-1">!</span>}
                  {soon && !overdue && <span className="text-amber-400 mr-1">·</span>}
                  {bill.dueDay ? `due ${bill.dueDay}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
