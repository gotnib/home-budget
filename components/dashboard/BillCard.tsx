import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  // Due within next 7 days (wrap around month end)
  const diff = dueDay - currentDay;
  return diff >= 0 && diff <= 7;
}

function isOverdue(dueDay: number | null | undefined): boolean {
  if (dueDay == null) return false;
  const today = new Date();
  return dueDay < today.getDate();
}

export function BillCard({ total, bills }: BillCardProps) {
  const upcomingBills = bills
    .filter((b) => b.dueDay != null)
    .sort((a, b) => (a.dueDay ?? 0) - (b.dueDay ?? 0))
    .slice(0, 4);

  return (
    <Card className="border-blush-200 bg-gradient-to-br from-blush-50 to-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-blush-700">
          Monthly Bills
        </CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blush-100 text-blush-600">
          <Receipt className="h-5 w-5" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-blush-800">
          ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {bills.length} recurring {bills.length === 1 ? "bill" : "bills"}
        </p>
        {upcomingBills.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {upcomingBills.map((bill, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-xs"
              >
                <span
                  className={cn(
                    "font-medium",
                    isOverdue(bill.dueDay)
                      ? "text-blush-600"
                      : isDueSoon(bill.dueDay)
                      ? "text-amber-600"
                      : "text-foreground"
                  )}
                >
                  {bill.name}
                  {isOverdue(bill.dueDay) && (
                    <span className="ml-1 text-blush-500">(overdue)</span>
                  )}
                  {!isOverdue(bill.dueDay) && isDueSoon(bill.dueDay) && (
                    <span className="ml-1 text-amber-500">(soon)</span>
                  )}
                </span>
                <span className="text-muted-foreground">
                  ${bill.amount.toFixed(2)}
                  {bill.dueDay && (
                    <span className="ml-1 text-muted-foreground/70">
                      due {bill.dueDay}th
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
