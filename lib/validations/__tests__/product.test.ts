import { describe, it, expect } from "vitest";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";

const validVariant = {
    name: "30ml",
    sku: "VAPE-001",
    selling_price: 350,
    capital_cost: 200,
    initial_stock: 10,
};

const validProduct = {
    name: "Cloud Nine Mango",
    brand: "Cloud Nine",
    description: "A tropical mango flavor.",
    category_id: "123e4567-e89b-12d3-a456-426614174000",
    is_active: true,
    variants: [validVariant],
};

describe("createProductSchema", () => {
    it("passes with a valid product and one variant", () => {
        const result = createProductSchema.safeParse(validProduct);
        expect(result.success).toBe(true);
    });

    it("fails when variants array is empty", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            variants: [],
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("variants");
        }
    });

    it("fails when SKU contains invalid characters (spaces)", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            variants: [{ ...validVariant, sku: "VAPE 001" }],
        });
        expect(result.success).toBe(false);
    });

    it("fails when SKU contains special characters (@)", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            variants: [{ ...validVariant, sku: "VAPE@001" }],
        });
        expect(result.success).toBe(false);
    });

    it("fails when selling_price is negative", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            variants: [{ ...validVariant, selling_price: -100 }],
        });
        expect(result.success).toBe(false);
    });

    it("fails when selling_price is zero", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            variants: [{ ...validVariant, selling_price: 0 }],
        });
        expect(result.success).toBe(false);
    });

    it("fails when capital_cost is negative", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            variants: [{ ...validVariant, capital_cost: -1 }],
        });
        expect(result.success).toBe(false);
    });

    it("passes when capital_cost is zero (allowed)", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            variants: [{ ...validVariant, capital_cost: 0 }],
        });
        expect(result.success).toBe(true);
    });

    it("fails when product name is shorter than 2 characters", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            name: "X",
        });
        expect(result.success).toBe(false);
    });

    it("fails when category_id is not a UUID", () => {
        const result = createProductSchema.safeParse({
            ...validProduct,
            category_id: "not-a-uuid",
        });
        expect(result.success).toBe(false);
    });
});

describe("updateProductSchema", () => {
    it("passes with a valid update payload", () => {
        const result = updateProductSchema.safeParse({
            name: "Cloud Nine Mango v2",
            category_id: "123e4567-e89b-12d3-a456-426614174000",
            variants: [
                {
                    ...validVariant,
                    // no initial_stock for update
                    initial_stock: undefined,
                    id: "123e4567-e89b-12d3-a456-426614174001",
                },
            ],
        });
        expect(result.success).toBe(true);
    });
});
