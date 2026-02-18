import { z } from "zod";

/**
 * Validation schema for creating a staff member
 */
export const createStaffSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z
        .string()
        .email("Invalid email address")
        .optional()
        .or(z.literal("")),
    pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
    is_active: z.boolean().default(true),
    can_manage_inventory: z.boolean().default(false),
    can_view_profits: z.boolean().default(false),
    can_view_reports: z.boolean().default(false),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

/**
 * Validation schema for updating a staff member.
 * PIN is optional — leave blank to keep existing PIN.
 */
export const updateStaffSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z
        .string()
        .email("Invalid email address")
        .optional()
        .or(z.literal("")),
    pin: z
        .string()
        .regex(/^\d{4,6}$/, "PIN must be 4-6 digits")
        .optional()
        .or(z.literal("")),
    is_active: z.boolean().default(true),
    can_manage_inventory: z.boolean().default(false),
    can_view_profits: z.boolean().default(false),
    can_view_reports: z.boolean().default(false),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
