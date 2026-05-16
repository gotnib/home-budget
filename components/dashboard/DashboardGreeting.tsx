"use client";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardGreeting({ displayName, fallbackName }: { displayName: string | null; fallbackName: string | null }) {
  const name = displayName || fallbackName;
  return (
    <>
      <p className="dash-hero-greeting">{getGreeting()}</p>
      <h1 className="dash-hero-title">
        {name ? `${name}'s` : "Your"} money hive is buzzing 🐝
      </h1>
    </>
  );
}
