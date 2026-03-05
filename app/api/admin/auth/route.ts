import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        const validUsername = process.env.ADMIN_USER || "admin";
        const validPassword = process.env.ADMIN_PASS || "admin123";

        if (username === validUsername && password === validPassword) {
            const token = `${username}:${password}`;
            const response = NextResponse.json({ success: true });

            response.cookies.set("admin_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 // 24 hours
            });

            return response;
        }

        return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ error: "Gagal login" }, { status: 500 });
    }
}
