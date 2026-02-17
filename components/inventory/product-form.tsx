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
        .number()
        .positive("Selling price must be greater than 0"),
    capital_cost: z
        .number()
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
