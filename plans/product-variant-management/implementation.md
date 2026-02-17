# Product & Variant Management

## Goal
Enable shop owners to add and edit products with multiple variants (flavors, nicotine levels, etc.), each with unique SKU, selling price, and capital cost, with automatic inventory record creation across all active branches.

## Prerequisites
Make sure that the user is currently on the `feat/product-variant-management` branch before beginning implementation.
If not, move them to the correct branch. If the branch does not exist, create it from main.

---

### Step-by-Step Instructions

#### Step 1: Add Select Component & Create Validation Schema

- [x] Install the shadcn `select` component by running the following command:

```bash
npx shadcn@latest add select
```

- [x] Create the product validation schema file at `lib/validations/product.ts`:

```typescript
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
    .number({ required_error: "Selling price is required" })
    .positive("Selling price must be greater than 0"),
  capital_cost: z
    .number({ required_error: "Capital cost is required" })
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
```

##### Step 1 Verification Checklist
- [x] No build errors (`npm run dev` shows no errors)
- [x] `components/ui/select.tsx` exists after running the shadcn command
- [x] `lib/validations/product.ts` exists and exports the schemas and types

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 2: Create Product Server Actions

- [x] Create the server actions file at `app/actions/products.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/validations/product";
import { slugify, generateUniqueSlug } from "@/lib/utils/slugify";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ─── Helper: Get authenticated user + organization ───

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) return null;

  return { supabase, user, organizationId: userData.organization_id };
}

// ─── CREATE PRODUCT ───

export async function createProduct(
  data: CreateProductInput
): Promise<ActionResult<{ productId: string }>> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const parsed = createProductSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const { supabase, user, organizationId } = ctx;

  try {
    // 1. Generate product slug
    const baseSlug = slugify(parsed.data.name);
    const slug = generateUniqueSlug(baseSlug);

    // 2. Insert product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        organization_id: organizationId,
        name: parsed.data.name,
        brand: parsed.data.brand || null,
        description: parsed.data.description || null,
        category_id: parsed.data.category_id,
        slug,
        is_active: parsed.data.is_active ?? true,
      })
      .select("id")
      .single();

    if (productError) throw productError;

    // 3. Insert all variants
    const variantInserts = parsed.data.variants.map((v) => ({
      organization_id: organizationId,
      product_id: product.id,
      name: v.name,
      sku: v.sku,
      selling_price: v.selling_price,
      capital_cost: v.capital_cost,
      is_active: true,
    }));

    const { data: variants, error: variantError } = await supabase
      .from("product_variants")
      .insert(variantInserts)
      .select("id");

    if (variantError) throw variantError;

    // 4. Fetch all active branches for inventory creation
    const { data: branches, error: branchError } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (branchError) throw branchError;

    // 5. Create inventory records for each variant × each branch
    if (branches && branches.length > 0 && variants && variants.length > 0) {
      const inventoryInserts: Array<{
        organization_id: string;
        branch_id: string;
        product_variant_id: string;
        quantity: number;
      }> = [];

      for (const variant of variants) {
        const variantData = parsed.data.variants[variants.indexOf(variant)];
        const initialStock = variantData?.initial_stock ?? 0;

        for (const branch of branches) {
          inventoryInserts.push({
            organization_id: organizationId,
            branch_id: branch.id,
            product_variant_id: variant.id,
            quantity: initialStock,
          });
        }
      }

      const { error: inventoryError } = await supabase
        .from("inventory")
        .insert(inventoryInserts);

      if (inventoryError) throw inventoryError;

      // 6. Create stock_movements for variants with initial_stock > 0
      const movementInserts: Array<{
        organization_id: string;
        branch_id: string;
        product_variant_id: string;
        quantity_change: number;
        quantity_before: number;
        quantity_after: number;
        movement_type: string;
        user_id: string;
        notes: string;
      }> = [];

      for (let i = 0; i < variants.length; i++) {
        const variantData = parsed.data.variants[i];
        const initialStock = variantData?.initial_stock ?? 0;
        if (initialStock > 0) {
          for (const branch of branches) {
            movementInserts.push({
              organization_id: organizationId,
              branch_id: branch.id,
              product_variant_id: variants[i].id,
              quantity_change: initialStock,
              quantity_before: 0,
              quantity_after: initialStock,
              movement_type: "initial_stock",
              user_id: user.id,
              notes: "Initial stock on product creation",
            });
          }
        }
      }

      if (movementInserts.length > 0) {
        const { error: movementError } = await supabase
          .from("stock_movements")
          .insert(movementInserts);

        if (movementError) {
          console.error("Stock movement creation error:", movementError);
          // Non-fatal: inventory was created, movement logging failed
        }
      }
    }

    revalidatePath("/inventory");
    revalidatePath("/inventory/products");

    return { success: true, data: { productId: product.id } };
  } catch (error: any) {
    console.error("Create product error:", error);
    return {
      success: false,
      error: error.message || "Failed to create product",
    };
  }
}

// ─── UPDATE PRODUCT ───

export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<ActionResult> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const parsed = updateProductSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const { supabase, user, organizationId } = ctx;

  try {
    // 1. Update product fields
    const { error: productError } = await supabase
      .from("products")
      .update({
        name: parsed.data.name,
        brand: parsed.data.brand || null,
        description: parsed.data.description || null,
        category_id: parsed.data.category_id,
        is_active: parsed.data.is_active ?? true,
      })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (productError) throw productError;

    // 2. Get existing variant IDs from DB
    const { data: existingVariants, error: fetchError } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id)
      .is("deleted_at", null);

    if (fetchError) throw fetchError;

    const existingIds = new Set(existingVariants?.map((v) => v.id) || []);
    const payloadIds = new Set(
      parsed.data.variants.filter((v) => v.id).map((v) => v.id!)
    );

    // 3. Soft-delete variants not in payload
    const toDelete = [...existingIds].filter((eid) => !payloadIds.has(eid));
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("product_variants")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", toDelete);

      if (deleteError) throw deleteError;
    }

    // 4. Update existing variants
    for (const variant of parsed.data.variants) {
      if (variant.id && existingIds.has(variant.id)) {
        const { error: updateError } = await supabase
          .from("product_variants")
          .update({
            name: variant.name,
            sku: variant.sku,
            selling_price: variant.selling_price,
            capital_cost: variant.capital_cost,
            is_active: variant.is_active ?? true,
          })
          .eq("id", variant.id);

        if (updateError) throw updateError;
      }
    }

    // 5. Insert new variants (no id)
    const newVariants = parsed.data.variants.filter((v) => !v.id);
    if (newVariants.length > 0) {
      const newInserts = newVariants.map((v) => ({
        organization_id: organizationId,
        product_id: id,
        name: v.name,
        sku: v.sku,
        selling_price: v.selling_price,
        capital_cost: v.capital_cost,
        is_active: v.is_active ?? true,
      }));

      const { data: insertedVariants, error: insertError } = await supabase
        .from("product_variants")
        .insert(newInserts)
        .select("id");

      if (insertError) throw insertError;

      // 6. Create inventory records for new variants across all branches
      if (insertedVariants && insertedVariants.length > 0) {
        const { data: branches } = await supabase
          .from("branches")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("is_active", true);

        if (branches && branches.length > 0) {
          const inventoryInserts = insertedVariants.flatMap((variant) =>
            branches.map((branch) => ({
              organization_id: organizationId,
              branch_id: branch.id,
              product_variant_id: variant.id,
              quantity: 0,
            }))
          );

          const { error: inventoryError } = await supabase
            .from("inventory")
            .insert(inventoryInserts);

          if (inventoryError) {
            console.error("Inventory creation for new variants error:", inventoryError);
          }
        }
      }
    }

    revalidatePath("/inventory");
    revalidatePath("/inventory/products");
    revalidatePath(`/inventory/products/${id}/edit`);

    return { success: true };
  } catch (error: any) {
    console.error("Update product error:", error);
    return {
      success: false,
      error: error.message || "Failed to update product",
    };
  }
}

// ─── GET PRODUCT FOR EDIT ───

export async function getProductForEdit(id: string) {
  const ctx = await getAuthContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      *,
      variants:product_variants(*)
    `
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .single();

  if (error || !product) return null;

  // Filter out deleted variants
  const variants =
    (product.variants as any[])?.filter((v: any) => !v.deleted_at) || [];

  return {
    ...product,
    variants,
  };
}
```

##### Step 2 Verification Checklist
- [x] No build errors
- [x] `app/actions/products.ts` exists with `createProduct`, `updateProduct`, and `getProductForEdit` exports
- [x] Imports resolve correctly (validation schemas, supabase client, slugify)

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 3: Build Product Form & Variant Manager Components

- [x] Create the variant manager component at `components/inventory/variant-manager.tsx`:

```tsx
"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { ProductFormValues } from "@/lib/validations/product";

