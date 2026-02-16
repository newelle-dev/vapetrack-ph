import { z } from "zod";

export const branchCreateSchema = z.object({
  name: z.string().min(2, "Branch name required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const branchUpdateSchema = branchCreateSchema;

export type BranchCreateInput = z.infer<typeof branchCreateSchema>;
export type BranchUpdateInput = z.infer<typeof branchUpdateSchema>;