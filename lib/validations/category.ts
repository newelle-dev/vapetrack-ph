import { z } from "zod";

export const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string(),
    parent_id: z.string().uuid().nullable(),
    display_order: z.number().int(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