interface VariantManagerProps {
  isEditMode: boolean;
}

export function VariantManager({ isEditMode }: VariantManagerProps) {
  const { control } = useFormContext<ProductFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const addVariant = () => {
    append({
      name: "",
      sku: "",
      selling_price: "",
      capital_cost: "",
      initial_stock: isEditMode ? undefined : "",
      is_active: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Variants ({fields.length})
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="border border-dashed rounded-xl p-8 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            No variants added yet. Every product needs at least one variant.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Variant
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="py-4">
            <CardContent className="px-4 space-y-4">
              {/* Variant Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Variant {index + 1}
                </span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Name & SKU - Side by side on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`variants.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Mango Ice 30mg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`variants.${index}.sku`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. MANGO-ICE-30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Price Fields - Side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name={`variants.${index}.selling_price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (₱)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            ₱
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? "" : parseFloat(val));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`variants.${index}.capital_cost`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capital Cost (₱)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            ₱
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? "" : parseFloat(val));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Initial Stock - Only shown on create */}
              {!isEditMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name={`variants.${index}.initial_stock`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Stock</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === "" ? "" : parseInt(val, 10));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {fields.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          className="w-full border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Variant
        </Button>
      )}
    </div>
  );
}
```

- [x] Create the product form component at `components/inventory/product-form.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VariantManager } from "./variant-manager";

import {
  type ProductFormValues,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/app/actions/products";
import type { ProductCategory } from "@/types";

// --- Client-side form validation schema (pesos, not centavos) ---
const variantFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Variant name is required"),
  sku: z
    .string()
    .min(1, "SKU is required")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "SKU must contain only letters, numbers, and dashes"
    ),
  selling_price: z
    .number({ required_error: "Selling price is required", invalid_type_error: "Enter a valid price" })
    .positive("Selling price must be greater than 0"),
  capital_cost: z
    .number({ required_error: "Capital cost is required", invalid_type_error: "Enter a valid cost" })
    .nonnegative("Capital cost cannot be negative"),
  initial_stock: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  is_active: z.boolean().optional().default(true),
});

const productFormSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  brand: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  category_id: z.string().min(1, "Please select a category"),
  is_active: z.boolean().optional().default(true),
  variants: z
    .array(variantFormSchema)
    .min(1, "At least one variant is required"),
});

// --- Props ---

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    brand: string | null;
    description: string | null;
    category_id: string | null;
    is_active: boolean | null;
    variants: Array<{
      id: string;
      name: string;
      sku: string;
      selling_price: number;
      capital_cost: number;
      is_active: boolean | null;
    }>;
  };
  categories: ProductCategory[];
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isEditMode = !!initialData;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: initialData
      ? {
          name: initialData.name,
          brand: initialData.brand || "",
          description: initialData.description || "",
          category_id: initialData.category_id || "",
          is_active: initialData.is_active ?? true,
          variants: initialData.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            selling_price: v.selling_price / 100, // centavos → pesos for display
            capital_cost: v.capital_cost / 100,
            is_active: v.is_active ?? true,
          })),
        }
      : {
          name: "",
          brand: "",
          description: "",
          category_id: "",
          is_active: true,
          variants: [
            {
              name: "",
              sku: "",
              selling_price: "" as any,
              capital_cost: "" as any,
              initial_stock: "" as any,
              is_active: true,
            },
          ],
        },
  });

  async function onSubmit(data: ProductFormValues) {
    startTransition(async () => {
      try {
        if (isEditMode && initialData) {
          // Convert pesos → centavos for server
          const payload: UpdateProductInput = {
            name: data.name,
            brand: data.brand,
            description: data.description,
            category_id: data.category_id,
            is_active: data.is_active,
            variants: data.variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              selling_price: Math.round(Number(v.selling_price) * 100),
              capital_cost: Math.round(Number(v.capital_cost) * 100),
              is_active: v.is_active ?? true,
            })),
          };

          const result = await updateProduct(initialData.id, payload);
          if (result.success) {
            toast.success("Product updated successfully");
            router.push("/inventory");
          } else {
            toast.error(result.error || "Failed to update product");
          }
        } else {
          // Convert pesos → centavos for server
          const payload: CreateProductInput = {
            name: data.name,
            brand: data.brand,
            description: data.description,
            category_id: data.category_id,
            is_active: data.is_active,
            variants: data.variants.map((v) => ({
              name: v.name,
              sku: v.sku,
              selling_price: Math.round(Number(v.selling_price) * 100),
              capital_cost: Math.round(Number(v.capital_cost) * 100),
              initial_stock: v.initial_stock
                ? Number(v.initial_stock)
                : 0,
            })),
          };

          const result = await createProduct(payload);
          if (result.success) {
            toast.success("Product created successfully");
            router.push("/inventory");
          } else {
            toast.error(result.error || "Failed to create product");
          }
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Product Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Product Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. RELX Infinity Pod" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. RELX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Optional product description..."
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Variants Section */}
        <VariantManager isEditMode={isEditMode} />

        {/* Form-level variant errors */}
        {form.formState.errors.variants?.root && (
          <p className="text-destructive text-sm">
            {form.formState.errors.variants.root.message}
          </p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

##### Step 3 Verification Checklist
- [x] No build errors
- [x] `components/inventory/variant-manager.tsx` exists
- [x] `components/inventory/product-form.tsx` exists
- [x] Both components import and resolve correctly

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 4: Create Add Product & Edit Product Pages

- [ ] Create the "Add Product" page at `app/(dashboard)/inventory/products/new/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layouts/page-container";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProductPage() {
  const supabase = await createClient();

  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from("product_categories")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  return (
    <PageContainer
      title="Add Product"
      subtitle="Create a new product with variants"
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href="/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <ProductForm categories={categories || []} />
    </PageContainer>
  );
}
```

- [ ] Create the "Edit Product" page at `app/(dashboard)/inventory/products/[id]/edit/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layouts/page-container";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProductForEdit } from "@/app/actions/products";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  // Fetch product data with variants
  const product = await getProductForEdit(id);

  if (!product) {
    redirect("/inventory");
  }

  // Fetch categories for the dropdown
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("product_categories")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  return (
    <PageContainer
      title={`Edit ${product.name}`}
      subtitle="Update product details and variants"
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href="/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <ProductForm
        initialData={{
          id: product.id,
          name: product.name,
          brand: product.brand,
          description: product.description,
          category_id: product.category_id,
          is_active: product.is_active,
          variants: product.variants.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            selling_price: v.selling_price,
            capital_cost: v.capital_cost,
            is_active: v.is_active,
          })),
        }}
        categories={categories || []}
      />
    </PageContainer>
  );
}
```

##### Step 4 Verification Checklist
- [ ] No build errors
- [ ] Navigate to `/inventory/products/new` → form loads with empty fields and a category dropdown
- [ ] Fill in product details, add 2+ variants, submit → verify data saved correctly (check Supabase dashboard)
- [ ] Navigate to `/inventory/products/[id]/edit` → form loads with pre-filled data
- [ ] Non-existent product ID redirects to `/inventory`

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 5: Wire Up Navigation & Update Inventory Page

- [ ] Update the inventory page at `app/(dashboard)/inventory/page.tsx` to link the "Create Product" button:

```tsx
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layouts/page-container";
import { ProductListClient } from "@/components/inventory/product-list-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function InventoryPage() {
  const supabase = await createClient();

  // Fetch categories for filters (server-side)
  const { data: categories } = await supabase
    .from("product_categories")
    .select("*")
    .is("deleted_at", null)
    .is("parent_id", null)
    .order("name");

  return (
    <PageContainer
      title="Inventory"
      subtitle="Manage your product inventory"
      action={
        <Button asChild>
          <Link href="/inventory/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Link>
        </Button>
      }
    >
      <ProductListClient initialCategories={categories || []} />
    </PageContainer>
  );
}
```

- [ ] Update the product table at `components/inventory/product-table.tsx` to add an "Edit" action:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import type { ProductWithCategory } from "@/types";

interface ProductTableProps {
  products: ProductWithCategory[];
  onViewProduct: (productId: string) => void;
}

export function ProductTable({ products, onViewProduct }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="hidden md:block">
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No products found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-center">Variants</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.brand || "—"}</TableCell>
              <TableCell>
                {product.category_name ? (
                  <Badge variant="outline">{product.category_name}</Badge>
                ) : (
                  <span className="text-muted-foreground">Uncategorized</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {product.variant_count}
              </TableCell>
              <TableCell>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewProduct(product.id)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/inventory/products/${product.id}/edit`}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] Update the product card at `components/inventory/product-card.tsx` to add an edit action:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import Link from "next/link";
import type { ProductWithCategory } from "@/types";

interface ProductCardProps {
  product: ProductWithCategory;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card className="hover:bg-accent/50 transition-colors active:scale-[0.98]">
      <CardContent className="p-4">
        {/* Product Name */}
        <div
          className="flex items-start justify-between gap-2 mb-2 cursor-pointer"
          onClick={onClick}
        >
          <h3 className="font-semibold text-base line-clamp-2">
            {product.name}
          </h3>
          <Badge
            variant={product.is_active ? "default" : "secondary"}
            className="shrink-0"
          >
            {product.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Brand */}
        {product.brand && (
          <p
            className="text-sm text-muted-foreground mb-2 cursor-pointer"
            onClick={onClick}
          >
            {product.brand}
          </p>
        )}

        {/* Category & Variants */}
        <div
          className="flex items-center justify-between text-sm mb-3 cursor-pointer"
          onClick={onClick}
        >
          <div>
            {product.category_name ? (
              <Badge variant="outline">{product.category_name}</Badge>
            ) : (
              <span className="text-muted-foreground">Uncategorized</span>
            )}
          </div>
          <span className="text-muted-foreground">
            {product.variant_count}{" "}
            {product.variant_count === 1 ? "variant" : "variants"}
          </span>
        </div>

        {/* Edit Button */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/inventory/products/${product.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Product
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] Update the product details dialog at `components/inventory/product-details-dialog.tsx` to add an "Edit Product" button:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { useProductById } from "@/lib/hooks/useProducts";
import { formatCurrency } from "@/lib/utils";

interface ProductDetailsDialogProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({
  productId,
  open,
  onOpenChange,
}: ProductDetailsDialogProps) {
  const { data: product, isLoading } = useProductById(productId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Product Info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  {product.brand && (
                    <p className="text-muted-foreground">{product.brand}</p>
                  )}
                </div>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Category */}
              {product.category && (
                <div className="mb-3">
                  <span className="text-sm text-muted-foreground">
                    Category:{" "}
                  </span>
                  <Badge variant="outline">{product.category.name}</Badge>
                </div>
              )}

              {/* Description (if exists) */}
              {product.description && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-1">
                    Description:
                  </p>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}

              {/* SKU/Slug */}
              <div className="text-sm text-muted-foreground">
                <p>Slug: {product.slug}</p>
              </div>
            </div>

            {/* Variants */}
            <div>
              <h3 className="font-semibold mb-3">
                Variants ({product.variants?.length || 0})
              </h3>
              {product.variants && product.variants.length > 0 ? (
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{variant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {variant.sku}
                          </p>
                        </div>
                        <Badge
                          variant={variant.is_active ? "default" : "secondary"}
                        >
                          {variant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Price: </span>
                          <span className="font-medium">
                            {formatCurrency(variant.selling_price)}
                          </span>
                        </div>
                        {variant.capital_cost > 0 && (
                          <div>
                            <span className="text-muted-foreground">
                              Cost:{" "}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(variant.capital_cost)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No variants available
                </p>
              )}
            </div>

            {/* Edit Button */}
            <div className="pt-4 border-t">
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/inventory/products/${product.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Product
                </Link>
              </Button>
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>
                Created: {new Date(product.created_at).toLocaleDateString()}
              </p>
              <p>
                Updated: {new Date(product.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Product not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

##### Step 5 Verification Checklist
- [ ] No build errors
- [ ] On the inventory page, the "Create Product" button navigates to `/inventory/products/new`
- [ ] In the desktop table, each product row shows a "View" and "Edit" action
- [ ] In the mobile card view, each card shows an "Edit Product" button
- [ ] In the product details dialog, an "Edit Product" button navigates to the edit page
- [ ] Full flow: create product → see it in list → edit it → verify changes

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

---

#### Step 6: Update Roadmap & Final Polish

- [ ] Update `docs/product/roadmap.md` — locate the "Day 10-11: Product & Variant Management" section and mark all tasks and Definition of Done items as completed:

Change the following unchecked items to checked:

```markdown
**Day 10:**

1. [x] Create "Add Product" page:
   - `app/(dashboard)/inventory/products/new/page.tsx`
   - Form fields: name, brand, description, category
2. [x] Add shadcn/ui components:
   ```bash
   npx shadcn@latest add form select textarea
   ```
3. [x] Implement product form with validation:
   - Use React Hook Form or native form validation
   - Required fields: name, category
4. [x] Create Server Action:
   - `app/actions/products.ts` → `createProduct()`

**Day 11:**

1. [x] Create variant management component:
   - `components/inventory/VariantManager.tsx`
   - Embedded in product form
   - Add/remove variants dynamically
   - Fields per variant: name, SKU, price, capital cost, initial stock
2. [x] Update `createProduct()` Server Action:
   - Insert product
   - Insert variants in single transaction
   - Create initial inventory records (for each branch)
3. [x] Create "Edit Product" page:
   - `app/(dashboard)/inventory/products/[id]/edit/page.tsx`
   - Pre-fill form with existing data
   - Allow editing variants (add new, edit existing)

**Deliverables:**

- [x] Can add product with multiple variants
- [x] Variants saved correctly with SKUs and pricing
- [x] Initial inventory created for default branch
- [x] Can edit existing products and variants

**Definition of Done:**

- [x] Add product form validates required fields
- [x] Can add 1+ variants per product
- [x] Each variant has unique SKU (validated)
- [x] Product creation creates inventory records
- [x] Edit product pre-fills existing data
- [x] Can add new variants to existing products
- [x] All operations show success toast
- [x] Error handling shows user-friendly messages
```

- [ ] Update the Sprint 2 completion percentage from `30%` to `60%` in the status table at the top of the roadmap:

```markdown
| **Sprint 2: Inventory Management** | 🔄 In Progress   | 60%        |
```

##### Step 6 Verification Checklist
- [ ] Roadmap reflects completed Day 10-11 tasks
- [ ] Sprint 2 progress updated to 60%
- [ ] All Definition of Done items verified:
  - [ ] Add product form validates required fields
  - [ ] Can add 1+ variants per product
  - [ ] Each variant has unique SKU (validated in form)
  - [ ] Product creation creates inventory records
  - [ ] Edit product pre-fills existing data
  - [ ] Can add new variants to existing products
  - [ ] All operations show success toast
  - [ ] Error handling shows user-friendly messages
- [ ] Full end-to-end manual walk-through passes

#### Step 6 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
