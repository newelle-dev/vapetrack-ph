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
