"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectBankButton } from "@/components/plaid/ConnectBankButton";
import { Toaster } from "@/components/ui/toaster";
import { Building2, Loader2 } from "lucide-react";

interface PlaidItem {
  id: string;
  institutionName: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchPlaidItems = useCallback(async () => {
    const res = await fetch("/api/plaid/items");
    if (res.ok) {
      setPlaidItems(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaidItems();
  }, [fetchPlaidItems]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account and bank connections.
          </p>
        </div>

        {/* Bank connections */}
        <Card>
          <CardHeader>
            <CardTitle>Bank connections</CardTitle>
            <CardDescription>
              Connected accounts automatically import income and recurring bills.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-lavender-400" />
              </div>
            ) : plaidItems.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                <Building2 className="h-10 w-10 opacity-30 mb-3" />
                <p className="font-medium">No banks connected yet</p>
                <p className="text-sm mt-1">
                  Connect a bank account to auto-import transactions.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {plaidItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-lavender-100">
                      <Building2 className="h-5 w-5 text-lavender-600" />
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {item.institutionName ?? "Bank account"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Connected{" "}
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <ConnectBankButton onSuccess={fetchPlaidItems} />
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={signingOut}
              className="gap-2 text-stone-600"
            >
              {signingOut && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign out
            </Button>
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  );
}
