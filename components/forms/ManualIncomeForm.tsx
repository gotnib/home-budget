"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManualIncomeFormProps {
  onSuccess: () => void;
}

const CADENCES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annually", label: "Annually" },
];

export function ManualIncomeForm({ onSuccess }: ManualIncomeFormProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (!name.trim()) { setError("Please enter a name."); return; }
    if (isNaN(amountNum) || amountNum <= 0) { setError("Please enter a valid amount."); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), amount: amountNum, cadence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add income");
      setName("");
      setAmount("");
      setCadence("monthly");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <Label htmlFor="income-name">Source name</Label>
          <Input
            id="income-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Salary, Freelance"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="income-amount">Amount ($)</Label>
          <Input
            id="income-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="income-cadence">Frequency</Label>
          <Select value={cadence} onValueChange={setCadence}>
            <SelectTrigger id="income-cadence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CADENCES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-blush-600">{error}</p>}

      <Button type="submit" disabled={isLoading} variant="sage" className="gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add Income
      </Button>
    </form>
  );
}
