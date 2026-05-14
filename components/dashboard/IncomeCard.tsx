import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface IncomeCardProps {
  amount: number;
  count: number;
}

export function IncomeCard({ amount, count }: IncomeCardProps) {
  return (
    <Card className="border-sage-200 bg-gradient-to-br from-sage-50 to-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-sage-700">
          Monthly Income
        </CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
          <TrendingUp className="h-5 w-5" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-sage-800">
          ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {count} income {count === 1 ? "source" : "sources"}
        </p>
      </CardContent>
    </Card>
  );
}
