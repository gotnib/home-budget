export function calculateGroceryBudget({
  monthlyIncome,
  fixedBills,
  savingsGoal,
  groceryPercent,
}: {
  monthlyIncome: number;
  fixedBills: number;
  savingsGoal: number;
  groceryPercent: number;
}) {
  const flexibleBudget = monthlyIncome - fixedBills - savingsGoal;
  const groceryBudget = flexibleBudget * (groceryPercent / 100);
  return {
    flexibleBudget: Math.max(0, flexibleBudget),
    groceryBudget: Math.max(0, groceryBudget),
  };
}

export function normalizeToMonthly(amount: number, cadence: string): number {
  switch (cadence) {
    case "weekly":
      return (amount * 52) / 12;
    case "biweekly":
      return (amount * 26) / 12;
    case "monthly":
      return amount;
    case "annually":
      return amount / 12;
    default:
      return amount;
  }
}
