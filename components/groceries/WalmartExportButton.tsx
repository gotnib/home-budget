"use client";

import { useState } from "react";
import { ExternalLink, ShoppingBag, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ExportResult {
  items: { name: string; quantity: number; price: number }[];
  total: number;
  checkoutUrl: string;
  message: string;
}

export function WalmartExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch("/api/groceries/export");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      setResult(data); setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setIsLoading(false); }
  }

  return (
    <>
      <button onClick={handleExport} disabled={isLoading} className="walmart-btn">
        {isLoading
          ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
          : <ShoppingBag style={{ width: "1rem", height: "1rem" }} />
        }
        Export to Walmart
      </button>

      {error && <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--blush-600)" }} className="animate-slide-up">{error}</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {/* Walmart header */}
          <div style={{ background: "linear-gradient(to right, #0071CE, #004F99)", padding: "1.25rem 1.5rem", color: "white" }}>
            <DialogHeader>
              <DialogTitle style={{ display: "flex", alignItems: "center", gap: "0.625rem", color: "white" }}>
                <CheckCircle2 style={{ width: "1.25rem", height: "1.25rem", opacity: 0.8 }} />
                Ready to checkout!
              </DialogTitle>
            </DialogHeader>
            {result && (
              <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                {result.message}
              </p>
            )}
          </div>

          {result && (
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ borderRadius: "1rem", background: "var(--cream-100)", border: "1px solid var(--cream-200)", overflow: "hidden" }}>
                <ul>
                  {result.items.slice(0, 6).map((item, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 1rem", fontSize: "0.875rem", borderTop: i > 0 ? "1px solid var(--cream-200)" : "none" }}>
                      <span style={{ color: "var(--color-fg)" }}>
                        {item.name}
                        {item.quantity > 1 && (
                          <span style={{ marginLeft: "0.375rem", borderRadius: "9999px", background: "var(--cream-200)", padding: "0.125rem 0.375rem", fontSize: "10px", fontWeight: 700, color: "var(--color-muted)" }}>
                            ×{item.quantity}
                          </span>
                        )}
                      </span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--color-fg)" }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                  {result.items.length > 6 && (
                    <li style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", color: "var(--color-muted)", textAlign: "center", borderTop: "1px solid var(--cream-200)" }}>
                      +{result.items.length - 6} more items
                    </li>
                  )}
                </ul>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--cream-200)", borderTop: "1px solid var(--cream-200)" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-fg)" }}>Estimated total</span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--sage-700)" }}>${result.total.toFixed(2)}</span>
                </div>
              </div>

              <a
                href={result.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  borderRadius: "1rem", background: "#0071CE", padding: "0.875rem 1rem",
                  fontWeight: 600, color: "white", transition: "all 0.2s", textDecoration: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#005FAE"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0071CE"; e.currentTarget.style.transform = "none"; }}
              >
                Open Walmart
                <ExternalLink style={{ width: "1rem", height: "1rem" }} />
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
