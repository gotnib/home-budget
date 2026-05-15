"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  estimatedPrice: number | null;
  status: string;
}

interface GroceryListProps {
  items: GroceryItem[];
  onUpdate: (id: string, data: { status?: string; quantity?: number }) => void;
  onDelete: (id: string) => void;
}

export function GroceryList({ items, onUpdate, onDelete }: GroceryListProps) {
  return (
    <ul className="grocery-items-list">
      {items.map((item) => {
        const checked = item.status === "purchased";
        const lineTotal = item.estimatedPrice != null
          ? (item.estimatedPrice * item.quantity).toFixed(2)
          : null;

        return (
          <li
            key={item.id}
            className={`grocery-item${checked ? " grocery-item--purchased" : ""}`}
          >
            <button
              type="button"
              onClick={() => onUpdate(item.id, { status: checked ? "planned" : "purchased" })}
              className={`grocery-check${checked ? " grocery-check--checked" : ""}`}
              aria-label={checked ? "Mark as not purchased" : "Mark as purchased"}
            >
              {checked && (
                <svg style={{ width: "0.875rem", height: "0.875rem" }} viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <span className={`grocery-name${checked ? " grocery-name--purchased" : ""}`}>
              {item.name}
            </span>

            <div className="grocery-qty">
              <button
                type="button"
                onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                disabled={item.quantity <= 1}
                aria-label="Decrease quantity"
                className="grocery-qty-btn"
              >
                <Minus style={{ width: "0.75rem", height: "0.75rem" }} />
              </button>
              <span className="grocery-qty-num">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
                aria-label="Increase quantity"
                className="grocery-qty-btn"
              >
                <Plus style={{ width: "0.75rem", height: "0.75rem" }} />
              </button>
            </div>

            <span className="grocery-price">{lineTotal ? `$${lineTotal}` : "—"}</span>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              aria-label="Remove item"
              className="grocery-delete"
            >
              <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
