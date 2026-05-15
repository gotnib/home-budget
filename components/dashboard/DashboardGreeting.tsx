"use client";

import { useEffect, useState } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({ fallbackName }: { fallbackName: string | null }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    try {
      setName(localStorage.getItem("honey-display-name") || fallbackName);
    } catch {
      setName(fallbackName);
    }
  }, [fallbackName]);

  const displayName = name ?? fallbackName;

  return (
    <>
      <p className="dash-hero-greeting">{getGreeting()}</p>
      <h1 className="dash-hero-title">
        {displayName ? `${displayName}'s` : "Your"} money hive is buzzing 🐝
      </h1>
    </>
  );
}
