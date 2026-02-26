import { describe, it, expect } from "vitest";
import { categorySchema } from "@/lib/validations/category";

describe("categorySchema", () => {
    it("passes with a valid name", () => {
        const result = categorySchema.safeParse({ name: "Vape Juices" });
        expect(result.success).toBe(true);
    });

    it("passes with name and a valid UUID parent_id", () => {
        const result = categorySchema.safeParse({
            name: "Sub Category",
            parent_id: "123e4567-e89b-12d3-a456-426614174000",
        });
        expect(result.success).toBe(true);
    });

    it("passes when parent_id is null (top-level category)", () => {
        const result = categorySchema.safeParse({
            name: "Devices",
            parent_id: null,
        });
        expect(result.success).toBe(true);
    });

    it("passes with all optional fields", () => {
        const result = categorySchema.safeParse({
            name: "Accessories",
            description: "All vape accessories",
            parent_id: null,
            display_order: 5,
        });
        expect(result.success).toBe(true);
    });

    it("fails when name is only 1 character", () => {
        const result = categorySchema.safeParse({ name: "X" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("name");
        }
    });

    it("fails when parent_id is a non-UUID string", () => {
        const result = categorySchema.safeParse({
            name: "Valid Name",
            parent_id: "not-a-uuid",
        });
        expect(result.success).toBe(false);
    });
});
