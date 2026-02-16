# Security & RLS Policy

**Last Updated:** February 4, 2026

## Row Level Security (RLS) Policy Matrix

All tables use **organization-based isolation** enforced at the database level.

| Table | Operation | Policy Rule | Notes |
|-------|-----------|-------------|-------|
| **organizations** | SELECT | `id = get_user_organization_id()` | Users can only see their own org |
| | INSERT | `false` | Only via signup flow |
| | UPDATE | `id = get_user_organization_id()` | Owners can update org settings |
| | DELETE | `false` | Soft delete only |
| **users** | SELECT | `organization_id = get_user_organization_id()` | See users in same org |
| | INSERT | `organization_id = get_user_organization_id()` | Owners can add staff |
| | UPDATE | `organization_id = get_user_organization_id() AND (auth.uid() = id OR role = 'owner')` | Users can update themselves; owners can update all |
| | DELETE | `organization_id = get_user_organization_id() AND role = 'owner'` | Only owners can delete users |
| **branches** | SELECT | `organization_id = get_user_organization_id()` | See branches in same org |
| | INSERT | `organization_id = get_user_organization_id() AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'` | Only owners can create branches |
| | UPDATE | `organization_id = get_user_organization_id() AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'` | Only owners can update branches |
| | DELETE | `false` | Soft delete only |
| **product_categories** | SELECT | `organization_id = get_user_organization_id()` | See categories in same org |
| | INSERT | `organization_id = get_user_organization_id()` | All users can create categories |
| | UPDATE | `organization_id = get_user_organization_id()` | All users can update categories |
| | DELETE | `organization_id = get_user_organization_id()` | All users can delete categories |
| **products** | SELECT | `organization_id = get_user_organization_id()` | See products in same org |
| | INSERT | `organization_id = get_user_organization_id()` | All users can create products |
| | UPDATE | `organization_id = get_user_organization_id()` | All users can update products |
| | DELETE | `false` | Soft delete only |
| **product_variants** | SELECT | `organization_id = get_user_organization_id()` | See variants in same org |
| | INSERT | `organization_id = get_user_organization_id()` | All users can create variants |
| | UPDATE | `organization_id = get_user_organization_id()` | All users can update variants |
| | DELETE | `false` | Soft delete only |
| **inventory** | SELECT | `organization_id = get_user_organization_id()` | See inventory in same org |
| | INSERT | `organization_id = get_user_organization_id()` | Inventory created via RPC |
| | UPDATE | `false` | Updates only via RPCs |
| | DELETE | `false` | No direct deletes |
| **transactions** | SELECT | `organization_id = get_user_organization_id()` | See transactions in same org |
| | INSERT | `false` | Only via `process_transaction` RPC |
| | UPDATE | `false` | No updates after creation |
| | DELETE | `false` | No deletes (audit trail) |
| **transaction_items** | SELECT | `organization_id = get_user_organization_id()` | See items in same org |
| | | `AND ((SELECT can_view_profits FROM users WHERE id = auth.uid()) = true OR (SELECT role FROM users WHERE id = auth.uid()) = 'owner')` | **Profit columns hidden from staff** |
| | INSERT | `false` | Only via `process_transaction` RPC |
| | UPDATE | `false` | No updates after creation |
| | DELETE | `false` | No deletes (audit trail) |
| **stock_movements** | SELECT | `organization_id = get_user_organization_id()` | See movements in same org |
| | INSERT | `false` | Only via RPCs |
| | UPDATE | `false` | Immutable audit trail |
| | DELETE | `false` | Immutable audit trail |
| **audit_logs** | SELECT | `organization_id = get_user_organization_id() AND (SELECT role FROM users WHERE id = auth.uid()) = 'owner'` | **Only owners can view audit logs** |
| | INSERT | `false` | System-generated only |
| | UPDATE | `false` | Immutable |
| | DELETE | `false` | Immutable |
| **subscriptions** | SELECT | `organization_id = get_user_organization_id()` | See subscriptions in same org |
| | INSERT | `false` | System/webhook only |
| | UPDATE | `false` | System/webhook only |
| | DELETE | `false` | No deletes |

### Helper Functions for RLS

```sql
-- Get current user's organization ID from JWT metadata
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is an owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role = 'owner'
      AND organization_id = get_user_organization_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
