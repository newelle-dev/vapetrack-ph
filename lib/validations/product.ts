import { z } from "zod";

// --- Variant Schema ---

const variantBaseSchema = z.object({
    name: z.string().min(1, "Variant name is required"),
    sku: z
        .string()
        .min(1, "SKU is required")
        .regex(
            /^[a-zA-Z0-9-]+$/,
            "SKU must contain only letters, numbers, and dashes"
        ),
    selling_price: z
        .number()
        .positive("Selling price must be greater than 0"),
    capital_cost: z
        .number()
        .nonnegative("Capital cost cannot be negative"),
});

const createVariantSchema = variantBaseSchema.extend({
    initial_stock: z.number().int().nonnegative().default(0),
});

const updateVariantSchema = variantBaseSchema.extend({
    id: z.string().uuid().optional(),
    is_active: z.boolean().optional().default(true),
});

// --- Product Schema ---

const productBaseSchema = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    brand: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    category_id: z.string().uuid("Please select a category"),
    is_active: z.boolean().optional().default(true),
});

export const createProductSchema = productBaseSchema.extend({
    variants: z
        .array(createVariantSchema)
        .min(1, "At least one variant is required"),
});

export const updateProductSchema = productBaseSchema.extend({
    variants: z
        .array(updateVariantSchema)
        .min(1, "At least one variant is required"),
});

// --- Inferred Types ---

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

// --- Form types (prices in pesos for UI, converted to centavos on submit) ---

export type VariantFormValues = {
    id?: string;
    name: string;
    sku: string;
    selling_price: number | string;
    capital_cost: number | string;
    initial_stock?: number | string;
    is_active?: boolean;
};

export type ProductFormValues = {
    name: string;
    brand: string;
    description: string;
    category_id: string;
    is_active: boolean;
    variants: VariantFormValues[];
};
