"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, DollarSign, Receipt, ShoppingCart, Settings, LogOut, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/dashboard", label: "Home",      icon: LayoutDashboard },
  { href: "/budget",    label: "Budget",    icon: DollarSign },
  { href: "/bills",     label: "Bills",     icon: Receipt },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart },
  { href: "/settings",  label: "Settings",  icon: Settings },
];

const ROLE_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  queen:  { label: "Queen",  emoji: "👑", color: "var(--honey-800)",    bg: "var(--honey-100)"    },
  worker: { label: "Worker", emoji: "🐝", color: "var(--sage-800)",     bg: "var(--sage-100)"     },
  hive:   { label: "Hive",   emoji: "🍯", color: "var(--lavender-800)", bg: "var(--lavender-100)" },
};

interface NavbarProps {
  userEmail?: string | null;
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    function applyName(name: string) {
      try {
        document.title = name;
        localStorage.setItem("honey-display-name", name);
        const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (meta) meta.setAttribute("content", name);
        else {
          const m = document.createElement("meta");
          m.setAttribute("name", "apple-mobile-web-app-title");
          m.setAttribute("content", name);
          document.head.appendChild(m);
        }
      } catch { /* ignore */ }
    }

    try {
      const cached = localStorage.getItem("honey-display-name");
      if (cached) { applyName(cached); return; }
    } catch { /* ignore */ }

    fetch("/api/user-settings")
      .then((r) => r.ok ? r.json() : null)
      .then((s) => { if (s?.displayName) applyName(s.displayName); })
      .catch(() => { /* ignore */ });

    const handler = () => {
      try {
        const name = localStorage.getItem("honey-display-name");
        if (name) applyName(name);
      } catch { /* ignore */ }
    };
    window.addEventListener("honey-name-changed", handler);
    return () => window.removeEventListener("honey-name-changed", handler);
  }, []);

  useEffect(() => {
    fetch("/api/household")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.role) setUserRole(d.role); })
      .catch(() => { /* ignore */ });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const roleMeta = userRole ? ROLE_META[userRole] : null;

  return (
    <>
      {/* Desktop navbar */}
      <header className="navbar navbar-desktop">
        <div className="navbar-desktop-inner">
          <Link href="/dashboard" className="navbar-brand">
            <span className="navbar-logo-icon">
              <Wallet style={{ width: "1rem", height: "1rem" }} strokeWidth={2} />
            </span>
            <span className="navbar-logo-text">
              HoneyCart
              <span className="navbar-logo-sub">Budget</span>
            </span>
          </Link>

          <nav className="navbar-nav">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive(href) ? " active" : ""}`}
              >
                <Icon className="nav-link-icon" strokeWidth={isActive(href) ? 2.25 : 1.75} />
                <span className="nav-link-label">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="navbar-right">
            {roleMeta && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.25rem 0.625rem", borderRadius: "9999px", background: roleMeta.bg, color: roleMeta.color, fontSize: "0.75rem", fontWeight: 700 }}>
                {roleMeta.emoji} {roleMeta.label}
              </span>
            )}
            {userEmail && <span className="navbar-email">{userEmail}</span>}
            <button onClick={handleSignOut} className="btn-sign-out">
              <LogOut style={{ width: "1rem", height: "1rem" }} />
              <span className="btn-sign-out-label">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="navbar navbar-mobile">
        <Link href="/dashboard" className="navbar-mobile-brand">
          <span className="navbar-mobile-icon">
            <Wallet style={{ width: "0.875rem", height: "0.875rem" }} strokeWidth={2} />
          </span>
          <span className="navbar-mobile-name">HoneyCart</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {roleMeta && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", background: roleMeta.bg, color: roleMeta.color, fontSize: "0.6875rem", fontWeight: 700 }}>
              {roleMeta.emoji} {roleMeta.label}
            </span>
          )}
          <button onClick={handleSignOut} className="btn-mobile-signout" aria-label="Sign out">
            <LogOut style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="tab-bar" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`tab-item${active ? " active" : ""}`} aria-label={label}>
              {active && <span className="tab-item-bg" />}
              <span className="tab-item-icon">
                <Icon style={{ width: "1.625rem", height: "1.625rem" }} strokeWidth={active ? 2.25 : 1.75} />
              </span>
            </Link>
          );
        })}
      </nav>

    </>
  );
}