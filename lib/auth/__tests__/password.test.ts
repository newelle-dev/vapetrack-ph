import { describe, it, expect } from "vitest";
import { hashPin, verifyPin } from "@/lib/auth/password";

describe("hashPin", () => {
    it("returns a bcrypt hash string", async () => {
        const hash = await hashPin("1234");
        expect(typeof hash).toBe("string");
        expect(hash.length).toBeGreaterThan(0);
    });

    it("produces a hash starting with a bcrypt identifier ($2a$ or $2b$)", async () => {
        const hash = await hashPin("1234");
        expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it("produces different hashes for the same PIN on each call (salt uniqueness)", async () => {
        const [hash1, hash2] = await Promise.all([hashPin("1234"), hashPin("1234")]);
        expect(hash1).not.toBe(hash2);
    });
});

describe("verifyPin", () => {
    it("returns true for a matching PIN and hash", async () => {
        const hash = await hashPin("1234");
        const result = await verifyPin("1234", hash);
        expect(result).toBe(true);
    });

    it("returns false for a non-matching PIN", async () => {
        const hash = await hashPin("1234");
        const result = await verifyPin("5678", hash);
        expect(result).toBe(false);
    });

    it("returns false for an empty string against a valid hash", async () => {
        const hash = await hashPin("1234");
        const result = await verifyPin("", hash);
        expect(result).toBe(false);
    });

    it("correctly verifies a 6-digit PIN", async () => {
        const hash = await hashPin("123456");
        const result = await verifyPin("123456", hash);
        expect(result).toBe(true);
    });

    it("returns false when the PIN is a prefix of the real PIN", async () => {
        const hash = await hashPin("1234");
        const result = await verifyPin("123", hash);
        expect(result).toBe(false);
    });
});
