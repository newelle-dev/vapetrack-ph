import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("passes with a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("fails with an empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("fails with an invalid email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("fails when password is fewer than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password");
    }
  });

  it("passes with a password of exactly 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "abc123",
    });
    expect(result.success).toBe(true);
  });
});

describe("signupSchema", () => {
  const validData = {
    fullName: "John Doe",
    shopName: "My Vape Shop",
    email: "john@example.com",
    password: "securepassword",
    confirmPassword: "securepassword",
  };

  it("passes with all valid fields and matching passwords", () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when passwords do not match", () => {
    const result = signupSchema.safeParse({
      ...validData,
      confirmPassword: "differentpassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path).flat();
      expect(paths).toContain("confirmPassword");
    }
  });

  it("fails when fullName is shorter than 2 characters", () => {
    const result = signupSchema.safeParse({ ...validData, fullName: "J" });
    expect(result.success).toBe(false);
  });

  it("fails when shopName is shorter than 2 characters", () => {
    const result = signupSchema.safeParse({ ...validData, shopName: "X" });
    expect(result.success).toBe(false);
  });

  it("fails when password is shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("fails with an invalid email", () => {
    const result = signupSchema.safeParse({ ...validData, email: "not-email" });
    expect(result.success).toBe(false);
  });
});
