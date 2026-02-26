import { describe, it, expect } from "vitest";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

describe("slugify", () => {
    it("converts basic text to a slug", () => {
        expect(slugify("Vape Shop Manila")).toBe("vape-shop-manila");
    });

    it("converts to lowercase", () => {
        expect(slugify("HELLO WORLD")).toBe("hello-world");
    });

    it("replaces spaces with hyphens", () => {
        expect(slugify("hello world")).toBe("hello-world");
    });

    it("collapses multiple spaces into a single hyphen", () => {
        expect(slugify("hello   world")).toBe("hello-world");
    });

    it("trims leading and trailing spaces (and resulting hyphens)", () => {
        expect(slugify("  hello world  ")).toBe("hello-world");
    });

    it("removes special characters (@, !, #)", () => {
        expect(slugify("Shop #1 @Manila!")).toBe("shop-1-manila");
    });

    it("handles Filipino/accented characters by normalizing them", () => {
        // NFKD normalization strips diacritics, resulting in base ASCII
        const result = slugify("Señorita");
        expect(result).toMatch(/^senorita$|^seniorita$/); // 'ñ' → 'n'
    });

    it("strips leading and trailing hyphens", () => {
        expect(slugify("---hello---")).toBe("hello");
    });

    it("returns an empty string for empty input", () => {
        expect(slugify("")).toBe("");
    });

    it("returns an empty string for only special characters", () => {
        expect(slugify("!@#$%^&*()")).toBe("");
    });

    it("handles numbers correctly", () => {
        expect(slugify("Pod 2000 Pro")).toBe("pod-2000-pro");
    });

    it("does not produce consecutive hyphens", () => {
        const result = slugify("Hello - World");
        expect(result).not.toContain("--");
    });
});

describe("generateUniqueSlug", () => {
    it("appends a hex suffix to the base slug", () => {
        const base = "vape-shop";
        const result = generateUniqueSlug(base);
        expect(result).toMatch(/^vape-shop-[0-9a-f]{6}$/);
    });

    it("has the format {base}-{6 hex chars} by default", () => {
        const result = generateUniqueSlug("my-shop");
        const parts = result.split("-");
        const suffix = parts[parts.length - 1];
        expect(suffix).toHaveLength(6);
        expect(suffix).toMatch(/^[0-9a-f]+$/);
    });

    it("produces different hashes on each call (probabilistic uniqueness)", () => {
        const a = generateUniqueSlug("base");
        const b = generateUniqueSlug("base");
        // While not guaranteed, two random 6-hex-char suffixes colliding is ~1 in 16 million.
        expect(a).not.toBe(b);
    });

    it("respects custom suffixBytes", () => {
        const result = generateUniqueSlug("shop", 4); // 4 bytes = 8 hex chars
        const parts = result.split("-");
        const suffix = parts[parts.length - 1];
        expect(suffix).toHaveLength(8);
    });
});
