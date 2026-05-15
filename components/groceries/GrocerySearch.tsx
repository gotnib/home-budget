"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  price: number;
  unit?: string;
}

interface GrocerySearchProps {
  onAddItem: (item: { name: string; quantity: number; estimatedPrice: number }) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function GrocerySearch({ onAddItem }: GrocerySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) { setResults([]); setIsOpen(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/groceries/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { search(debouncedQuery); }, [debouncedQuery, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: SearchResult) {
    onAddItem({ name: result.name, quantity: 1, estimatedPrice: result.price });
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "var(--color-muted)", pointerEvents: "none" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for groceries (e.g. milk, bread, eggs...)"
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="form-input form-input--icon-left"
          style={{ paddingRight: isLoading ? "2.5rem" : undefined }}
        />
        {isLoading && (
          <Loader2 style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "var(--color-muted)", animation: "spin 1s linear infinite" }} />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 50, marginTop: "0.25rem", overflow: "hidden", borderRadius: "0.75rem", border: "1px solid var(--cream-200)", background: "white", boxShadow: "var(--shadow-soft-lg)" }}>
          <ul style={{ maxHeight: "15rem", overflowY: "auto", padding: "0.25rem 0" }}>
            {results.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 1rem", textAlign: "left", fontSize: "0.875rem", background: "none", border: "none", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--cream-100)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <div>
                    <p style={{ fontWeight: 500, color: "var(--color-fg)" }}>{result.name}</p>
                    {result.unit && <p style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{result.unit}</p>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--sage-700)" }}>${result.price.toFixed(2)}</span>
                    <span style={{ display: "flex", width: "1.5rem", height: "1.5rem", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--blush-100)", color: "var(--blush-600)" }}>
                      <Plus style={{ width: "0.875rem", height: "0.875rem" }} />
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
