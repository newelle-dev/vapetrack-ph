-- Migration: Add deleted_at to product_categories for soft delete support
-- Description: Adds nullable deleted_at timestamp column
-- UP
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON product_categories(deleted_at) WHERE deleted_at IS NOT NULL;
