import { Receipt } from "lucide-react";

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
    <div className="stat-hero stat-hero--blush">
      <div className="stat-hero-content">
        <div className="stat-hero-row">
          <span className="stat-hero-label">Monthly Bills</span>
          <span className="stat-hero-icon">
            <Receipt style={{ width: "1rem", height: "1rem", color: "white" }} strokeWidth={2} />
          </span>
        </div>
        <p className="stat-hero-value">
          ${total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p className="stat-hero-sub" style={{ marginBottom: upcoming.length > 0 ? "0.75rem" : 0 }}>
          {bills.length} recurring bill{bills.length === 1 ? "" : "s"}
        </p>

        {upcoming.length > 0 && (
          <ul style={{ display: "flex", flexDirection: "column", gap: "0.375rem", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "0.75rem" }}>
            {upcoming.map((bill, i) => {
              const over = isOverdue(bill.dueDay);
              return (
                <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: over ? "white" : "rgba(255,255,255,0.7)" }}>
                    {over && <span style={{ marginRight: "0.25rem" }}>⚠</span>}
                    {bill.name}
                  </span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
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
