import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { submitTest } from "@/server/actions/testSession";
import { isTestExpired } from "@/lib/timer";
import prisma from "@/lib/prisma";

// Called by timer expiry or tab violations
export async function POST() {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await submitTest(userId);

    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, score: result.score });
}

// GET: check if auto submit is needed (called by cron or polling)
export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return NextResponse.redirect(new URL("/", req.url));

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { redeemCode: true, testSession: true },
    });

    if (
        user?.testSession &&
        user?.redeemCode &&
        !user.testSession.isSubmitted &&
        isTestExpired(user.testSession.startedAt, user.redeemCode.duration)
    ) {
        await submitTest(userId);
        return NextResponse.redirect(new URL("/test/summary", req.url));
    }

    // Default: if submitted -> summary, if not -> test
    if (user?.testSession?.isSubmitted) {
        return NextResponse.redirect(new URL("/test/summary", req.url));
    }

    return NextResponse.redirect(new URL("/test", req.url));
}
