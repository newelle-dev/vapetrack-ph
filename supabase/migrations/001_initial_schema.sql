-- =====================================================================
-- VapeTrack PH - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Core multi-tenant tables with RLS, triggers, and indexes
-- Created: 2026-02-12
-- PostgreSQL Version: 17
-- =====================================================================

-- =====================================================================
-- SECTION 1: CORE TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1 Organizations (Tenants/Shops)
-- ---------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    owner_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,

    -- Subscription Management
    subscription_status VARCHAR(50) DEFAULT 'trial' CHECK (
        subscription_status IN ('trial', 'active', 'suspended', 'cancelled')
    ),
    subscription_plan VARCHAR(50) DEFAULT 'starter' CHECK (
        subscription_plan IN ('starter', 'professional', 'enterprise')
    ),
    trial_ends_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for data retention
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete for data retention
);

COMMENT ON TABLE organizations IS 'Core tenant/shop entities - each row represents one vape shop organization';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization (e.g., "joes-vape-shop")';
COMMENT ON COLUMN organizations.subscription_status IS 'Subscription state: trial (14 days), active (paid), suspended (payment failed), cancelled (churned)';
COMMENT ON COLUMN organizations.deleted_at IS 'Soft delete timestamp - allows data recovery and audit trail';

-- Indexes for Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_active ON organizations(id) WHERE subscription_status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_organizations_deleted ON organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- ---------------------------------------------------------------------
-- 1.2 Users (Shop Owners & Staff)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Dual Authentication: Email/Password (owners) OR PIN (staff)
    email VARCHAR(255), -- NULL for staff using PIN only
    password_hash VARCHAR(255), -- NULL for PIN-only staff (managed by Supabase Auth)
    pin VARCHAR(6), -- 4-6 digit PIN for staff quick login

    -- Profile
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'staff')),

    -- Fine-Grained Permissions
    can_view_profits BOOLEAN DEFAULT false, -- Only owners see profit margins
    can_manage_inventory BOOLEAN DEFAULT false,
    can_view_reports BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraint: Must have either email/password OR PIN
    CONSTRAINT chk_auth_method CHECK (
        (email IS NOT NULL AND password_hash IS NOT NULL) OR
        (pin IS NOT NULL)
    )
);

COMMENT ON TABLE users IS 'User accounts for shop owners and staff - supports both email/password and PIN authentication';
COMMENT ON COLUMN users.pin IS '4-6 digit PIN for staff quick login (hashed in production)';
COMMENT ON COLUMN users.can_view_profits IS 'Permission flag - only owners should see profit margins and capital costs';
COMMENT ON CONSTRAINT chk_auth_method ON users IS 'Ensures user has either email/password (for owners) or PIN (for staff)';

-- Indexes for Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_pin ON users(organization_id, pin) WHERE pin IS NOT NULL; -- Composite for fast PIN lookup
CREATE INDEX idx_users_role ON users(organization_id, role);
CREATE INDEX idx_users_active ON users(organization_id) WHERE is_active = true;
CREATE UNIQUE INDEX idx_users_email_unique ON users(email) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_pin_unique ON users(organization_id, pin) WHERE pin IS NOT NULL; -- PIN unique per org

-- ---------------------------------------------------------------------
-- 1.3 Branches (Physical Shop Locations)
-- ---------------------------------------------------------------------
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Branch Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-friendly, unique within organization
    address TEXT,
    phone VARCHAR(50),

    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Only one default branch per organization

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_branch_slug_per_org UNIQUE(organization_id, slug)
);

COMMENT ON TABLE branches IS 'Physical shop locations within an organization - supports multi-branch operations';
COMMENT ON COLUMN branches.is_default IS 'Default branch for new staff - enforced to be unique per organization via trigger';
COMMENT ON COLUMN branches.slug IS 'URL-friendly identifier unique within the organization (e.g., "main-branch", "mall-kiosk")';

