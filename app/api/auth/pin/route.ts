import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyPin } from "@/lib/auth/password";
import { createStaffJwt } from "@/lib/auth/jwt";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { slug, pin } = body;

        // Validate input
        if (!slug || typeof slug !== "string") {
            return NextResponse.json(
                { error: "Organization slug is required" },
                { status: 400 }
            );
        }

        if (!pin || typeof pin !== "string" || !/^\d{4,6}$/.test(pin)) {
            return NextResponse.json(
                { error: "A valid 4-6 digit PIN is required" },
                { status: 400 }
            );
        }

        const supabase = createServiceClient();

        // 1. Find organization by slug
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .select("id")
            .eq("slug", slug)
            .is("deleted_at", null)
            .single();

        if (orgError || !org) {
            // Generic error to avoid slug enumeration
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 2. Find all active staff in this organization who have a PIN set
        const { data: staffMembers, error: staffError } = await supabase
            .from("users")
            .select("id, full_name, organization_id, role, pin, can_manage_inventory, can_view_profits, can_view_reports")
            .eq("organization_id", org.id)
            .eq("role", "staff")
            .eq("is_active", true)
            .is("deleted_at", null)
            .not("pin", "is", null);

        if (staffError || !staffMembers || staffMembers.length === 0) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 3. Compare PIN hash against each staff member
        let matchedStaff = null;
        for (const staff of staffMembers) {
            if (staff.pin && (await verifyPin(pin, staff.pin))) {
                matchedStaff = staff;
                break;
            }
        }

        if (!matchedStaff) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // 4. Generate custom JWT
        const token = await createStaffJwt({
            userId: matchedStaff.id,
            organizationId: matchedStaff.organization_id,
            userRole: "staff",
        });

        // 5. Update last_login_at
        await supabase
            .from("users")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", matchedStaff.id);

        // 6. Return token and user info
        return NextResponse.json({
            token,
            user: {
                id: matchedStaff.id,
                full_name: matchedStaff.full_name,
                role: matchedStaff.role,
                organization_id: matchedStaff.organization_id,
                can_manage_inventory: matchedStaff.can_manage_inventory,
                can_view_profits: matchedStaff.can_view_profits,
                can_view_reports: matchedStaff.can_view_reports,
            },
        });
    } catch (error) {
        console.error("PIN auth error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
