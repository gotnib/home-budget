"use client";

import { useState } from "react";
import { ExternalLink, ShoppingBag, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groceries/export");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      setResult(data);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={handleExport}
        disabled={isLoading}
        className="bg-[#0071CE] text-white hover:bg-[#005FAE] shadow-soft gap-2 disabled:opacity-70"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingBag className="h-4 w-4" />
        )}
        Export to Walmart
      </Button>

      {error && (
        <p className="mt-2 text-sm text-blush-600 animate-slide-up">{error}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl border-cream-200 p-0 overflow-hidden shadow-soft-lg animate-scale-in">
          {/* Coloured header band */}
          <div className="bg-gradient-to-r from-[#0071CE] to-[#004F99] px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-white text-lg">
                <CheckCircle2 className="h-5 w-5 text-white/80" />
                Ready to checkout!
              </DialogTitle>
            </DialogHeader>
            {result && (
              <p className="mt-1 text-sm text-white/70 leading-relaxed">
                {result.message}
              </p>
            )}
          </div>

          {result && (
            <div className="p-6 space-y-4">
              {/* Item list */}
              <div className="rounded-2xl bg-cream-50 ring-1 ring-cream-200 overflow-hidden">
                <ul className="divide-y divide-cream-200">
                  {result.items.slice(0, 6).map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-foreground">
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="ml-1.5 rounded-full bg-cream-200 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            ×{item.quantity}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold tabular text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                  {result.items.length > 6 && (
                    <li className="px-4 py-2 text-xs text-muted-foreground text-center">
                      +{result.items.length - 6} more items
                    </li>
                  )}
                </ul>
                <div className="flex items-center justify-between px-4 py-3 bg-cream-100 border-t border-cream-200">
                  <span className="text-sm font-semibold text-foreground">Estimated total</span>
                  <span className="font-bold tabular text-sage-700">
                    ${result.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <a
                href={result.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0071CE] px-4 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-[#005FAE] hover:-translate-y-px hover:shadow-soft active:scale-[0.97]"
              >
                Open Walmart
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
