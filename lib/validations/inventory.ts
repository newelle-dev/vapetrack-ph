import { z } from "zod";

export const stockAdjustmentSchema = z.object({
    variant_id: z.string().uuid("Invalid variant ID"),
    branch_id: z.string().uuid("Invalid branch ID"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    movement_type: z.enum(["stock_in", "stock_out"]),
    reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
