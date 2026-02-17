import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/layouts/page-container";
import { ProductListClient } from "@/components/inventory/product-list-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      }
    >
      <ProductListClient initialCategories={categories || []} />
    </PageContainer>
  );
}
