"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cream-300 py-16 text-center">
        <span className="text-4xl">🛒</span>
        <p className="mt-3 font-medium text-muted-foreground">Your cart is empty</p>
        <p className="text-sm text-muted-foreground/70">Search for items above to get started</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const checked = item.status === "purchased";
        return (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
              checked
                ? "border-sage-200 bg-sage-50 opacity-70"
                : "border-cream-200 bg-white"
            )}
          >
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => onUpdate(item.id, { status: checked ? "planned" : "purchased" })}
              className={cn(
                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                checked
                  ? "border-sage-400 bg-sage-400 text-white"
                  : "border-cream-300 hover:border-sage-300"
              )}
              aria-label={checked ? "Mark as not purchased" : "Mark as purchased"}
            >
              {checked && (
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Name */}
            <span
              className={cn(
                "flex-1 text-sm font-medium",
                checked && "line-through text-muted-foreground"
              )}
            >
              {item.name}
            </span>

            {/* Quantity stepper */}
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-cream-100"
                onClick={() => onUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-cream-100"
                onClick={() => onUpdate(item.id, { quantity: item.quantity + 1 })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Price */}
            {item.estimatedPrice != null && (
              <span className="w-16 text-right text-sm text-muted-foreground">
                ${(item.estimatedPrice * item.quantity).toFixed(2)}
              </span>
            )}

            {/* Delete */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:bg-blush-50 hover:text-blush-600"
              onClick={() => onDelete(item.id)}
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
