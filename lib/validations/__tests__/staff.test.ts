import { describe, it, expect } from "vitest";
import { createStaffSchema, updateStaffSchema } from "@/lib/validations/staff";

const validCreate = {
    full_name: "Maria Santos",
    pin: "1234",
    is_active: true,
    can_manage_inventory: false,
    can_view_profits: false,
    can_view_reports: false,
};

describe("createStaffSchema", () => {
    it("passes with a valid 4-digit PIN", () => {
        const result = createStaffSchema.safeParse(validCreate);
        expect(result.success).toBe(true);
    });

    it("passes with a valid 6-digit PIN", () => {
        const result = createStaffSchema.safeParse({ ...validCreate, pin: "123456" });
        expect(result.success).toBe(true);
    });

    it("passes with a valid 5-digit PIN", () => {
        const result = createStaffSchema.safeParse({ ...validCreate, pin: "12345" });
        expect(result.success).toBe(true);
    });

    it("fails with a 3-digit PIN (too short)", () => {
        const result = createStaffSchema.safeParse({ ...validCreate, pin: "123" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("pin");
        }
    });

    it("fails with a 7-digit PIN (too long)", () => {
        const result = createStaffSchema.safeParse({ ...validCreate, pin: "1234567" });
        expect(result.success).toBe(false);
    });

    it("fails with a non-numeric PIN (letters)", () => {
        const result = createStaffSchema.safeParse({ ...validCreate, pin: "abcd" });
        expect(result.success).toBe(false);
    });

    it("fails with a non-numeric PIN (mixed)", () => {
        const result = createStaffSchema.safeParse({ ...validCreate, pin: "12ab" });
        expect(result.success).toBe(false);
    });

    it("fails when full_name is shorter than 2 characters", () => {
        const result = createStaffSchema.safeParse({ ...validCreate, full_name: "J" });
        expect(result.success).toBe(false);
    });

    it("passes with an optional valid email", () => {
        const result = createStaffSchema.safeParse({
            ...validCreate,
            email: "maria@shop.com",
        });
        expect(result.success).toBe(true);
    });

    it("passes with an empty string email (optional)", () => {
        const result = createStaffSchema.safeParse({
            ...validCreate,
            email: "",
        });
        expect(result.success).toBe(true);
    });

    it("fails with an invalid email format", () => {
        const result = createStaffSchema.safeParse({
            ...validCreate,
            email: "not-an-email",
        });
        expect(result.success).toBe(false);
    });
});

describe("updateStaffSchema", () => {
    const validUpdate = {
        full_name: "Maria Santos",
        is_active: true,
        can_manage_inventory: false,
        can_view_profits: false,
        can_view_reports: false,
    };

    it("passes with only required fields (no PIN)", () => {
        const result = updateStaffSchema.safeParse(validUpdate);
        expect(result.success).toBe(true);
    });

    it("passes with an empty string PIN (keep existing)", () => {
        const result = updateStaffSchema.safeParse({ ...validUpdate, pin: "" });
        expect(result.success).toBe(true);
    });

    it("passes with a valid new PIN", () => {
        const result = updateStaffSchema.safeParse({ ...validUpdate, pin: "9999" });
        expect(result.success).toBe(true);
    });

    it("fails with an invalid PIN format", () => {
        const result = updateStaffSchema.safeParse({ ...validUpdate, pin: "abc" });
        expect(result.success).toBe(false);
    });
});
