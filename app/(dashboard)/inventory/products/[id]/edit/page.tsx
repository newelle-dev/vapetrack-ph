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
