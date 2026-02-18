import { PageContainer } from "@/components/layouts/page-container";
import {
    getInventoryWithProducts,
    getBranches,
} from "@/app/actions/inventory";
import { StockListClient } from "@/components/inventory/stock-list-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export default async function StockPage() {
    const [inventoryData, branches] = await Promise.all([
        getInventoryWithProducts(),
        getBranches(),
    ]);

    return (
        <PageContainer
            title="Stock Levels"
            subtitle="View and manage inventory across branches"
            action={
                <Button variant="outline" size="sm" asChild>
                    <Link href="/inventory/history">
                        <History className="mr-2 h-4 w-4" />
                        History
                    </Link>
                </Button>
            }
        >
            <StockListClient initialData={inventoryData} branches={branches} />
        </PageContainer>
    );
}
