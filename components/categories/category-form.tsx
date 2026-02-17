"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/app/actions/categories";

interface CategoryFormProps {
    initialData?: CategoryInput & { id: string };
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function CategoryForm({
    initialData,
    open,
    onOpenChange,
    trigger,
}: CategoryFormProps) {
    const [isPending, startTransition] = useTransition();
    const [internalOpen, setInternalOpen] = useState(false);

    const isDialogOpen = open ?? internalOpen;
    const setDialogOpen = onOpenChange ?? setInternalOpen;

    const form = useForm<CategoryInput>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            description: "",
            display_order: 0,
            parent_id: null,
        },
        values: initialData ? {
            name: initialData.name,
            description: initialData.description ?? "",
            display_order: initialData.display_order ?? 0,
            parent_id: initialData.parent_id ?? null,
        } : undefined,
    });

    async function onSubmit(data: CategoryInput) {
        startTransition(async () => {
            try {
                const result = initialData
                    ? await updateCategory(initialData.id, data)
                    : await createCategory(data);

                if (result.success) {
                    toast.success(
                        initialData ? "Category updated" : "Category created"
                    );
                    setDialogOpen(false);
                    if (!initialData) {
                        form.reset();
                    }
                } else {
                    toast.error(result.error || "Something went wrong");
                }
            } catch (error) {
                toast.error("An unexpected error occurred");
            }
        });
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Category" : "Add Category"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="E-Liquids" {...field} />
                                    </FormControl>
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
                                            placeholder="Category description..."
                                            {...field}
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="display_order"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Display Order</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            value={field.value ?? 0}
                                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {initialData ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
