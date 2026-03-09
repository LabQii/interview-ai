import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const participants = await prisma.user.findMany({
            where: { role: "CANDIDATE" },
            orderBy: { createdAt: "desc" },
            include: {
                testSession: true,
                interview: true,
                redeemCode: true
            }
        });

        return NextResponse.json({ success: true, participants });
    } catch (e) {
        return NextResponse.json({ error: "Gagal memuat peserta" }, { status: 500 });
    }
}
