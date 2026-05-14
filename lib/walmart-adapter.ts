export interface GrocerySearchResult {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  unit?: string;
}

export interface CartResult {
  cartId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}

export interface OrderResult {
  status: "manual_checkout_required" | "submitted";
  message: string;
  checkoutUrl?: string;
}

export interface GroceryItem {
  name: string;
  quantity: number;
  estimatedPrice?: number;
}

export interface GroceryProvider {
  searchItems(query: string): Promise<GrocerySearchResult[]>;
  createCart(items: GroceryItem[]): Promise<CartResult>;
  submitCart(cartId: string): Promise<OrderResult>;
}

class WalmartAdapter implements GroceryProvider {
  async searchItems(query: string): Promise<GrocerySearchResult[]> {
    // Mock results - real integration requires Walmart API approval
    const mockItems: GrocerySearchResult[] = [
      { id: "1", name: `${query} (Great Value)`, price: 2.98, unit: "each" },
      { id: "2", name: `Organic ${query}`, price: 4.47, unit: "each" },
      { id: "3", name: `${query} - Family Pack`, price: 8.97, unit: "pack" },
    ];
    return mockItems;
  }

  async createCart(items: GroceryItem[]): Promise<CartResult> {
    const cartId = `cart_${Date.now()}`;
    const total = items.reduce(
      (sum, item) => sum + (item.estimatedPrice ?? 0) * item.quantity,
      0
    );
    return {
      cartId,
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.estimatedPrice ?? 0,
      })),
      total,
    };
  }

  async submitCart(_cartId: string): Promise<OrderResult> {
    return {
      status: "manual_checkout_required",
      message:
        "Walmart checkout requires approved integration access. Your list is ready — open Walmart to complete your order.",
      checkoutUrl: "https://www.walmart.com/cart",
    };
  }
}

export const walmartAdapter = new WalmartAdapter();
