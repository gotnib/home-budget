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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConnectBankButton } from "@/components/plaid/ConnectBankButton";
import { Building2, Check, Loader2, LogOut, RefreshCw } from "lucide-react";

interface PlaidItem {
  id: string;
  institutionName: string | null;
  createdAt: string;
}

interface BudgetSettings {
  groceryPercent: number;
  savingsGoal: number;
}

export default function SettingsPage() {
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([]);
  const [settings, setSettings] = useState<BudgetSettings>({ groceryPercent: 25, savingsGoal: 0 });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      setUserEmail(user.email ?? null);

      const [itemsRes, budgetRes] = await Promise.all([
        fetch("/api/plaid/items"),
        fetch("/api/budget"),
      ]);

      if (itemsRes.ok) {
        const items = await itemsRes.json();
        setPlaidItems(Array.isArray(items) ? items : []);
      }
      if (budgetRes.ok) {
        const budget = await budgetRes.json();
        setSettings({
          groceryPercent: budget.groceryPercent ?? 25,
          savingsGoal: budget.savingsGoal ?? 0,
        });
      }
    } catch {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleSyncTransactions() {
    setIsSyncing(true);
    setError(null);
    try {
      const [syncRes] = await Promise.all([
        fetch("/api/plaid/sync-transactions", { method: "POST" }),
        fetch("/api/plaid/recurring"),
      ]);
      const data = await syncRes.json();
      alert(`Synced ${data.synced ?? 0} transactions!`);
    } catch {
      setError("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSaveSettings() {
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar userEmail={userEmail ?? undefined} />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account, bank connections, and budget preferences.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-blush-50 px-4 py-3 text-sm text-blush-700 ring-1 ring-blush-200">
            {error}
          </div>
        )}

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              {userEmail ?? "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={signingOut}
              className="gap-2 text-muted-foreground"
            >
              {signingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Bank connections */}
        <Card>
          <CardHeader>
            <CardTitle>Bank connections</CardTitle>
            <CardDescription>
              Connected accounts automatically import income and recurring bills via Plaid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-lavender-400" />
              </div>
            ) : plaidItems.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center text-muted-foreground rounded-xl border-2 border-dashed border-cream-300">
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
                    className="flex items-center gap-3 rounded-xl bg-cream-100 px-4 py-3"
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

            <div className="flex flex-wrap gap-2">
              <ConnectBankButton onSuccess={fetchData} />
              {plaidItems.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncTransactions}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  {isSyncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Sync Transactions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Preferences</CardTitle>
            <CardDescription>
              Adjust how your grocery budget is calculated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pct-slider">
                Grocery % of flexible budget
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="pct-slider"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.groceryPercent}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, groceryPercent: parseInt(e.target.value, 10) }))
                  }
                  className="flex-1 accent-blush-400"
                />
                <span className="w-12 text-right font-bold text-blush-700">
                  {settings.groceryPercent}%
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="savings-goal">Monthly savings goal ($)</Label>
              <Input
                id="savings-goal"
                type="number"
                min="0"
                step="10"
                value={settings.savingsGoal}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    savingsGoal: Math.max(0, parseFloat(e.target.value) || 0),
                  }))
                }
                className="w-40"
              />
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700 ring-1 ring-sage-200">
                <Check className="h-4 w-4" />
                Preferences saved!
              </div>
            )}

            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="gap-2 bg-blush-400 text-white hover:bg-blush-500"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
