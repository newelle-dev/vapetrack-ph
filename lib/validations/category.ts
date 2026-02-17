import { z } from "zod";

export const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional().nullable(),
    parent_id: z.string().uuid().optional().nullable(),
    display_order: z.coerce.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
