import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ error: "Username dan password harus diisi" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password || "");

        if (isValidPassword) {
            const secret = new TextEncoder().encode(
                process.env.ADMIN_SECRET || "default_admin_secret_key"
            );

            const token = await new SignJWT({ userId: user.id, role: user.role, username: user.username })
                .setProtectedHeader({ alg: "HS256" })
                .setExpirationTime("24h")
                .sign(secret);

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
        console.error("Admin login error:", e);
        return NextResponse.json({ error: "Gagal login" }, { status: 500 });
    }
}
