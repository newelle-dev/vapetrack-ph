import { describe, it, expect } from "vitest";
import { branchCreateSchema } from "@/lib/validations/branch";

describe("branchCreateSchema", () => {
    it("passes with a valid branch name", () => {
        const result = branchCreateSchema.safeParse({ name: "Main Branch" });
        expect(result.success).toBe(true);
    });

    it("passes with all optional fields provided", () => {
        const result = branchCreateSchema.safeParse({
            name: "Makati Branch",
            address: "123 Ayala Ave",
            phone: "09171234567",
            is_default: false,
            is_active: true,
        });
        expect(result.success).toBe(true);
    });

    it("passes with a name of exactly 2 characters", () => {
        const result = branchCreateSchema.safeParse({ name: "MN" });
        expect(result.success).toBe(true);
    });

    it("fails when name is only 1 character", () => {
        const result = branchCreateSchema.safeParse({ name: "M" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("name");
        }
    });

    it("fails when name is empty", () => {
        const result = branchCreateSchema.safeParse({ name: "" });
        expect(result.success).toBe(false);
    });

    it("passes without optional fields", () => {
        const result = branchCreateSchema.safeParse({ name: "BGC Branch" });
        expect(result.success).toBe(true);
    });
});
