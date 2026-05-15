"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface ConnectBankButtonProps {
  onSuccess?: () => void;
}

async function openPlaidLink(onSuccess: (publicToken: string) => void): Promise<void> {
  const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
  const json = await res.json();
  if (!res.ok || !json.link_token) throw new Error(json.error ?? "Could not create link token");

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

  type PlaidHandler = { open: () => void; destroy: () => void };
  type PlaidLib = { create: (config: Record<string, unknown>) => PlaidHandler };
  type WindowWithPlaid = typeof window & { Plaid: PlaidLib };

  const plaid = (window as WindowWithPlaid).Plaid;
  await new Promise<void>((resolve) => {
    const handler = plaid.create({
      token: json.link_token,
      onSuccess: (public_token: string) => { onSuccess(public_token); handler.destroy(); resolve(); },
      onExit: () => { handler.destroy(); resolve(); },
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
        const res = await fetch("/api/plaid/exchange-public-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token: publicToken }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to connect bank");
        }
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button onClick={handleClick} disabled={isLoading} className="connect-bank-btn">
        {isLoading
          ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
          : <Plus style={{ width: "1rem", height: "1rem" }} />
        }
        {isLoading ? "Connecting..." : "Connect Bank Account"}
      </button>
      {error && <p style={{ fontSize: "0.875rem", color: "var(--blush-600)" }}>{error}</p>}
    </div>
  );
}
