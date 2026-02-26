import { describe, it, expect } from "vitest";
import { organizationUpdateSchema } from "@/lib/validations/organization";

describe("organizationUpdateSchema", () => {
    it("passes with a valid organization name", () => {
        const result = organizationUpdateSchema.safeParse({ name: "My Vape Shop" });
        expect(result.success).toBe(true);
    });

    it("passes with a name of exactly 2 characters", () => {
        const result = organizationUpdateSchema.safeParse({ name: "AB" });
        expect(result.success).toBe(true);
    });

    it("fails when name is only 1 character", () => {
        const result = organizationUpdateSchema.safeParse({ name: "A" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("name");
        }
    });

    it("fails when name is empty", () => {
        const result = organizationUpdateSchema.safeParse({ name: "" });
        expect(result.success).toBe(false);
    });

    it("passes with optional address and phone", () => {
        const result = organizationUpdateSchema.safeParse({
            name: "Complete Shop",
            address: "123 Main St, Manila",
            phone: "09171234567",
        });
        expect(result.success).toBe(true);
    });
});
