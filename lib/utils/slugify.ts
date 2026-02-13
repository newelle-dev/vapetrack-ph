/**
 * Convert text to URL-friendly slug
 * Example: "Vape Shop Manila" → "vape-shop-manila"
 */

import { randomBytes } from "crypto";

/**
 * Convert text to URL-friendly slug.
 * - Normalizes Unicode (NFKD) and strips diacritics
 * - Keeps letters/numbers and hyphens
 * Example: "Vape Shop Manila" → "vape-shop-manila"
 */
export function slugify(text: string): string {
  // Normalize and remove combining marks (diacritics)
  const normalized = text.normalize("NFKD").replace(/\p{M}/gu, "");

  return normalized
    .toLowerCase()
    .trim()
    // remove any char that's not a letter, number, space or hyphen
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    // collapse spaces/underscores/hyphens into single hyphen
    .replace(/[\s_-]+/g, "-")
    // trim leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate unique slug by appending a secure random hex suffix.
 * Use as a fallback when a base slug collides in the DB.
 * - suffixBytes: number of random bytes (default 3 → 6 hex chars)
 */
export function generateUniqueSlug(baseSlug: string, suffixBytes = 3): string {
  const suffix = randomBytes(suffixBytes).toString("hex");
  return `${baseSlug}-${suffix}`;
}

