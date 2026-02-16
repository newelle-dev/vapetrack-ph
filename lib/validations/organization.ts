import { z } from "zod";

export const organizationUpdateSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;