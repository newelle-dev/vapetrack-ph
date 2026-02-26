import { describe, it, expect } from "vitest";
import { stockAdjustmentSchema } from "@/lib/validations/inventory";

const validPayload = {
    variant_id: "123e4567-e89b-12d3-a456-426614174000",
    branch_id: "123e4567-e89b-12d3-a456-426614174001",
    quantity: 10,
    movement_type: "stock_in" as const,
    reason: "New delivery received",
};

describe("stockAdjustmentSchema", () => {
    it("passes with a valid stock_in payload", () => {
        const result = stockAdjustmentSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
    });

    it("passes with a valid stock_out payload", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            movement_type: "stock_out",
        });
        expect(result.success).toBe(true);
    });

    it("fails when variant_id is not a valid UUID", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            variant_id: "not-a-uuid",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("variant_id");
        }
    });

    it("fails when branch_id is not a valid UUID", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            branch_id: "invalid",
        });
        expect(result.success).toBe(false);
    });

    it("fails when quantity is not an integer (float)", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            quantity: 5.5,
        });
        expect(result.success).toBe(false);
    });

    it("fails when quantity is zero", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            quantity: 0,
        });
        expect(result.success).toBe(false);
    });

    it("fails when quantity is negative", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            quantity: -5,
        });
        expect(result.success).toBe(false);
    });

    it("fails with an invalid movement_type", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            movement_type: "restock",
        });
        expect(result.success).toBe(false);
    });

    it("fails when reason is empty", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            reason: "",
        });
        expect(result.success).toBe(false);
    });

    it("fails when reason exceeds 500 characters", () => {
        const result = stockAdjustmentSchema.safeParse({
            ...validPayload,
            reason: "x".repeat(501),
        });
        expect(result.success).toBe(false);
    });
});
