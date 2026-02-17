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
