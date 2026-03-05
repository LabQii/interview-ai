import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { calculateRemainingTime } from "@/lib/timer";

export async function GET() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ remaining: 0, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { redeemCode: true, testSession: true },
        });

        if (!user?.testSession || !user.redeemCode) {
            return NextResponse.json({ remaining: 0, error: "Session not found" });
        }

        const remaining = calculateRemainingTime(
            user.testSession.startedAt,
            user.redeemCode.duration
        );

        return NextResponse.json({
            remaining,
            startedAt: user.testSession.startedAt,
            duration: user.redeemCode.duration,
        });
    } catch (error) {
        console.error("Timer API error:", error);
        return NextResponse.json({ remaining: 0, error: "Server error" }, { status: 500 });
    }
}
