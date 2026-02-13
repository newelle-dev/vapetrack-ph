import { z } from "zod";

/**
 * Validation schema for login form
 */
export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validation schema for signup form
 */
export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    shopName: z.string().min(2, "Shop name required"),
    email: z.string().email("Valid email required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;