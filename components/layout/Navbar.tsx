"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  LayoutDashboard,
  DollarSign,
  Receipt,
  Settings,
  LogOut,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: DollarSign },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
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

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="sticky top-0 z-50 hidden border-b border-cream-200 bg-white/90 backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blush-300 to-blush-500 shadow-sm text-white">
              <Wallet className="h-4.5 w-4.5" />
            </span>
            <span className="text-[17px] font-bold tracking-tight text-foreground">
              HoneyCart
              <span className="ml-1 font-normal text-muted-foreground">Budget</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-blush-100 text-blush-700"
                      : "text-muted-foreground hover:bg-cream-100 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "text-blush-500")} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {userEmail && (
              <span className="hidden text-xs text-muted-foreground lg:block max-w-[180px] truncate">
                {userEmail}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-9 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-cream-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile top bar (logo + sign out only) ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-cream-200 bg-white/90 backdrop-blur-md px-4 h-14 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blush-300 to-blush-500 shadow-sm text-white">
            <Wallet className="h-3.5 w-3.5" />
          </span>
          <span className="text-[16px] font-bold tracking-tight text-foreground">
            HoneyCart
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* ── Mobile fixed bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-cream-200 bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors min-h-[56px]",
                active ? "text-blush-600" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center transition-all duration-150",
                  active && "scale-110"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active ? "text-blush-600" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile bottom spacer (pushes content above tab bar) ── */}
      <div className="h-[calc(56px+env(safe-area-inset-bottom))] md:hidden" />
    </>
  );
}
