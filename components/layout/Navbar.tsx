"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  Receipt,
  ShoppingCart,
  Settings,
  LogOut,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
      {/* ─── Desktop top bar ─── */}
      <header className="sticky top-0 z-50 hidden border-b border-cream-200/80 bg-white/85 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-honey-300 via-honey-400 to-honey-600 shadow-honey text-white transition-transform duration-300 group-hover:scale-105">
              <Wallet className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              HoneyCart
              <span className="ml-1.5 font-normal text-muted-foreground text-[15px]">
                Budget
              </span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "text-honey-700"
                      : "text-muted-foreground hover:text-foreground hover:bg-cream-100"
                  )}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-honey-100 ring-1 ring-honey-200" />
                  )}
                  <Icon
                    className={cn(
                      "relative h-4 w-4 transition-colors",
                      active ? "text-honey-500" : ""
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {userEmail && (
              <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground lg:block">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-cream-100 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile top bar ─── */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-cream-200/80 bg-white/90 px-4 backdrop-blur-xl md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-honey-300 via-honey-400 to-honey-600 shadow-honey text-white">
            <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          <span className="text-base font-bold tracking-tight text-foreground">
            HoneyCart
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-cream-100 hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* ─── Mobile fixed bottom tab bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-cream-200/80 bg-white/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              style={{ minHeight: 56 }}
            >
              {/* Active pill background */}
              {active && (
                <span className="absolute top-2 h-8 w-12 rounded-xl bg-honey-100 ring-1 ring-honey-200/80 animate-scale-in" />
              )}

              <span
                className={cn(
                  "relative flex h-5 w-5 items-center justify-center transition-all duration-300",
                  active ? "scale-110 text-honey-600" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
              </span>
              <span
                className={cn(
                  "relative text-[10px] font-semibold leading-none transition-colors duration-200",
                  active ? "text-honey-700" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile bottom spacer */}
      <div
        className="md:hidden"
        style={{ height: `calc(56px + env(safe-area-inset-bottom))` }}
      />
    </>
  );
}
