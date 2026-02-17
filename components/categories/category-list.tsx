"use client";

import { useTransition } from "react";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { CategoryForm } from "./category-form";
import { deleteCategory } from "@/app/actions/categories";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type CategoryInput } from "@/lib/validations/category";

interface Category {
    id: string;
    name: string;
    description: string | null;
    display_order: number | null;
    parent_id: string | null;
}

interface CategoryListProps {
    categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteCategory(id);
            if (result.success) {
                toast.success("Category deleted");
            } else {
                toast.error(result.error || "Failed to delete");
            }
        });
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                No categories found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell>{category.display_order ?? 0}</TableCell>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell>{category.description || "-"}</TableCell>
                                <TableCell className="flex gap-2">
                                    <CategoryForm
                                        initialData={{
                                            id: category.id,
                                            name: category.name,
                                            description: category.description || "",
                                            display_order: category.display_order ?? 0,
                                            parent_id: category.parent_id,
                                        }}
                                        trigger={
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        }
                                    />

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will remove the category from the active list.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(category.id)}
                                                    disabled={isPending}
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
