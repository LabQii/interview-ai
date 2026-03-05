import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateRemainingTime } from "@/lib/timer";

// HRD API to get all participants with real-time status
export async function GET(req: NextRequest) {
    const hrdToken = req.headers.get("x-hrd-token");

    if (!hrdToken || hrdToken !== process.env.HRD_SECRET_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await prisma.user.findMany({
            where: { role: "CANDIDATE" },
            include: {
                redeemCode: true,
                testSession: true,
                interview: true,
                tabSwitchLogs: { orderBy: { loggedAt: "desc" }, take: 5 },
            },
            orderBy: { createdAt: "desc" },
        });

        const participants = users.map((user) => {
            let remainingTime = 0;
            if (user.testSession && user.redeemCode && !user.testSession.isSubmitted) {
                remainingTime = calculateRemainingTime(
                    user.testSession.startedAt,
                    user.redeemCode.duration
                );
            }

            return {
                id: user.id,
                name: user.name,
                position: user.redeemCode?.position,
                score: user.testSession?.score,
                tabSwitchCount: user.testSession?.tabSwitchCount,
                isTestSubmitted: user.testSession?.isSubmitted,
                isInterviewSubmitted: user.interview?.isSubmitted,
                aiScore: user.interview?.aiScore,
                remainingTime,
                startedAt: user.testSession?.startedAt,
                submittedAt: user.testSession?.submittedAt,
            };
        });

        return NextResponse.json({ participants });
    } catch (error) {
        console.error("HRD participants error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// HRD force-submit a participant
export async function POST(req: NextRequest) {
    const hrdToken = req.headers.get("x-hrd-token");
    if (!hrdToken || hrdToken !== process.env.HRD_SECRET_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    try {
        const { submitTest } = await import("@/server/actions/testSession");
        const result = await submitTest(userId);
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: "Force submit failed" }, { status: 500 });
    }
}
