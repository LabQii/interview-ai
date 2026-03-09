import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true, message: "Logged out" });

    // Hapus cookie admin_token
    response.cookies.delete("admin_token");

    return response;
}
