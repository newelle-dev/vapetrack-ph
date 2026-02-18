import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a PIN using bcrypt.
 * @param pin - The plaintext 4-6 digit PIN
 * @returns The bcrypt hash of the PIN
 */
export async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a plaintext PIN against a bcrypt hash.
 * @param pin - The plaintext PIN to verify
 * @param hash - The stored bcrypt hash
 * @returns True if the PIN matches the hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
}
