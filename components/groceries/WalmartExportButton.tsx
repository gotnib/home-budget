"use client";

import { useState } from "react";
import { ExternalLink, ShoppingBag, Loader2 } from "lucide-react";
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
        className="bg-[#0071CE] text-white hover:bg-[#005FAE] disabled:opacity-70"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShoppingBag className="mr-2 h-4 w-4" />
        )}
        Export to Walmart
      </Button>

      {error && (
        <p className="mt-2 text-sm text-blush-600">{error}</p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#0071CE]" />
              Ready to checkout!
            </DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{result.message}</p>

              {/* Items summary */}
              <div className="rounded-xl bg-cream-100 p-3">
                <ul className="space-y-1.5">
                  {result.items.slice(0, 6).map((item, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span>
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="ml-1 text-muted-foreground">×{item.quantity}</span>
                        )}
                      </span>
                      <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                  {result.items.length > 6 && (
                    <li className="text-xs text-muted-foreground">
                      +{result.items.length - 6} more items
                    </li>
                  )}
                </ul>
                <div className="mt-2 border-t border-cream-200 pt-2 flex items-center justify-between font-semibold">
                  <span>Estimated total</span>
                  <span className="text-sage-700">
                    ${result.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <a
                href={result.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0071CE] px-4 py-3 font-medium text-white hover:bg-[#005FAE] transition-colors"
              >
                Open Walmart <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
