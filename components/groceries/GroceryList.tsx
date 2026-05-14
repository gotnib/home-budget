"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <ul className="space-y-2">
      {items.map((item) => {
        const checked = item.status === "purchased";
        const lineTotal =
          item.estimatedPrice != null
            ? (item.estimatedPrice * item.quantity).toFixed(2)
            : null;

        return (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-150 sm:px-4",
              checked
                ? "border-sage-200 bg-sage-50/80 opacity-70"
                : "border-cream-200 bg-white hover:border-cream-300"
            )}
          >
            {/* Checkbox — large tap target */}
            <button
              type="button"
              onClick={() =>
                onUpdate(item.id, { status: checked ? "planned" : "purchased" })
              }
              className={cn(
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 touch-manipulation",
                checked
                  ? "border-sage-400 bg-sage-400 text-white"
                  : "border-cream-300 hover:border-sage-300 hover:bg-sage-50"
              )}
              aria-label={checked ? "Mark as not purchased" : "Mark as purchased"}
              style={{ minWidth: 24, minHeight: 24 }}
            >
              {checked && (
                <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Name */}
            <span
              className={cn(
                "flex-1 min-w-0 text-sm font-medium leading-snug",
                checked && "line-through text-muted-foreground"
              )}
            >
              {item.name}
            </span>

            {/* Quantity stepper */}
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })
                }
                disabled={item.quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-cream-100 disabled:opacity-30 transition-colors touch-manipulation"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-semibold tabular">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdate(item.id, { quantity: item.quantity + 1 })
                }
                aria-label="Increase quantity"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-cream-100 transition-colors touch-manipulation"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Price */}
            <span className="w-14 text-right text-xs text-muted-foreground tabular hidden sm:block">
              {lineTotal ? `$${lineTotal}` : "—"}
            </span>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              aria-label="Remove item"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground/50 hover:bg-blush-50 hover:text-blush-500 transition-colors touch-manipulation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
