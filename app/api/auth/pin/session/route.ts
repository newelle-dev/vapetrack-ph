import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStaffJwt } from "@/lib/auth/jwt";

const STAFF_SESSION_COOKIE = "sb-staff-token";

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        // Verify the token before storing
        const payload = await verifyStaffJwt(token);
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Set as HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set(STAFF_SESSION_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 8 * 60 * 60, // 8 hours (matches JWT expiry)
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Session creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(STAFF_SESSION_COOKIE);
    return NextResponse.json({ success: true });
}
