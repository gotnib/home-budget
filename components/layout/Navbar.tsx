"use client";

import { useEffect } from "react";
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

interface NavbarProps {
  userEmail?: string | null;
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  useEffect(() => {
    try {
      const name = localStorage.getItem("honey-display-name");
      if (name) {
        document.title = name;
        const meta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (meta) meta.setAttribute("content", name);
        else {
          const m = document.createElement("meta");
          m.setAttribute("name", "apple-mobile-web-app-title");
          m.setAttribute("content", name);
          document.head.appendChild(m);
        }
      }
    } catch { /* ignore */ }
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

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
        <button onClick={handleSignOut} className="btn-mobile-signout" aria-label="Sign out">
          <LogOut style={{ width: "1rem", height: "1rem" }} />
        </button>
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

      <div className="tab-bar-spacer" />
    </>
  );
}
