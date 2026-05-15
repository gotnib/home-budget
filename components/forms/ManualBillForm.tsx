"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface ManualBillFormProps {
  onSuccess: () => void;
}

const CADENCES = [
  { value: "weekly",   label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly",  label: "Monthly" },
  { value: "annually", label: "Annually" },
];

export function ManualBillForm({ onSuccess }: ManualBillFormProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [cadence, setCadence] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNum = parseFloat(amount);
    if (!name.trim()) { setError("Please enter a name."); return; }
    if (isNaN(amountNum) || amountNum <= 0) { setError("Please enter a valid amount."); return; }
    const dueDayNum = dueDay ? parseInt(dueDay, 10) : undefined;
    if (dueDayNum !== undefined && (isNaN(dueDayNum) || dueDayNum < 1 || dueDayNum > 31)) {
      setError("Due day must be between 1 and 31."); return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), amount: amountNum, dueDay: dueDayNum ?? null, cadence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add bill");
      setName(""); setAmount(""); setDueDay(""); setCadence("monthly");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="form-grid-4">
        <div className="form-field">
          <label className="form-label" htmlFor="bill-name">Bill name</label>
          <input id="bill-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix, Rent" required />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="bill-amount">Amount ($)</label>
          <input id="bill-amount" className="form-input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="bill-dueday">Due day (1–31)</label>
          <input id="bill-dueday" className="form-input" type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Optional" />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="bill-cadence">Frequency</label>
          <select id="bill-cadence" className="form-select" value={cadence} onChange={(e) => setCadence(e.target.value)}>
            {CADENCES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {error && <p style={{ fontSize: "0.875rem", color: "var(--blush-600)" }}>{error}</p>}

      <button type="submit" disabled={isLoading} className="btn btn--soft" style={{ alignSelf: "flex-start" }}>
        {isLoading ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: "1rem", height: "1rem" }} />}
        Add Bill
      </button>
    </form>
  );
}
