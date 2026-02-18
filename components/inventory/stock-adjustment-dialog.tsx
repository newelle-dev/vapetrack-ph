"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { adjustStock } from "@/app/actions/inventory";
import type { InventoryItem, Branch } from "@/types";

interface StockAdjustmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem | null;
    initialType: "stock_in" | "stock_out";
    branches: Branch[];
    preSelectedBranchId?: string | null;
    onSuccess: () => void;
}

export function StockAdjustmentDialog({
    open,
    onOpenChange,
    item,
    initialType,
    branches,
    preSelectedBranchId,
    onSuccess,
}: StockAdjustmentDialogProps) {
    const [quantity, setQuantity] = useState("");
    const [movementType, setMovementType] = useState<"stock_in" | "stock_out">(
        initialType
    );
    const [branchId, setBranchId] = useState(preSelectedBranchId || "");
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();

    // Reset form when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setQuantity("");
            setMovementType(initialType);
            setBranchId(preSelectedBranchId || "");
            setReason("");
        }
        onOpenChange(isOpen);
    };

    const handleSubmit = () => {
        if (!item) return;

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0) {
            toast.error("Please enter a valid positive quantity.");
            return;
        }

        if (!branchId) {
            toast.error("Please select a branch.");
            return;
        }

        if (!reason.trim()) {
            toast.error("Please provide a reason.");
            return;
        }

        startTransition(async () => {
            const result = await adjustStock({
                variant_id: item.variant_id,
                branch_id: branchId,
                quantity: qty,
                movement_type: movementType,
                reason: reason.trim(),
            });

            if (result.success) {
                toast.success(
                    `Stock ${movementType === "stock_in" ? "added" : "removed"} successfully. New quantity: ${result.data?.newQuantity}`
                );
                onOpenChange(false);
                onSuccess();
            } else {
                toast.error(result.error || "Failed to adjust stock.");
            }
        });
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {movementType === "stock_in" ? "Add Stock" : "Remove Stock"}
                    </DialogTitle>
                    <DialogDescription>
                        {item.product_name} — {item.variant_name} (SKU: {item.sku})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Branch Selector */}
                    <div className="space-y-2">
                        <Label htmlFor="branch-select">Branch *</Label>
                        <Select value={branchId} onValueChange={setBranchId}>
                            <SelectTrigger className="w-full" id="branch-select">
                                <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                        {branch.is_default ? " (Default)" : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Movement Type */}
                    <div className="space-y-2">
                        <Label htmlFor="movement-type">Action</Label>
                        <Select
                            value={movementType}
                            onValueChange={(v) =>
                                setMovementType(v as "stock_in" | "stock_out")
                            }
                        >
                            <SelectTrigger className="w-full" id="movement-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stock_in">
                                    ➕ Add Stock (Stock In)
                                </SelectItem>
                                <SelectItem value="stock_out">
                                    ➖ Remove Stock (Stock Out)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter units"
                            autoFocus
                        />
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason / Notes *</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Weekly Restock, Customer Return, Damage"
                            className="resize-none"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className={cn(
                            movementType === "stock_in"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                        )}
                    >
                        {isPending ? "Processing..." : "Confirm Adjustment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
