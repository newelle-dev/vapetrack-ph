import { Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { redirect } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryForm } from "@/components/categories/category-form";
import { getCategories } from "@/app/actions/categories";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Categories - VapeTrack PH",
};

export default async function CategoriesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const resolvedSearchParams = await searchParams;
    const query = resolvedSearchParams.q || "";
    const page = Number(resolvedSearchParams.page) || 1;
    const { data, metadata } = await getCategories(query, page);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Product Categories</h2>
                <div className="flex items-center space-x-2">
                    <CategoryForm
                        trigger={
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Category
                            </Button>
                        }
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <form className="flex-1 max-w-sm flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="q"
                            placeholder="Search categories..."
                            defaultValue={query}
                            className="pl-8"
                        />
                    </div>
                    <Button type="submit" variant="secondary">Search</Button>
                </form>
            </div>

            <Suspense fallback={<div>Loading categories...</div>}>
                <CategoryList categories={data || []} />
            </Suspense>

            {/* Pagination Controls Placeholder */}
            <div className="flex items-center justify-end space-x-2 py-4">
                {metadata.totalPages > 1 && (
                    <div className="text-sm text-muted-foreground">
                        Page {metadata.page} of {metadata.totalPages}
                    </div>
                )}
            </div>
        </div>
    );
}
