import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, CartItem } from "@/lib/hooks/useCart";

// Helper to build a CartItem without quantity (as addItem accepts)
const makeItem = (
    variantId: string,
    price: number,
    capitalCost: number
): Omit<CartItem, "quantity"> => ({
    variantId,
    productName: "Test Product",
    variantName: "30ml",
    sku: `SKU-${variantId}`,
    price,
    capitalCost,
});

// Reset the store state before each test for isolation
beforeEach(() => {
    useCartStore.setState({ items: [] });
});

describe("addItem", () => {
    it("adds a new item with quantity 1", () => {
        useCartStore.getState().addItem(makeItem("v1", 100, 60));
        const { items } = useCartStore.getState();
        expect(items).toHaveLength(1);
        expect(items[0].variantId).toBe("v1");
        expect(items[0].quantity).toBe(1);
    });

    it("increments quantity instead of adding a duplicate item", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.addItem(makeItem("v1", 100, 60));
        const { items } = useCartStore.getState();
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(2);
    });

    it("adds multiple different items as separate entries", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.addItem(makeItem("v2", 200, 120));
        const { items } = useCartStore.getState();
        expect(items).toHaveLength(2);
    });
});

describe("removeItem", () => {
    it("removes an item by variantId", () => {
        useCartStore.getState().addItem(makeItem("v1", 100, 60));
        useCartStore.getState().removeItem("v1");
        expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("only removes the specified item, leaving others intact", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.addItem(makeItem("v2", 200, 120));
        store.removeItem("v1");
        const { items } = useCartStore.getState();
        expect(items).toHaveLength(1);
        expect(items[0].variantId).toBe("v2");
    });

    it("does nothing when removing a non-existent variantId", () => {
        useCartStore.getState().addItem(makeItem("v1", 100, 60));
        useCartStore.getState().removeItem("non-existent");
        expect(useCartStore.getState().items).toHaveLength(1);
    });
});

describe("updateQuantity", () => {
    it("updates an item to a specific quantity", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.updateQuantity("v1", 5);
        expect(useCartStore.getState().items[0].quantity).toBe(5);
    });

    it("removes the item when quantity is set to 0", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.updateQuantity("v1", 0);
        expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("removes the item when quantity is set to a negative number", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.updateQuantity("v1", -1);
        expect(useCartStore.getState().items).toHaveLength(0);
    });
});

describe("clearCart", () => {
    it("empties all items from the cart", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.addItem(makeItem("v2", 200, 120));
        store.clearCart();
        expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("does nothing if the cart is already empty", () => {
        useCartStore.getState().clearCart();
        expect(useCartStore.getState().items).toHaveLength(0);
    });
});

describe("getTotal", () => {
    it("returns 0 for an empty cart", () => {
        expect(useCartStore.getState().getTotal()).toBe(0);
    });

    it("calculates total as sum of (price × quantity) for one item", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.updateQuantity("v1", 3);
        expect(store.getTotal()).toBe(300);
    });

    it("calculates total correctly with multiple different items", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60)); // qty 1 → 100
        store.addItem(makeItem("v2", 200, 120)); // qty 1 → 200
        store.updateQuantity("v1", 2); // qty 2 → 200
        // Total: 200 + 200 = 400
        expect(store.getTotal()).toBe(400);
    });
});

describe("getItemCount", () => {
    it("returns 0 for an empty cart", () => {
        expect(useCartStore.getState().getItemCount()).toBe(0);
    });

    it("returns the total quantity across all items", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60));
        store.addItem(makeItem("v2", 200, 120));
        store.updateQuantity("v1", 3);
        store.updateQuantity("v2", 2);
        // 3 + 2 = 5
        expect(store.getItemCount()).toBe(5);
    });
});

describe("getProfit", () => {
    it("returns 0 for an empty cart", () => {
        expect(useCartStore.getState().getProfit()).toBe(0);
    });

    it("calculates profit as sum of (price - capitalCost) × quantity for one item", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 60)); // profit/unit = 40
        store.updateQuantity("v1", 3); // total profit = 120
        expect(store.getProfit()).toBe(120);
    });

    it("calculates profit correctly with multiple items", () => {
        const store = useCartStore.getState();
        // Item v1: price=100, cost=60, qty=2 → profit = 80
        // Item v2: price=350, cost=200, qty=3 → profit = 450
        store.addItem(makeItem("v1", 100, 60));
        store.addItem(makeItem("v2", 350, 200));
        store.updateQuantity("v1", 2);
        store.updateQuantity("v2", 3);

        expect(store.getProfit()).toBe(80 + 450); // 530
    });

    it("returns a profit of 0 when price equals capitalCost", () => {
        const store = useCartStore.getState();
        store.addItem(makeItem("v1", 100, 100));
        store.updateQuantity("v1", 5);
        expect(store.getProfit()).toBe(0);
    });
});