-- Indexes for Branches
CREATE INDEX idx_branches_organization ON branches(organization_id);
CREATE INDEX idx_branches_organization_created ON branches(organization_id, created_at DESC);
CREATE INDEX idx_branches_active ON branches(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_branches_default ON branches(organization_id) WHERE is_default = true; -- Fast lookup for default branch

-- =====================================================================
-- SECTION 2: HELPER FUNCTIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1 RLS Helper: Extract organization_id from JWT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    -- Extract organization_id from Supabase Auth JWT claims
    -- This is injected via the set_organization_claim() trigger
    RETURN (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_organization_id() IS 'RLS helper function - extracts organization_id from JWT app_metadata for tenant isolation';

-- ---------------------------------------------------------------------
-- 2.2 Auto-Update Trigger Function: updated_at timestamp
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp on row modification';

-- ---------------------------------------------------------------------
-- 2.3 Business Logic: Ensure Single Default Branch per Organization
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_single_default_branch()
RETURNS TRIGGER AS $$
BEGIN
    -- If the new/updated branch is set as default, unset all other defaults in the same org
    IF NEW.is_default = true THEN
        UPDATE branches
        SET is_default = false
        WHERE organization_id = NEW.organization_id
          AND id != NEW.id
          AND is_default = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ensure_single_default_branch() IS 'Business rule enforcement - ensures only one default branch per organization';

-- ---------------------------------------------------------------------
-- 2.4 Auth Hook: Inject organization_id into Supabase Auth JWT
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_organization_claim()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
BEGIN
    -- Get organization_id from public.users table based on auth.users.id
    SELECT organization_id INTO user_org_id
    FROM public.users
    WHERE id = NEW.id;

    -- Inject organization_id into JWT app_metadata claims
    -- This makes organization_id available in get_user_organization_id() for RLS
    NEW.raw_app_meta_data = jsonb_set(
        COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
        '{organization_id}',
        to_jsonb(user_org_id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_organization_claim() IS 'Auth hook - injects organization_id into Supabase Auth JWT for stateless multi-tenancy';

-- =====================================================================
-- SECTION 3: TRIGGERS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3.1 Auto-Update Triggers: updated_at timestamp
-- ---------------------------------------------------------------------
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------
-- 3.2 Business Rule Trigger: Single Default Branch Enforcement
-- ---------------------------------------------------------------------
CREATE TRIGGER enforce_single_default_branch
    BEFORE INSERT OR UPDATE ON branches
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_branch();

-- ---------------------------------------------------------------------
-- 3.3 Auth Hook Trigger: JWT Claims Injection
-- ---------------------------------------------------------------------
-- NOTE: This trigger runs on auth.users (Supabase's internal table)
-- It's created AFTER a record is inserted into public.users during signup
CREATE TRIGGER on_auth_user_created
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION set_organization_claim();

-- =====================================================================
-- SECTION 4: ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 4.1 Organizations: Users can only see their own organization
-- ---------------------------------------------------------------------
CREATE POLICY org_isolation_policy ON organizations
    FOR ALL
    USING (id = get_user_organization_id());

COMMENT ON POLICY org_isolation_policy ON organizations IS 'RLS tenant isolation - users can only access their own organization';

-- ---------------------------------------------------------------------
-- 4.2 Users: Users can only see users in their organization
-- ---------------------------------------------------------------------
-- SELECT: Users can view all users in their org
CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- INSERT: Only service role can create users (handled by signup flow)
CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (organization_id = get_user_organization_id());

-- UPDATE: Users can update themselves, owners can update all in their org
CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND (
            id = auth.uid() -- User can update themselves
            OR EXISTS ( -- Or if current user is an owner in the same org
                SELECT 1 FROM users
                WHERE id = auth.uid()
                  AND organization_id = get_user_organization_id()
                  AND role = 'owner'
            )
        )
    );

-- DELETE: Only owners can delete users in their org
CREATE POLICY users_delete_policy ON users
    FOR DELETE
    USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

COMMENT ON POLICY users_select_policy ON users IS 'RLS - users can view all users in their organization';
COMMENT ON POLICY users_update_policy ON users IS 'RLS - users can update themselves, owners can update all users in their org';

-- ---------------------------------------------------------------------
-- 4.3 Branches: Users can only see branches in their organization
-- ---------------------------------------------------------------------
-- SELECT: Users can view all branches in their org
CREATE POLICY branches_select_policy ON branches
    FOR SELECT
    USING (organization_id = get_user_organization_id());

-- INSERT: Only owners can create branches
CREATE POLICY branches_insert_policy ON branches
    FOR INSERT
    WITH CHECK (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

-- UPDATE: Only owners can update branches
CREATE POLICY branches_update_policy ON branches
    FOR UPDATE
    USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

-- DELETE: Only owners can delete branches
CREATE POLICY branches_delete_policy ON branches
    FOR DELETE
    USING (
        organization_id = get_user_organization_id()
        AND EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
              AND organization_id = get_user_organization_id()
              AND role = 'owner'
        )
    );

COMMENT ON POLICY branches_select_policy ON branches IS 'RLS - users can view all branches in their organization';
COMMENT ON POLICY branches_insert_policy ON branches IS 'RLS - only owners can create new branches';

-- =====================================================================
-- END OF MIGRATION: 001_initial_schema.sql
-- =====================================================================
