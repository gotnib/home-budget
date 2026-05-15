"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectBankButton } from "@/components/plaid/ConnectBankButton";
import { Building2, Check, Home, Loader2, LogOut, RefreshCw } from "lucide-react";

const LS_DISPLAY_NAME = "honey-display-name";

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
  const [displayName, setDisplayName] = useState("");
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      setUserEmail(user.email ?? null);
      const [itemsRes, budgetRes] = await Promise.all([fetch("/api/plaid/items"), fetch("/api/budget")]);
      if (itemsRes.ok) { const items = await itemsRes.json(); setPlaidItems(Array.isArray(items) ? items : []); }
      if (budgetRes.ok) { const budget = await budgetRes.json(); setSettings({ groceryPercent: budget.groceryPercent ?? 25, savingsGoal: budget.savingsGoal ?? 0 }); }
    } catch { setError("Failed to load settings."); }
    finally { setLoading(false); }
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
    try {
      setDisplayName(localStorage.getItem(LS_DISPLAY_NAME) ?? "");
    } catch { /* ignore */ }
  }, [fetchData]);

  function handleSaveDisplayName() {
    const name = displayName.trim();
    try {
      if (name) {
        localStorage.setItem(LS_DISPLAY_NAME, name);
        document.title = name;
        const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (meta) meta.setAttribute("content", name);
        else {
          const m = document.createElement("meta");
          m.setAttribute("name", "apple-mobile-web-app-title");
          m.setAttribute("content", name);
          document.head.appendChild(m);
        }
      } else {
        localStorage.removeItem(LS_DISPLAY_NAME);
        document.title = "HoneyCart";
      }
    } catch { /* ignore */ }
    setDisplayNameSaved(true);
    setTimeout(() => setDisplayNameSaved(false), 2500);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/"); router.refresh();
  }

  async function handleSyncTransactions() {
    setIsSyncing(true); setError(null);
    try {
      const [syncRes] = await Promise.all([
        fetch("/api/plaid/sync-transactions", { method: "POST" }),
        fetch("/api/plaid/recurring"),
      ]);
      const data = await syncRes.json();
      alert(`Synced ${data.synced ?? 0} transactions!`);
    } catch { setError("Sync failed. Please try again."); }
    finally { setIsSyncing(false); }
  }

  async function handleSaveSettings() {
    setIsSaving(true); setSaveSuccess(false); setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch { setError("Failed to save settings."); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="app-layout">
      <Navbar userEmail={userEmail ?? undefined} />
      <main className="page-container--sm">

        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ marginTop: "0.25rem", color: "var(--color-muted)", fontSize: "0.875rem" }}>
            Manage your account, bank connections, and budget preferences.
          </p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        {/* Account */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account</h3>
            <p className="card-description">{userEmail ?? "Loading..."}</p>
          </div>
          <div className="card-body">
            <button onClick={handleSignOut} disabled={signingOut} className="btn btn--outline" style={{ gap: "0.5rem", color: "var(--color-muted)" }}>
              {signingOut
                ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                : <LogOut style={{ width: "1rem", height: "1rem" }} />
              }
              Sign out
            </button>
          </div>
        </div>

        {/* Bank connections */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Bank connections</h3>
            <p className="card-description">Connected accounts automatically import income and recurring bills via Plaid.</p>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {loading ? (
              <div className="loading-center" style={{ padding: "1.5rem 0" }}>
                <Loader2 style={{ width: "1.5rem", height: "1.5rem", color: "var(--lavender-400)", animation: "spin 1s linear infinite" }} />
              </div>
            ) : plaidItems.length === 0 ? (
              <div className="settings-bank-empty">
                <Building2 style={{ width: "2.5rem", height: "2.5rem", opacity: 0.3, marginBottom: "0.75rem" }} />
                <p style={{ fontWeight: 500 }}>No banks connected yet</p>
                <p style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>Connect a bank account to auto-import transactions.</p>
              </div>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {plaidItems.map((item) => (
                  <li key={item.id} className="settings-bank-item">
                    <span className="icon-pill icon-pill--lavender icon-pill--md">
                      <Building2 style={{ width: "1.25rem", height: "1.25rem" }} />
                    </span>
                    <div>
                      <p style={{ fontWeight: 500, color: "var(--color-fg)" }}>{item.institutionName ?? "Bank account"}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                        Connected {new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <ConnectBankButton onSuccess={fetchData} />
              {plaidItems.length > 0 && (
                <button onClick={handleSyncTransactions} disabled={isSyncing} className="btn btn--outline btn--sm" style={{ gap: "0.5rem" }}>
                  {isSyncing
                    ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                    : <RefreshCw style={{ width: "0.875rem", height: "0.875rem" }} />
                  }
                  Sync Transactions
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Home Screen name */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Home Screen name</h3>
            <p className="card-description">
              The label shown under the icon when you add HoneyCart to your phone&apos;s Home Screen. Leave blank to use &quot;HoneyCart&quot;.
            </p>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-field">
              <label className="form-label" htmlFor="display-name">
                <Home style={{ width: "0.875rem", height: "0.875rem", display: "inline", marginRight: "0.375rem", verticalAlign: "middle" }} />
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveDisplayName()}
                placeholder="e.g. Smith Family Budget"
                className="form-input form-input--narrow2"
                maxLength={30}
              />
            </div>
            {displayNameSaved && (
              <div className="alert alert--success" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check style={{ width: "1rem", height: "1rem" }} />
                Name saved! Re-add to Home Screen to see the new label.
              </div>
            )}
            <button onClick={handleSaveDisplayName} className="btn btn--soft" style={{ gap: "0.5rem", alignSelf: "flex-start" }}>
              <Check style={{ width: "1rem", height: "1rem" }} />
              Save name
            </button>
          </div>
        </div>

        {/* Budget preferences */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Budget Preferences</h3>
            <p className="card-description">Adjust how your grocery budget is calculated.</p>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-field">
              <label className="form-label" htmlFor="pct-slider">Grocery % of flexible budget</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  id="pct-slider" type="range" min={0} max={100} step={1}
                  value={settings.groceryPercent}
                  onChange={(e) => setSettings((s) => ({ ...s, groceryPercent: parseInt(e.target.value, 10) }))}
                  className="form-range" style={{ flex: 1 }}
                />
                <span style={{ width: "3rem", textAlign: "right", fontWeight: 700, color: "var(--blush-700)" }}>
                  {settings.groceryPercent}%
                </span>
              </div>
            </div>

            <hr className="separator" />

            <div className="form-field">
              <label className="form-label" htmlFor="savings-goal">Monthly savings goal ($)</label>
              <input
                id="savings-goal" type="number" min="0" step="10"
                value={settings.savingsGoal}
                onChange={(e) => setSettings((s) => ({ ...s, savingsGoal: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="form-input form-input--narrow2"
              />
            </div>

            {saveSuccess && (
              <div className="alert alert--success" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Check style={{ width: "1rem", height: "1rem" }} />
                Preferences saved!
              </div>
            )}

            <button onClick={handleSaveSettings} disabled={isSaving} className="btn btn--soft" style={{ gap: "0.5rem", alignSelf: "flex-start" }}>
              {isSaving && <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />}
              Save Preferences
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
