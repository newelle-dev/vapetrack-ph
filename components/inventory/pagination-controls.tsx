"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  currentPage,
  pageCount,
  onPageChange,
}: PaginationControlsProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < pageCount;

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 py-4">
      {/* Page Info */}
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {pageCount}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers (show current and adjacent pages) */}
        <div className="hidden sm:flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
            // Calculate page number to display
            let pageNum: number;
            if (pageCount <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= pageCount - 2) {
              pageNum = pageCount - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            const isCurrentPage = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="min-w-[36px]"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pageCount)}
          disabled={!canGoNext}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
