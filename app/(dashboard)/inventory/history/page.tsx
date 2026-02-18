import { PageContainer } from "@/components/layouts/page-container";
import { StockHistoryClient } from "@/components/inventory/stock-history-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function StockHistoryPage() {
    return (
        <PageContainer
            title="Stock History"
            subtitle="View all stock movements and adjustments"
            action={
                <Button variant="outline" size="sm" asChild>
                    <Link href="/inventory/stock">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Stock Levels
                    </Link>
                </Button>
            }
        >
            <StockHistoryClient />
        </PageContainer>
    );
}
