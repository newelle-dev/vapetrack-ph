import { z } from "zod";

export const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional().or(z.literal("")),
    parent_id: z.string().uuid().nullable().optional(),
    display_order: z.number().int().optional().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
