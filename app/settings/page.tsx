"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectBankButton } from "@/components/plaid/ConnectBankButton";
import { Building2, Check, Home, Loader2, LogOut, RefreshCw, Copy, Trash2, Users, Crown, RefreshCcw, UserMinus } from "lucide-react";

const LS_DISPLAY_NAME = "honey-display-name"; // kept as a fast client-side cache

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
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Household members
  interface HouseholdMember { id: string; email: string; householdRole: string | null; }
  const [household, setHousehold] = useState<{ id: string; workerCode: string | null; hiveCode: string | null; members: HouseholdMember[] } | null>(null);
  const [householdRole, setHouseholdRole] = useState<string>("queen");
  const [householdLoading, setHouseholdLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [householdError, setHouseholdError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      setUserEmail(user.email ?? null);
      const [itemsRes, budgetRes, settingsRes] = await Promise.all([fetch("/api/plaid/items"), fetch("/api/budget"), fetch("/api/user-settings")]);
      if (itemsRes.ok) { const items = await itemsRes.json(); setPlaidItems(Array.isArray(items) ? items : []); }
      if (budgetRes.ok) { const budget = await budgetRes.json(); setSettings({ groceryPercent: budget.groceryPercent ?? 25, savingsGoal: budget.savingsGoal ?? 0 }); }
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        setDisplayName(s.displayName ?? localStorage.getItem(LS_DISPLAY_NAME) ?? "");
      }
      // Load share token
      const shareRes = await fetch("/api/household/share");
      if (shareRes.ok) { const sd = await shareRes.json(); setShareToken(sd.token ?? null); }
      // Load household
      const hhRes = await fetch("/api/household");
      if (hhRes.ok) { const hd = await hhRes.json(); setHousehold(hd.household); setHouseholdRole(hd.role ?? "queen"); }
    } catch { setError("Failed to load settings."); }
    finally { setLoading(false); }
  }, [supabase, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSaveDisplayName() {
    const name = displayName.trim();
    // Write to DB (source of truth)
    fetch("/api/user-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name || null }),
    });
    // Also update localStorage cache so Navbar picks it up instantly
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
      window.dispatchEvent(new CustomEvent("honey-name-changed"));
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

  async function handleCreateHousehold() {
    setHouseholdLoading(true);
    setHouseholdError(null);
    try {
      const res = await fetch("/api/household", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to create household");
      setHousehold(d.household);
      setHouseholdRole("queen");
    } catch (err) {
      setHouseholdError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setHouseholdLoading(false); }
  }

  async function handleRefreshCodes() {
    setHouseholdLoading(true);
    try {
      const res = await fetch("/api/household", { method: "PATCH" });
      if (res.ok) { const d = await res.json(); setHousehold((h) => h ? { ...h, workerCode: d.household.workerCode, hiveCode: d.household.hiveCode } : h); }
    } catch { /* ignore */ }
    finally { setHouseholdLoading(false); }
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingMemberId(memberId);
    try {
      await fetch("/api/household/join", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId }) });
      setHousehold((h) => h ? { ...h, members: h.members.filter((m) => m.id !== memberId) } : h);
    } catch { /* ignore */ }
    finally { setRemovingMemberId(null); }
  }

  async function handleLeaveHousehold() {
    setHouseholdLoading(true);
    try {
      await fetch("/api/household", { method: "DELETE" });
      setHousehold(null);
      setHouseholdRole("queen");
    } catch { /* ignore */ }
    finally { setHouseholdLoading(false); }
  }

  function copyCode(code: string) {
    const joinUrl = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  async function handleGenerateShareLink() {
    setShareLoading(true);
    try {
      const res = await fetch("/api/household/share");
      if (res.ok) { const d = await res.json(); setShareToken(d.token); }
    } catch { /* ignore */ }
    finally { setShareLoading(false); }
  }

  async function handleRevokeShareLink() {
    setShareLoading(true);
    try {
      await fetch("/api/household/share", { method: "DELETE" });
      setShareToken(null);
    } catch { /* ignore */ }
    finally { setShareLoading(false); }
  }

  function handleCopyShareLink() {
    if (!shareToken) return;
    const url = `${window.location.origin}/household/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
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

        {/* Household members */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Household</h3>
            <p className="card-description">
              Invite family or roommates. <strong>Workers</strong> have full access. <strong>Hive</strong> members can only view the grocery list and meal plans.
            </p>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {householdRole !== "queen" ? (
              /* Member view */
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ background: "var(--cream-100)", borderRadius: "0.75rem", padding: "0.875rem 1rem", border: "1px solid var(--cream-200)" }}>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>Your role</p>
                  <p style={{ fontWeight: 700, color: "var(--color-fg)", textTransform: "capitalize" }}>{householdRole}</p>
                </div>
                <button onClick={handleLeaveHousehold} disabled={householdLoading} className="btn btn--outline btn--sm" style={{ gap: "0.5rem", color: "var(--blush-600)", alignSelf: "flex-start" }}>
                  {householdLoading ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} /> : <UserMinus style={{ width: "0.875rem", height: "0.875rem" }} />}
                  Leave household
                </button>
              </div>
            ) : household ? (
              /* Queen view — manage household */
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Invite codes */}
                {[
                  { label: "Worker invite link", code: household.workerCode, desc: "Full access" },
                  { label: "Hive invite link", code: household.hiveCode, desc: "Grocery & meal plan view only" },
                ].map(({ label, code, desc }) => code && (
                  <div key={label} style={{ background: "var(--cream-100)", borderRadius: "0.75rem", padding: "0.875rem 1rem", border: "1px solid var(--cream-200)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                      <div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-fg)" }}>{label}</p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{desc}</p>
                      </div>
                      <button
                        onClick={() => copyCode(code)}
                        className="btn btn--soft btn--sm"
                        style={{ gap: "0.375rem", fontSize: "0.8125rem" }}
                      >
                        {copiedCode === code ? <><Check style={{ width: "0.75rem", height: "0.75rem" }} /> Copied!</> : <><Copy style={{ width: "0.75rem", height: "0.75rem" }} /> Copy link</>}
                      </button>
                    </div>
                    <p style={{ fontSize: "0.8125rem", fontFamily: "monospace", color: "var(--honey-700)", letterSpacing: "0.05em" }}>{code}</p>
                  </div>
                ))}

                {/* Members list */}
                {household.members.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-fg)", marginBottom: "0.5rem" }}>Members</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {household.members.map((m) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", background: "white", borderRadius: "0.75rem", border: "1px solid var(--cream-200)" }}>
                          <Users style={{ width: "0.875rem", height: "0.875rem", color: "var(--color-muted)", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--color-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", textTransform: "capitalize" }}>{m.householdRole ?? "hive"}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            disabled={removingMemberId === m.id}
                            className="btn btn--outline btn--sm"
                            style={{ color: "var(--blush-600)", padding: "0.25rem 0.5rem" }}
                            aria-label="Remove member"
                          >
                            {removingMemberId === m.id ? <Loader2 style={{ width: "0.75rem", height: "0.75rem", animation: "spin 1s linear infinite" }} /> : <UserMinus style={{ width: "0.75rem", height: "0.75rem" }} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={handleRefreshCodes} disabled={householdLoading} className="btn btn--outline btn--sm" style={{ gap: "0.5rem", alignSelf: "flex-start", color: "var(--color-muted)" }}>
                  {householdLoading ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} /> : <RefreshCcw style={{ width: "0.875rem", height: "0.875rem" }} />}
                  Refresh invite codes
                </button>
              </div>
            ) : (
              /* No household yet */
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-start" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>Create a household to invite your partner or family members.</p>
                {householdError && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 0.875rem", background: "var(--blush-50)", borderRadius: "0.625rem", border: "1px solid var(--blush-200)", width: "100%" }}>
                    <p style={{ fontSize: "0.8125rem", color: "var(--blush-700)" }}>{householdError}</p>
                  </div>
                )}
                <button onClick={handleCreateHousehold} disabled={householdLoading} className="btn btn--soft" style={{ gap: "0.5rem" }}>
                  {householdLoading ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> : <><Crown style={{ width: "1rem", height: "1rem" }} /> Create household</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Household share */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Share with household</h3>
            <p className="card-description">
              Generate a read-only link so your partner or family can view your budget snapshot — no account needed.
            </p>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {shareToken ? (
              <>
                <div style={{ background: "var(--cream-100)", borderRadius: "0.75rem", padding: "0.75rem 1rem", border: "1px solid var(--cream-300)", wordBreak: "break-all" }}>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", marginBottom: "0.25rem", fontWeight: 600 }}>Share link</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-fg)", fontFamily: "monospace" }}>
                    {typeof window !== "undefined" ? `${window.location.origin}/household/${shareToken}` : `/household/${shareToken}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button onClick={handleCopyShareLink} className="btn btn--soft" style={{ gap: "0.5rem" }}>
                    {shareCopied
                      ? <><Check style={{ width: "0.875rem", height: "0.875rem" }} /> Copied!</>
                      : <><Copy style={{ width: "0.875rem", height: "0.875rem" }} /> Copy link</>
                    }
                  </button>
                  <button onClick={handleRevokeShareLink} disabled={shareLoading} className="btn btn--outline btn--sm" style={{ gap: "0.5rem", color: "var(--color-muted)" }}>
                    {shareLoading
                      ? <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                      : <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
                    }
                    Revoke
                  </button>
                </div>
              </>
            ) : (
              <button onClick={handleGenerateShareLink} disabled={shareLoading} className="btn btn--soft" style={{ gap: "0.5rem", alignSelf: "flex-start" }}>
                {shareLoading
                  ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                  : <><Users style={{ width: "1rem", height: "1rem" }} /> Generate share link</>
                }
              </button>
            )}
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
