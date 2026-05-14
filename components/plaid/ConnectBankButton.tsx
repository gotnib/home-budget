"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectBankButtonProps {
  onSuccess?: () => void;
}

async function openPlaidLink(onSuccess: (publicToken: string) => void): Promise<void> {
  // 1. Get link token from our API
  const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
  const json = await res.json();
  if (!res.ok || !json.link_token) {
    throw new Error(json.error ?? "Could not create link token");
  }
  const linkToken: string = json.link_token;

  // 2. Load Plaid Link script if not already loaded
  await new Promise<void>((resolve, reject) => {
    type WindowWithPlaid = typeof window & { Plaid?: unknown };
    if ((window as WindowWithPlaid).Plaid) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Plaid Link script"));
    document.head.appendChild(script);
  });

  // 3. Open Plaid Link UI
  type PlaidHandler = { open: () => void; destroy: () => void };
  type PlaidLib = { create: (config: Record<string, unknown>) => PlaidHandler };
  type WindowWithPlaid = typeof window & { Plaid: PlaidLib };

  const plaid = (window as WindowWithPlaid).Plaid;
  await new Promise<void>((resolve) => {
    const handler = plaid.create({
      token: linkToken,
      onSuccess: (public_token: string) => {
        onSuccess(public_token);
        handler.destroy();
        resolve();
      },
      onExit: () => {
        handler.destroy();
        resolve();
      },
    });
    handler.open();
  });
}

export function ConnectBankButton({ onSuccess }: ConnectBankButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    try {
      await openPlaidLink(async (publicToken) => {
        // Exchange public token for access token
        const res = await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to connect bank");
        }

        // Auto-sync after connecting
        await Promise.allSettled([
          fetch("/api/plaid/sync-transactions", { method: "POST" }),
          fetch("/api/plaid/recurring"),
        ]);

        onSuccess?.();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect bank");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="soft"
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {isLoading ? "Connecting..." : "Connect Bank Account"}
      </Button>
      {error && (
        <p className="text-sm text-blush-600">{error}</p>
      )}
    </div>
  );
}
